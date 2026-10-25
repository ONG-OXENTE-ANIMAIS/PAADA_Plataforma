import { ApiError } from "@/lib/api/errors";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import { CampanhasRepository } from "@/repositories/campanhas.repository";
import type { CampanhaRow } from "@/types/database.types";
import { atualizacaoCreateSchema, campanhaCreateSchema, campanhaUpdateSchema, imagemUpdateSchema, imagemUploadSchema, submetaCreateSchema } from "@/lib/validations/schemas";
import { uploadImagemCampanha } from "@/lib/supabase/storage";

const repo = new CampanhasRepository();

function publicCampaign(c: CampanhaRow) {
  return {
    id: c.id,
    slug: c.slug,
    titulo: c.titulo,
    descricao: c.descricao,
    categoria: c.categoria,
    localidade: c.localidade,
    status: c.status,
    valor_meta: Number(c.valor_meta),
    valor_arrecadado: Number(c.valor_arrecadado),
    data_inicio: c.data_inicio,
    data_termino: c.data_termino,
    mensal: c.mensal,
    destaque: c.destaque,
    visivel: c.visivel,
    criado_em: c.criado_em,
    atualizado_em: c.atualizado_em,
  };
}

/** Anexa a imagem de capa e o nº de apoiadores (doações PAGAS) a uma página de campanhas. */
async function enriquecer<T extends { id: string }>(rows: T[]) {
  if (!rows.length) return { imagem: new Map<string, string | null>(), apoiadores: new Map<string, number>() };
  const [imagens, doacoes] = await Promise.all([
    repo.imagesForCampaigns(rows.map((r) => r.id)),
    repo.paidDonationsForCampaigns(rows.map((r) => r.id)),
  ]);
  const imagem = new Map<string, string | null>();
  for (const img of imagens) {
    const atual = imagem.get(img.campanha_id);
    if (img.papel === "CAPA" || atual === undefined) imagem.set(img.campanha_id, img.url);
  }
  const apoiadores = new Map<string, number>();
  for (const d of doacoes) apoiadores.set(d.campanha_id, (apoiadores.get(d.campanha_id) ?? 0) + 1);
  return { imagem, apoiadores };
}

export const campanhasService = {
  async listPublic(filters: Parameters<CampanhasRepository["listPublic"]>[0]) {
    const result = await repo.listPublic(filters);
    const { imagem, apoiadores } = await enriquecer(result.data);
    return {
      data: result.data.map((c) => ({
        ...publicCampaign(c),
        imagem: imagem.get(c.id) ?? null,
        apoiadores: apoiadores.get(c.id) ?? 0,
      })),
      count: result.count,
    };
  },
  async listAdmin(filters: Parameters<CampanhasRepository["listAdmin"]>[0]) {
    const result = await repo.listAdmin(filters);
    const { imagem, apoiadores } = await enriquecer(result.data);
    return {
      data: result.data.map((c) => ({
        ...publicCampaign(c),
        imagem: imagem.get(c.id) ?? null,
        apoiadores: apoiadores.get(c.id) ?? 0,
      })),
      count: result.count,
    };
  },
  async getPublicById(id: string) {
    const campaign = await repo.findById(id);
    if (!campaign || campaign.status !== "ATIVA" || !campaign.visivel) throw new ApiError(404, "NOT_FOUND", "Campanha não encontrada.");
    return this.montarDetalhePublico(campaign);
  },
  async getBySlug(slug: string) {
    const campaign = await repo.findBySlug(slug);
    if (!campaign || campaign.status !== "ATIVA" || !campaign.visivel) throw new ApiError(404, "NOT_FOUND", "Campanha não encontrada.");
    return this.montarDetalhePublico(campaign);
  },
  async montarDetalhePublico(campaign: CampanhaRow) {
    const [images, goals, updates, doacoesPagas] = await Promise.all([
      repo.images(campaign.id),
      repo.goals(campaign.id),
      repo.updates(campaign.id),
      repo.paidDonationsForCampaigns([campaign.id]),
    ]);
    const capa = images.find((img) => img.papel === "CAPA") ?? images[0];
    return {
      campanha: {
        ...publicCampaign(campaign),
        imagem: capa?.url ?? null,
        apoiadores: doacoesPagas.length,
      },
      imagens: images,
      submetas: goals,
      atualizacoes: updates,
    };
  },
  async getAdminById(id: string) {
    const campaign = await repo.findById(id);
    if (!campaign) throw new ApiError(404, "NOT_FOUND", "Campanha não encontrada.");
    const [images, goals, updates] = await Promise.all([repo.images(id), repo.goals(id), repo.updates(id, true)]);
    return { campanha: publicCampaign(campaign), imagens: images, submetas: goals, atualizacoes: updates };
  },
  async create(input: unknown) {
    const data = campanhaCreateSchema.parse(input);
    const existing = await repo.findBySlug(data.slug ?? slugify(data.titulo));
    const slug = existing ? uniqueSlug(data.titulo) : (data.slug ?? slugify(data.titulo));
    return publicCampaign(await repo.create({
      ...data,
      slug,
      descricao: data.descricao ?? null,
      categoria: data.categoria ?? null,
      localidade: data.localidade ?? null,
      data_inicio: data.data_inicio ?? new Date().toISOString().slice(0, 10),
      data_termino: data.data_termino ?? null,
    }));
  },
  async update(id: string, input: unknown) {
    const data = campanhaUpdateSchema.parse(input);
    if (data.slug && data.slug !== slugify(data.slug)) data.slug = slugify(data.slug);
    const updated = await repo.update(id, data);
    if (!updated) throw new ApiError(404, "NOT_FOUND", "Campanha não encontrada.");
    return publicCampaign(updated);
  },
  async remove(id: string) {
    const campaign = await repo.findById(id);
    if (!campaign) throw new ApiError(404, "NOT_FOUND", "Campanha não encontrada.");
    if (await repo.hasDonations(id)) throw new ApiError(409, "CAMPAIGN_HAS_DONATIONS", "Campanhas com doações não podem ser excluídas para preservar o histórico financeiro.");
    await repo.remove(id);
  },
  async listImages(campanhaId: string) {
    await this.assertCampaign(campanhaId);
    return repo.images(campanhaId);
  },
  async createImage(campanhaId: string, input: unknown) {
    await this.assertCampaign(campanhaId);
    const data = imagemUploadSchema.parse(input);
    const url = data.arquivo ? await uploadImagemCampanha(data.arquivo, campanhaId) : (data.url as string);
    return repo.createImage({
      url,
      descricao: data.descricao ?? null,
      papel: data.papel,
      ordem: data.ordem,
      campanha_id: campanhaId,
    });
  },
  async updateImage(campanhaId: string, id: string, input: unknown) {
    await this.assertCampaign(campanhaId);
    const data = imagemUpdateSchema.parse(input);
    const url = data.arquivo ? await uploadImagemCampanha(data.arquivo, campanhaId) : data.url;
    const image = await repo.updateImage(campanhaId, id, { ...data, url });
    if (!image) throw new ApiError(404, "NOT_FOUND", "Imagem não encontrada.");
    return image;
  },
  async removeImage(campanhaId: string, id: string) {
    await this.assertCampaign(campanhaId);
    const image = await repo.findImage(campanhaId, id);
    if (!image) throw new ApiError(404, "NOT_FOUND", "Imagem não encontrada.");
    await repo.removeImage(campanhaId, id);
  },
  async listGoals(campanhaId: string) {
    await this.assertCampaign(campanhaId);
    return repo.goals(campanhaId);
  },
  async createGoal(campanhaId: string, input: unknown) {
    await this.assertCampaign(campanhaId);
    return repo.createGoal({ ...submetaCreateSchema.parse(input), campanha_id: campanhaId });
  },
  async updateGoal(campanhaId: string, id: string, input: unknown) {
    await this.assertCampaign(campanhaId);
    const goal = await repo.updateGoal(campanhaId, id, submetaCreateSchema.partial().parse(input));
    if (!goal) throw new ApiError(404, "NOT_FOUND", "Submeta não encontrada.");
    return goal;
  },
  async removeGoal(campanhaId: string, id: string) {
    await this.assertCampaign(campanhaId);
    const goal = await repo.findGoal(campanhaId, id);
    if (!goal) throw new ApiError(404, "NOT_FOUND", "Submeta não encontrada.");
    await repo.removeGoal(campanhaId, id);
  },
  async listUpdates(campanhaId: string, includePrivate = false) {
    await this.assertCampaign(campanhaId);
    return repo.updates(campanhaId, includePrivate);
  },
  async createUpdate(campanhaId: string, input: unknown) {
    await this.assertCampaign(campanhaId);
    const data = atualizacaoCreateSchema.parse(input);
    return repo.createUpdate({ ...data, campanha_id: campanhaId, data_publicacao: data.data_publicacao ?? new Date().toISOString() });
  },
  async updateUpdate(campanhaId: string, id: string, input: unknown) {
    await this.assertCampaign(campanhaId);
    const data = atualizacaoCreateSchema.partial().parse(input);
    const update = await repo.updateUpdate(campanhaId, id, data);
    if (!update) throw new ApiError(404, "NOT_FOUND", "Atualização não encontrada.");
    return update;
  },
  async removeUpdate(campanhaId: string, id: string) {
    await this.assertCampaign(campanhaId);
    const update = await repo.findUpdate(campanhaId, id);
    if (!update) throw new ApiError(404, "NOT_FOUND", "Atualização não encontrada.");
    await repo.removeUpdate(campanhaId, id);
  },
  async assertCampaign(campanhaId: string) {
    const campaign = await repo.findById(campanhaId);
    if (!campaign) throw new ApiError(404, "NOT_FOUND", "Campanha não encontrada.");
    return campaign;
  },
};
