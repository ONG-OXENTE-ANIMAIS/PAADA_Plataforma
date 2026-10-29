import { ApiError } from "@/lib/api/errors";

function baseUrl() {
  return process.env.EFI_SANDBOX !== "false"
    ? "https://sandbox.efipay.com.br"
    : "https://api.efipay.com.br";
}

type EfiToken = { access_token: string; expiresAt: number };

let tokenCache: EfiToken | null = null;

async function obterToken(): Promise<string> {
  const agora = Date.now();
  if (tokenCache && agora < tokenCache.expiresAt - 60_000) {
    return tokenCache.access_token;
  }
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(
      503,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "O provedor de pagamento (Efi) ainda não foi configurado.",
    );
  }
  const credenciais = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${baseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credenciais}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "Não foi possível autenticar no Efi.");
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  tokenCache = {
    access_token: data.access_token,
    expiresAt: agora + (Number(data.expires_in) || 3000) * 1000,
  };
  return data.access_token;
}

async function efiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token = await obterToken();
  let response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (response.status === 401) {
    tokenCache = null;
    token = await obterToken();
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
    });
  }
  return response;
}

export type PagamentoPreferencia = {
  id: string;
  checkoutUrl: string;
  qrCode: string;
  qrcodeBase64: string;
  initPoint: string;
  sandboxInitPoint: string | null;
  expiresAt: string | null;
};

export async function criarCobrancaPagamento(input: {
  donationId: string;
  donationToken: string;
  campaignSlug: string;
  txid: string;
  amount: number;
  campaignTitle: string;
  payerEmail?: string;
  payerName?: string;
}): Promise<PagamentoPreferencia> {
  const chave = process.env.EFI_PIX_KEY;
  if (!chave) {
    throw new ApiError(
      503,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "A chave Pix do Efi não foi configurada.",
    );
  }

  const corpo: Record<string, unknown> = {
    txid: input.txid,
    valor: { original: input.amount.toFixed(2) },
    chave,
    calendario: { expiracao: 60 * 60 }, // 1 hora
    solicitacaoPagador: `Doacao ${input.campaignTitle} (${input.donationId})`,
  };
  if (input.payerEmail || input.payerName) {
    corpo.infoPagador = {
      ...(input.payerName ? { nome: input.payerName } : {}),
      ...(input.payerEmail ? { email: input.payerEmail } : {}),
    };
  }

  const resposta = await efiFetch("/v2/cob", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    throw new ApiError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      `O Efi não conseguiu criar a cobrança${detalhe ? `: ${detalhe}` : ""}`.slice(0, 200),
    );
  }
  const cob = (await resposta.json()) as {
    txid: string;
    status: string;
    loc: { id: string };
    calendario?: { expiracao?: number };
  };

  let qrCode = "";
  let qrcodeBase64 = "";
  try {
    const qr = await efiFetch(`/v2/loc/${encodeURIComponent(cob.loc.id)}/qrcode`);
    if (qr.ok) {
      const dados = (await qr.json()) as { qrcode?: string; qrCode?: string };
      qrcodeBase64 = dados.qrcode ?? "";
      qrCode = dados.qrCode ?? "";
    }
  } catch {
    // QR secundário: a cobrança segue válida mesmo se a imagem falhar
  }

  return {
    id: cob.txid,
    checkoutUrl: qrCode || cob.txid,
    qrCode,
    qrcodeBase64,
    initPoint: qrCode || cob.txid,
    sandboxInitPoint: null,
    expiresAt: cob.calendario?.expiracao
      ? new Date(Date.now() + cob.calendario.expiracao * 1000).toISOString()
      : null,
  };
}

export function statusEfiParaDoacao(status: string): "approved" | "pending" | "rejected" {
  switch (status) {
    case "CONCLUIDA":
      return "approved";
    case "ATIVA":
      return "pending";
    case "EXPIRADA":
    case "REMOVIDA_PELO_USUARIO_RECEBEDOR":
    case "REMOVIDA_PELO_RECEBEDOR":
      return "rejected";
    default:
      return "pending";
  }
}

export async function consultarPagamento(txid: string) {
  const resposta = await efiFetch(`/v2/cob/${encodeURIComponent(txid)}`);
  if (!resposta.ok) {
    throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "Não foi possível consultar o pagamento no Efi.");
  }
  const data = (await resposta.json()) as {
    txid: string;
    status: string;
    valor?: { original: number };
  };
  return {
    id: data.txid,
    status: statusEfiParaDoacao(data.status),
    transaction_amount: data.valor?.original ?? 0,
  };
}
