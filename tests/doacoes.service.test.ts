import { beforeEach, describe, expect, it, vi } from "vitest";

const doacoesRepo = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  setStatus: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  confirm: vi.fn(),
}));

const campanhasRepo = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const criarPreferencia = vi.hoisted(() => vi.fn());

vi.mock("@/repositories/doacoes.repository", () => ({
  DoacoesRepository: vi.fn(() => doacoesRepo),
}));
vi.mock("@/repositories/campanhas.repository", () => ({
  CampanhasRepository: vi.fn(() => campanhasRepo),
}));
vi.mock("@/lib/payments/mercadopago", () => ({
  criarPreferenciaPagamento: criarPreferencia,
}));

import { doacoesService } from "@/services/doacoes.service";
import { ApiError } from "@/lib/api/errors";

const campanhaAtiva = {
  id: "CMP1",
  slug: "vaquinha-teste",
  titulo: "Vaquinha Teste",
  status: "ATIVA",
  meta_isvisible: true,
  mensal: true,
  data_fim: null,
  meta_arrecadacao: 1000,
  valor_arrecadado: 0,
};

const payload = {
  campanha_id: "CMP1",
  valor: 50,
  nome: "Maria",
  email: "maria@exemplo.com",
  anonimo: false,
  mensal: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "token-de-teste";
  campanhasRepo.findById.mockResolvedValue(campanhaAtiva);
  doacoesRepo.create.mockImplementation((values: Record<string, unknown>) =>
    Promise.resolve({ id: "DOA1", token_publico: "tok-1", ...values }),
  );
  doacoesRepo.update.mockResolvedValue({});
  doacoesRepo.setStatus.mockResolvedValue({});
  criarPreferencia.mockResolvedValue({
    id: "pref-1",
    checkoutUrl: "https://mp.example/checkout",
    initPoint: "https://mp.example/checkout",
    sandboxInitPoint: null,
  });
});

describe("doacoesService.create", () => {
  it("rejeita quando o provedor não está configurado (503)", async () => {
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    await expect(doacoesService.create(payload)).rejects.toMatchObject({
      status: 503,
      code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
    });
  });

  it("rejeita campanha inexistente (422)", async () => {
    campanhasRepo.findById.mockResolvedValue(null);
    await expect(doacoesService.create(payload)).rejects.toMatchObject({ status: 422 });
  });

  it("rejeita campanha pausada (422)", async () => {
    campanhasRepo.findById.mockResolvedValue({ ...campanhaAtiva, status: "PAUSADA" });
    await expect(doacoesService.create(payload)).rejects.toMatchObject({ status: 422 });
  });

  it("rejeita campanha encerrada (422)", async () => {
    campanhasRepo.findById.mockResolvedValue({
      ...campanhaAtiva,
      data_fim: "2000-01-01",
    });
    await expect(doacoesService.create(payload)).rejects.toMatchObject({
      status: 422,
      code: "CAMPAIGN_ENDED",
    });
  });

  it("rejeita doação mensal em campanha não recorrente (422)", async () => {
    campanhasRepo.findById.mockResolvedValue({ ...campanhaAtiva, mensal: false });
    await expect(doacoesService.create({ ...payload, mensal: true })).rejects.toMatchObject({
      status: 422,
      code: "RECURRING_NOT_ALLOWED",
    });
  });

  it("rejeita doação anônima com e-mail (400)", async () => {
    await expect(
      doacoesService.create({ ...payload, anonimo: true }),
    ).rejects.toMatchObject({ status: 400, code: "ANONYMOUS_EMAIL" });
  });

  it("cria doação PENDENTE e retorna checkout_url do provedor", async () => {
    const resultado = await doacoesService.create(payload);
    expect(doacoesRepo.create).toHaveBeenCalledTimes(1);
    const valores = doacoesRepo.create.mock.calls[0][0];
    expect(valores.status).toBe("PENDENTE");
    expect(valores.txid).toMatch(/^PAADA-/);
    expect(criarPreferencia).toHaveBeenCalledTimes(1);
    expect(criarPreferencia.mock.calls[0][0]).toMatchObject({
      donationId: "DOA1",
      campaignSlug: "vaquinha-teste",
      amount: 50,
      payerEmail: "maria@exemplo.com",
    });
    expect(resultado.checkout_url).toBe("https://mp.example/checkout");
    expect(resultado.donation.status).toBe("PENDENTE");
  });

  it("cancela a doação se o provedor falhar e relança o erro", async () => {
    criarPreferencia.mockRejectedValue(new ApiError(502, "PAYMENT_PROVIDER_ERROR", "boom"));
    await expect(doacoesService.create(payload)).rejects.toMatchObject({ status: 502 });
    expect(doacoesRepo.setStatus).toHaveBeenCalledWith("DOA1", "CANCELADA");
  });
});

describe("doacoesService.updateStatus", () => {
  it("impede cancelar doação já paga (409)", async () => {
    doacoesRepo.findById.mockResolvedValue({ id: "DOA1", status: "PAGA", valor: 50 });
    await expect(
      doacoesService.updateStatus("DOA1", { status: "CANCELADA" }),
    ).rejects.toMatchObject({ status: 409, code: "INVALID_STATUS_CHANGE" });
  });

  it("delega reembolso/cancelamento à função atômica do banco", async () => {
    doacoesRepo.findById.mockResolvedValue({ id: "DOA2", status: "PAGA", valor: 30 });
    doacoesRepo.setStatus.mockResolvedValue({});
    await doacoesService.updateStatus("DOA2", { status: "REEMBOLSADA" });
    expect(doacoesRepo.setStatus).toHaveBeenCalledWith("DOA2", "REEMBOLSADA");
  });
});

describe("doacoesService.getPublic", () => {
  it("exige token público correto (senão 404)", async () => {
    doacoesRepo.findById.mockResolvedValue({
      id: "DOA1",
      status: "PAGA",
      valor: 50,
      campanha_id: "CMP1",
    });
    await expect(
      doacoesService.getPublic("DOA1", "token-errado"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      doacoesService.getPublic("DOA1", "DOA1"),
    ).resolves.toMatchObject({ status: "PAGA" });
  });
});
