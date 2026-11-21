import { createAdminClient } from "@/lib/supabase/admin";
import type { AtualizacaoRow, CampanhaRow, ImagemRow, SubmetaRow } from "@/types/database.types";

export function parseSqlId(id: string | number): string | number {
  return typeof id === "string" && /^\d+$/.test(id.trim()) ? Number(id.trim()) : id;
}

export class CampanhasRepository {
  private db() { return createAdminClient(); }

  async listPublic(filters: { q?: string; categoria?: string; localidade?: string; destaque?: boolean; mensal?: boolean; from: number; to: number }) {
    const db = this.db();
    let query = db.from("campanhas").select("*", { count: "exact" }).eq("status", "ATIVA").eq("meta_isvisible", true);
    if (filters.q) query = query.or(`titulo.ilike.%${filters.q}%,descricao.ilike.%${filters.q}%`);
    if (filters.categoria) query = query.eq("categoria", filters.categoria);
    if (filters.localidade) query = query.ilike("localidade", `%${filters.localidade}%`);
    if (typeof filters.destaque === "boolean") query = query.eq("destaque", filters.destaque);
    if (typeof filters.mensal === "boolean") query = query.eq("mensal", filters.mensal);
    const { data, error, count } = await query.order("destaque", { ascending: false }).order("criada_em", { ascending: false }).range(filters.from, filters.to);
    if (error) throw error;
    return { data: (data ?? []) as CampanhaRow[], count: count ?? 0 };
  }

  async listAdmin(filters: { q?: string; status?: string; from: number; to: number }) {
    const db = this.db();
    let query = db.from("campanhas").select("*", { count: "exact" });
    if (filters.q) query = query.or(`titulo.ilike.%${filters.q}%,slug.ilike.%${filters.q}%`);
    if (filters.status) query = query.eq("status", filters.status as CampanhaRow["status"]);
    const { data, error, count } = await query.order("criada_em", { ascending: false }).range(filters.from, filters.to);
    if (error) throw error;
    return { data: (data ?? []) as CampanhaRow[], count: count ?? 0 };
  }

  async findById(id: string | number) {
    const { data, error } = await this.db().from("campanhas").select("*").eq("id", parseSqlId(id)).maybeSingle();
    if (error) throw error;
    return data as CampanhaRow | null;
  }

  async findBySlug(slug: string) {
    const { data, error } = await this.db().from("campanhas").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data as CampanhaRow | null;
  }

  async create(values: Partial<CampanhaRow> & Pick<CampanhaRow, "titulo" | "slug">) {
    const { data, error } = await this.db().from("campanhas").insert(values).select("*").single();
    if (error) throw error;
    return data as CampanhaRow;
  }

  async update(id: string | number, values: Partial<CampanhaRow>) {
    const { data, error } = await this.db().from("campanhas").update(values).eq("id", parseSqlId(id)).select("*").maybeSingle();
    if (error) throw error;
    return data as CampanhaRow | null;
  }

  async remove(id: string | number) {
    const { error } = await this.db().from("campanhas").delete().eq("id", parseSqlId(id));
    if (error) throw error;
  }

  async hasDonations(id: string | number) {
    const { count, error } = await this.db().from("doacoes").select("id", { count: "exact", head: true }).eq("campanha_id", parseSqlId(id));
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async imagesForCampaigns(ids: (string | number)[]) {
    if (!ids.length) return [] as ImagemRow[];
    const parsedIds = ids.map(parseSqlId);
    const { data, error } = await this.db().from("imagens_campanhas").select("*").in("campanha_id", parsedIds as any).order("ordem");
    if (error) throw error;
    return (data ?? []) as ImagemRow[];
  }

  async paidDonationsForCampaigns(ids: (string | number)[]) {
    if (!ids.length) return [] as { campanha_id: string | number }[];
    const parsedIds = ids.map(parseSqlId);
    const { data, error } = await this.db().from("doacoes").select("campanha_id").in("campanha_id", parsedIds as any).eq("status", "PAGA");
    if (error) throw error;
    return (data ?? []) as { campanha_id: string | number }[];
  }

  async images(campanhaId: string | number) {
    const { data, error } = await this.db().from("imagens_campanhas").select("*").eq("campanha_id", parseSqlId(campanhaId)).order("ordem");
    if (error) throw error;
    return (data ?? []) as ImagemRow[];
  }

  async createImage(values: Partial<ImagemRow> & Pick<ImagemRow, "campanha_id" | "url">) {
    const payload = { ...values, campanha_id: parseSqlId(values.campanha_id) };
    const { data, error } = await this.db().from("imagens_campanhas").insert(payload).select("*").single();
    if (error) throw error;
    return data as ImagemRow;
  }

  async findImage(campanhaId: string | number, id: string | number) {
    const { data, error } = await this.db().from("imagens_campanhas").select("*").eq("campanha_id", parseSqlId(campanhaId)).eq("id", parseSqlId(id)).maybeSingle();
    if (error) throw error;
    return data as ImagemRow | null;
  }

  async updateImage(campanhaId: string | number, id: string | number, values: Partial<ImagemRow>) {
    const { data, error } = await this.db().from("imagens_campanhas").update(values).eq("campanha_id", parseSqlId(campanhaId)).eq("id", parseSqlId(id)).select("*").maybeSingle();
    if (error) throw error;
    return data as ImagemRow | null;
  }

  async removeImage(campanhaId: string | number, id: string | number) {
    const { error } = await this.db().from("imagens_campanhas").delete().eq("campanha_id", parseSqlId(campanhaId)).eq("id", parseSqlId(id));
    if (error) throw error;
  }

  async goals(campanhaId: string | number) {
    const { data, error } = await this.db().from("submetas_campanhas").select("*").eq("campanha_id", parseSqlId(campanhaId)).order("ordem");
    if (error) throw error;
    return (data ?? []) as SubmetaRow[];
  }

  async createGoal(values: Partial<SubmetaRow> & Pick<SubmetaRow, "campanha_id" | "titulo" | "valor">) {
    const payload = { ...values, campanha_id: parseSqlId(values.campanha_id) };
    const { data, error } = await this.db().from("submetas_campanhas").insert(payload).select("*").single();
    if (error) throw error;
    return data as SubmetaRow;
  }

  async findGoal(campanhaId: string | number, id: string | number) {
    const { data, error } = await this.db().from("submetas_campanhas").select("*").eq("campanha_id", parseSqlId(campanhaId)).eq("id", parseSqlId(id)).maybeSingle();
    if (error) throw error;
    return data as SubmetaRow | null;
  }

  async updateGoal(campanhaId: string | number, id: string | number, values: Partial<SubmetaRow>) {
    const { data, error } = await this.db().from("submetas_campanhas").update(values).eq("campanha_id", parseSqlId(campanhaId)).eq("id", parseSqlId(id)).select("*").maybeSingle();
    if (error) throw error;
    return data as SubmetaRow | null;
  }

  async removeGoal(campanhaId: string | number, id: string | number) {
    const { error } = await this.db().from("submetas_campanhas").delete().eq("campanha_id", parseSqlId(campanhaId)).eq("id", parseSqlId(id));
    if (error) throw error;
  }

  async updates(campanhaId: string | number, includePrivate = false) {
    let query = this.db().from("atualizacoes_campanhas").select("*").eq("campanha_id", parseSqlId(campanhaId));
    const { data, error } = await query.order("titulo", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AtualizacaoRow[];
  }

  async createUpdate(values: Partial<AtualizacaoRow> & Pick<AtualizacaoRow, "campanha_id" | "titulo" | "texto">) {
    const { data, error } = await this.db().from("atualizacoes_campanhas").insert(values).select("*").single();
    if (error) throw error;
    return data as AtualizacaoRow;
  }

  async findUpdate(campanhaId: string, id: string) {
    const { data, error } = await this.db().from("atualizacoes_campanhas").select("*").eq("campanha_id", campanhaId).eq("id", id).maybeSingle();
    if (error) throw error;
    return data as AtualizacaoRow | null;
  }

  async updateUpdate(campanhaId: string, id: string, values: Partial<AtualizacaoRow>) {
    const { data, error } = await this.db().from("atualizacoes_campanhas").update(values).eq("campanha_id", campanhaId).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as AtualizacaoRow | null;
  }

  async removeUpdate(campanhaId: string, id: string) {
    const { error } = await this.db().from("atualizacoes_campanhas").delete().eq("campanha_id", campanhaId).eq("id", id);
    if (error) throw error;
  }

  /**
   * Finaliza campanhas ATIVA cuja data_inicio foi há 10 ou mais dias.
   * Retorna o número de campanhas finalizadas.
   */
  async finalizarCampanhasAntigas(): Promise<number> {
    const db = this.db();
    const dezDiasAtras = new Date();
    dezDiasAtras.setDate(dezDiasAtras.getDate() - 10);
    const dataLimite = dezDiasAtras.toISOString().slice(0, 10);

    const { data, error } = await db
      .from("campanhas")
      .update({ status: "CONCLUIDA", atualizado_em: new Date().toISOString() })
      .eq("status", "ATIVA")
      .lte("data_inicio", dataLimite)
      .select("id");

    if (error) throw error;
    return data?.length ?? 0;
  }
}
