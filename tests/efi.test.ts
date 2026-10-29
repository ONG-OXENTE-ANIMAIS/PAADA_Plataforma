import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarCobrancaPagamento, consultarPagamento, statusEfiParaDoacao } from "@/lib/payments/efi";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
  process.env.EFI_CLIENT_ID = "client-id-teste";
  process.env.EFI_CLIENT_SECRET = "client-secret-teste";
  process.env.EFI_PIX_KEY = "chave-pix-teste";
});

afterEach(() => {
  vi.restoreAllMocks();
  fetchMock.mockClear();
  delete process.env.EFI_CLIENT_ID;
  delete process.env.EFI_CLIENT_SECRET;
  delete process.env.EFI_PIX_KEY;
});

function respostaJson(body: unknown, status = 200) {
  return {
    ok: true,
    status,
    json: async () => body,
    text: async () => "",
  } as unknown as Response;
}

function respostaErro(status = 400, texto = "erro") {
  return { ok: false, status, json: async () => ({}), text: async () => texto } as unknown as Response;
}

describe("statusEfiParaDoacao", () => {
  it("mapeia CONCLUIDA para approved", () => {
    expect(statusEfiParaDoacao("CONCLUIDA")).toBe("approved");
  });
  it("mapeia ATIVA para pending", () => {
    expect(statusEfiParaDoacao("ATIVA")).toBe("pending");
  });
  it("mapeia status finais para rejected", () => {
    expect(statusEfiParaDoacao("EXPIRADA")).toBe("rejected");
    expect(statusEfiParaDoacao("REMOVIDA_PELO_USUARIO_RECEBEDOR")).toBe("rejected");
    expect(statusEfiParaDoacao("DESCONHECIDA")).toBe("pending");
  });
});

describe("criarCobrancaPagamento", () => {
  it("lança 503 quando o Efi não está configurado", async () => {
    delete process.env.EFI_CLIENT_ID;
    delete process.env.EFI_CLIENT_SECRET;
    await expect(
      criarCobrancaPagamento({
        donationId: "DOA1",
        donationToken: "DOA1",
        campaignSlug: "vaquinha",
        txid: "PAADA-123",
        amount: 50,
        campaignTitle: "Vaquinha",
      }),
    ).rejects.toMatchObject({ status: 503, code: "PAYMENT_PROVIDER_NOT_CONFIGURED" });
  });

  it("cria cobrança Pix, busca o QR e retorna os dados", async () => {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (u.endsWith("/oauth/token")) return respostaJson({ access_token: "tok-efi", expires_in: 3600 });
      if (u.endsWith("/v2/cob")) {
        const init = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]?.[1] as { body?: string } | undefined;
        const corpo = JSON.parse(init?.body ?? "{}");
        expect(corpo.txid).toBe("PAADA-123");
        expect(corpo.valor.original).toBe("25.00");
        expect(corpo.chave).toBe("chave-pix-teste");
        return respostaJson({ txid: "PAADA-123", status: "ATIVA", loc: { id: "LOC1" }, calendario: { expiracao: 3600 } });
      }
      if (u.includes("/v2/loc/LOC1/qrcode")) {
        return respostaJson({ qrCode: "00020126...payload", qrcode: "iVBORw0KGgo==" });
      }
      return respostaErro(404);
    });

    const resultado = await criarCobrancaPagamento({
      donationId: "DOA1",
      donationToken: "DOA1",
      campaignSlug: "vaquinha-teste",
      txid: "PAADA-123",
      amount: 25,
      campaignTitle: "Vaquinha Teste",
      payerEmail: "maria@exemplo.com",
      payerName: "Maria",
    });

    expect(resultado).toMatchObject({
      id: "PAADA-123",
      checkoutUrl: "00020126...payload",
      qrCode: "00020126...payload",
      qrcodeBase64: "iVBORw0KGgo==",
      sandboxInitPoint: null,
    });
    expect(resultado.expiresAt).toBeTruthy();

    const chamadas = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(chamadas.some((u) => u.endsWith("/oauth/token"))).toBe(true);
    expect(chamadas.some((u) => u.endsWith("/v2/cob"))).toBe(true);
    expect(chamadas.some((u) => u.includes("/v2/loc/LOC1/qrcode"))).toBe(true);
  });

  it("reutiliza o token de acesso (uma só autenticacao)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).endsWith("/oauth/token")) return respostaJson({ access_token: "tok-efi", expires_in: 3600 });
      if (String(url).endsWith("/v2/cob"))
        return respostaJson({ txid: "PAADA-X", status: "ATIVA", loc: { id: "LOC2" } });
      if (String(url).includes("/v2/loc/LOC2/qrcode")) return respostaJson({ qrCode: "payload", qrcode: "base64" });
      return respostaErro(404);
    });

    await criarCobrancaPagamento({ donationId: "A", donationToken: "A", campaignSlug: "s", txid: "PAADA-A", amount: 1, campaignTitle: "T" });
    await criarCobrancaPagamento({ donationId: "B", donationToken: "B", campaignSlug: "s", txid: "PAADA-B", amount: 1, campaignTitle: "T" });

    const oauth = fetchMock.mock.calls.filter((c) => (c[0] as string).endsWith("/oauth/token"));
    // O token ja estava em cache do teste anterior: nenhuma autenticacao nova deve ocorrer
    expect(oauth).toHaveLength(0);
    const cob = fetchMock.mock.calls.filter((c) => (c[0] as string).endsWith("/v2/cob"));
    expect(cob).toHaveLength(2);
  });

  it("propaga erro do Efi (502)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).endsWith("/oauth/token")) return respostaJson({ access_token: "tok-efi", expires_in: 3600 });
      return respostaErro(400, "txid invalido");
    });

    await expect(
      criarCobrancaPagamento({ donationId: "DOA1", donationToken: "DOA1", campaignSlug: "s", txid: "PAADA-1", amount: 1, campaignTitle: "T" }),
    ).rejects.toMatchObject({ status: 502, code: "PAYMENT_PROVIDER_ERROR" });
  });
});

describe("consultarPagamento", () => {
  it("retorna approved quando a cobranca esta CONCLUIDA", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).endsWith("/oauth/token")) return respostaJson({ access_token: "tok-efi", expires_in: 3600 });
      if (String(url).endsWith("/v2/cob/TX1"))
        return respostaJson({ txid: "TX1", status: "CONCLUIDA", valor: { original: 50 } });
      return respostaErro(404);
    });

    const pagamento = await consultarPagamento("TX1");
    expect(pagamento).toMatchObject({ id: "TX1", status: "approved", transaction_amount: 50 });
  });

  it("retorna pending quando a cobranca esta ATIVA", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).endsWith("/oauth/token")) return respostaJson({ access_token: "tok-efi", expires_in: 3600 });
      if (String(url).endsWith("/v2/cob/TX2")) return respostaJson({ txid: "TX2", status: "ATIVA" });
      return respostaErro(404);
    });

    const pagamento = await consultarPagamento("TX2");
    expect(pagamento.status).toBe("pending");
  });

  it("lança 502 quando a consulta falha", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).endsWith("/oauth/token")) return respostaJson({ access_token: "tok-efi", expires_in: 3600 });
      return respostaErro(500);
    });

    await expect(consultarPagamento("TX3")).rejects.toMatchObject({ status: 502, code: "PAYMENT_PROVIDER_ERROR" });
  });
});
