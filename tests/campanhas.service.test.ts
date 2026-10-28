import { beforeEach, describe, expect, it, vi } from "vitest";

const campanhasRepo = vi.hoisted(() => ({
  findById: vi.fn(),
  findBySlug: vi.fn(),
  listPublic: vi.fn(),
  listAdmin: vi.fn(),
  imagesForCampaigns: vi.fn(),
  paidDonationsForCampaigns: vi.fn(),
  images: vi.fn(),
  goals: vi.fn(),
  updates: vi.fn(),
  hasDonations: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/repositories/campanhas.repository", () => ({
  CampanhasRepository: vi.fn(() => campanhasRepo),
}));

vi.mock("@/lib/supabase/storage", () => ({
  uploadImagemCampanha: vi.fn(async (dataUrl: string) => dataUrl),
}));

import { campanhasService } from "@/services/campanhas.service";

const campanhaPublica = {
  id: "CMP1",
  slug: "vaquinha-teste",
  titulo: "Vaquinha Teste",
  descricao: "Primeiro parágrafo.\n\nSegundo parágrafo.",
  categoria: "Resgate",
  localidade: "Recife, PE",
  status: "ATIVA",
  meta_arrecadacao: 1000,
  valor_arrecadado: 250,
  data_inicio: "2025-01-01",
  data_fim: "2025-12-31",
  mensal: false,
  destaque: true,
  meta_isvisible: true,
  criada_em: "2025-01-01T00:00:00Z",
  atualizado_em: "2025-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("visibilidade pública das campanhas", () => {
  it("getBySlug 404 para campanha em rascunho", async () => {
    campanhasRepo.findBySlug.mockResolvedValue({ ...campanhaPublica, status: "RASCUNHO" });
    await expect(campanhasService.getBySlug("vaquinha-teste")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("getBySlug 404 para campanha oculta", async () => {
    campanhasRepo.findBySlug.mockResolvedValue({ ...campanhaPublica, meta_isvisible: false });
    await expect(campanhasService.getBySlug("vaquinha-teste")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("getBySlug 404 quando não existe", async () => {
    campanhasRepo.findBySlug.mockResolvedValue(null);
    await expect(campanhasService.getBySlug("fantasma")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("listPublic só recebe campanhas ativas e visíveis (filtro do repo)", async () => {
    campanhasRepo.listPublic.mockResolvedValue({ data: [campanhaPublica], count: 1 });
    campanhasRepo.imagesForCampaigns.mockResolvedValue([]);
    campanhasRepo.paidDonationsForCampaigns.mockResolvedValue([
      { campanha_id: "CMP1" },
      { campanha_id: "CMP1" },
      { campanha_id: "CMP1" },
    ]);
    const resultado = await campanhasService.listPublic({ q: undefined, categoria: undefined, localidade: undefined, destaque: undefined, mensal: undefined, from: 0, to: 19 });
    expect(resultado.data[0].apoiadores).toBe(3);
    expect(resultado.data[0].valor_arrecadado).toBe(250);
  });
});

describe("integridade financeira na exclusão", () => {
  it("impede excluir campanha com doações (409)", async () => {
    campanhasRepo.findById.mockResolvedValue(campanhaPublica);
    campanhasRepo.hasDonations.mockResolvedValue(true);
    await expect(campanhasService.remove("CMP1")).rejects.toMatchObject({
      status: 409,
      code: "CAMPAIGN_HAS_DONATIONS",
    });
    expect(campanhasRepo.remove).not.toHaveBeenCalled();
  });

  it("exclui campanha sem doações", async () => {
    campanhasRepo.findById.mockResolvedValue(campanhaPublica);
    campanhasRepo.hasDonations.mockResolvedValue(false);
    campanhasRepo.remove.mockResolvedValue(undefined);
    await campanhasService.remove("CMP1");
    expect(campanhasRepo.remove).toHaveBeenCalledWith("CMP1");
  });
});

describe("detalhe público", () => {
  it("monta detalhe com capa, apoiadores, submetas e atualizações", async () => {
    campanhasRepo.findBySlug.mockResolvedValue(campanhaPublica);
    campanhasRepo.images.mockResolvedValue([
      { id: "I2", campanha_id: "CMP1", url: "https://img/galeria.jpg", papel: "GALERIA", ordem: 2, descricao: null, criado_em: "" },
      { id: "I1", campanha_id: "CMP1", url: "https://img/capa.jpg", papel: "CAPA", ordem: 0, descricao: null, criado_em: "" },
    ]);
    campanhasRepo.goals.mockResolvedValue([]);
    campanhasRepo.updates.mockResolvedValue([]);
    campanhasRepo.paidDonationsForCampaigns.mockResolvedValue([{ campanha_id: "CMP1" }]);

    const detalhe = await campanhasService.getBySlug("vaquinha-teste");
    expect(detalhe.campanha.imagem).toBe("https://img/capa.jpg");
    expect(detalhe.campanha.apoiadores).toBe(1);
  });
});
