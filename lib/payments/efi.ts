import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { ApiError } from "@/lib/api/errors";

function baseUrl() {
  if (process.env.EFI_API_URL) {
    return process.env.EFI_API_URL.replace(/\/+$/, "");
  }
  return process.env.EFI_SANDBOX === "false"
    ? "https://pix.api.efipay.com.br"
    : "https://pix-h.api.efipay.com.br";
}

type EfiToken = { access_token: string; expiresAt: number };

let tokenCache: EfiToken | null = null;

/**
 * Carrega o certificado .pem (contendo certificado público + chave privada)
 * a partir de EFI_CERTIFICATE_PEM (conteúdo direto ou Base64) ou EFI_CERTIFICATE_PATH.
 */
function carregarCertificadoPem(): Buffer | null {
  if (process.env.VITEST && process.env.EFI_FORCE_MTLS !== "true") {
    return null;
  }

  const inlinePem = process.env.EFI_CERTIFICATE_PEM?.trim();
  if (inlinePem) {
    if (inlinePem.includes("-----BEGIN")) {
      return Buffer.from(inlinePem.replace(/\\n/g, "\n"), "utf-8");
    }
    return Buffer.from(inlinePem, "base64");
  }

  const certPath = process.env.EFI_CERTIFICATE_PATH?.trim() || "certificado.pem";
  const resolved = path.isAbsolute(certPath)
    ? certPath
    : path.resolve(process.cwd(), certPath);

  if (fs.existsSync(resolved)) {
    return fs.readFileSync(resolved);
  }

  return null;
}

/**
 * Executa requisição HTTPS com mTLS (certificado cliente .pem) quando disponível,
 * ou utiliza fetch padrão (útil em testes automatizados).
 */
async function efiHttpRequest(urlStr: string, init: RequestInit = {}): Promise<Response> {
  const pem = carregarCertificadoPem();
  if (!pem) {
    return fetch(urlStr, init);
  }

  return new Promise<Response>((resolve, reject) => {
    const url = new URL(urlStr);
    const headers: Record<string, string> = {};
    if (init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => {
          headers[k] = v;
        });
      } else if (Array.isArray(init.headers)) {
        for (const [k, v] of init.headers) headers[k] = v;
      } else {
        Object.assign(headers, init.headers as Record<string, string>);
      }
    }

    const bodyBuffer =
      typeof init.body === "string"
        ? Buffer.from(init.body, "utf-8")
        : init.body instanceof Buffer
          ? init.body
          : undefined;

    if (bodyBuffer && !headers["Content-Length"] && !headers["content-length"]) {
      headers["Content-Length"] = String(bodyBuffer.byteLength);
    }

    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: init.method ?? "GET",
        headers,
        cert: pem,
        key: pem,
        rejectUnauthorized: true,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const rawBody = Buffer.concat(chunks).toString("utf-8");
          const status = res.statusCode ?? 500;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: async () => (rawBody ? JSON.parse(rawBody) : {}),
            text: async () => rawBody,
          } as unknown as Response);
        });
      },
    );

    req.on("error", (err) => reject(err));
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

/**
 * Normaliza um txid para o padrão estrito do BACEN:
 * apenas letras e números (a-zA-Z0-9), entre 26 e 35 caracteres.
 */
export function normalizarTxid(rawTxid?: string): string {
  const limpo = (rawTxid ?? "").replace(/[^a-zA-Z0-9]/g, "");
  if (limpo.length >= 26 && limpo.length <= 35) {
    return limpo;
  }
  const sufixo = crypto.randomUUID().replace(/-/g, "");
  const combinado = `${limpo || "PAADA"}${sufixo}`;
  return combinado.slice(0, 32);
}

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
  const response = await efiHttpRequest(`${baseUrl()}/oauth/token`, {
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

async function efiFetch(pathUrl: string, init: RequestInit = {}): Promise<Response> {
  let token = await obterToken();
  let response = await efiHttpRequest(`${baseUrl()}${pathUrl}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (response.status === 401) {
    tokenCache = null;
    token = await obterToken();
    response = await efiHttpRequest(`${baseUrl()}${pathUrl}`, {
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

  const txid = normalizarTxid(input.txid);

  // Payload enxuto e 100% aderente ao schema do BACEN (/v2/cob)
  // Sem CPF/devedor obrigatório para evitar rejeição e fricção no checkout
  const corpo: Record<string, unknown> = {
    calendario: { expiracao: 60 * 60 }, // 1 hora (3600s)
    valor: { original: input.amount.toFixed(2) },
    chave,
    solicitacaoPagador: `Doacao ${input.campaignTitle} (${input.donationId})`.slice(0, 140),
  };

  const resposta = await efiFetch(`/v2/cob/${encodeURIComponent(txid)}`, {
    method: "PUT",
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
    txid?: string;
    status?: string;
    loc?: { id?: string | number };
    calendario?: { expiracao?: number };
  };

  const locId = cob.loc?.id;
  if (locId === undefined || locId === null) {
    throw new ApiError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      "A cobrança foi criada na Efí, mas o identificador de QR Code (loc.id) não foi retornado.",
    );
  }

  const qr = await efiFetch(`/v2/loc/${encodeURIComponent(String(locId))}/qrcode`);
  if (!qr.ok) {
    throw new ApiError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      "Não foi possível gerar o QR Code da cobrança na Efí (verifique os escopos de Payload da aplicação).",
    );
  }

  const rawQr = (await qr.json()) as Record<string, unknown>;
  const fonte = (
    rawQr.dados && typeof rawQr.dados === "object" ? rawQr.dados : rawQr
  ) as Record<string, unknown>;

  // Busca defensiva com fallback para variações de nomenclatura da Efí
  const temChaveImagemExplicita = Boolean(
    fonte.imagemQrcode || fonte.imagemQRCode || fonte.qrcode_image,
  );

  const imagemBruta = String(
    fonte.imagemQrcode ??
      fonte.imagemQRCode ??
      fonte.qrcode_image ??
      (fonte.qrCode ? fonte.qrcode : "") ??
      "",
  );

  const textoBruto = String(
    (temChaveImagemExplicita ? fonte.qrcode : undefined) ??
      fonte.qrCode ??
      fonte.brcode ??
      fonte.qrcode_text ??
      fonte.qrcode ??
      "",
  );

  // Remove prefixo data:image/png;base64, caso já venha incluso para não duplicar no frontend
  const qrcodeBase64 = imagemBruta.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const qrCode = textoBruto;

  if (!qrcodeBase64 || !qrCode) {
    throw new ApiError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      "Falha ao mapear os dados do QR Code retornados pela Efí.",
    );
  }

  const cobTxid = cob.txid || txid;

  return {
    id: cobTxid,
    checkoutUrl: qrCode,
    qrCode,
    qrcodeBase64,
    initPoint: qrCode,
    sandboxInitPoint: null,
    expiresAt: cob.calendario?.expiracao
      ? new Date(Date.now() + cob.calendario.expiracao * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
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
    valor?: { original: number | string };
  };
  return {
    id: data.txid,
    status: statusEfiParaDoacao(data.status),
    transaction_amount: Number(data.valor?.original ?? 0),
  };
}

export async function configurarWebhookEfi(webhookUrl: string, chavePix?: string) {
  const chave = chavePix || process.env.EFI_PIX_KEY;
  if (!chave) {
    throw new ApiError(
      503,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "A chave Pix do Efi (EFI_PIX_KEY) não foi configurada.",
    );
  }
  const resposta = await efiFetch(`/v2/webhook/${encodeURIComponent(chave)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-skip-mtls-checking": "true",
    },
    body: JSON.stringify({ webhookUrl }),
  });
  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    throw new ApiError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      `Falha ao registrar webhook na Efí (${resposta.status}): ${detalhe}`,
    );
  }
  return resposta.json().catch(() => ({ ok: true }));
}

function baseUrlCobrancas() {
  if (process.env.EFI_CHARGES_API_URL) {
    return process.env.EFI_CHARGES_API_URL.replace(/\/+$/, "");
  }
  return process.env.EFI_SANDBOX === "false"
    ? "https://cobrancas.api.efipay.com.br"
    : "https://cobrancas-h.api.efipay.com.br";
}

export type CartaoInput = {
  donationId: string;
  txid: string;
  amount: number;
  campaignTitle: string;
  payerEmail?: string;
  payment_token?: string;
  funcao?: "credito" | "debito";
  parcelas?: number;
  titular_nome: string;
  titular_cpf: string;
  titular_telefone?: string;
  titular_nascimento?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  bandeira?: string;
  ultimos_digitos?: string;
};

export async function criarCobrancaCartao(input: CartaoInput): Promise<{
  id: string;
  status: "approved" | "pending" | "rejected";
  funcao: "credito" | "debito";
  parcelas: number;
  ultimos_digitos?: string;
  bandeira?: string;
}> {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(
      503,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "O provedor de pagamento (Efi) ainda não foi configurado.",
    );
  }

  const funcao = input.funcao ?? "credito";
  const parcelas = funcao === "debito" ? 1 : Math.min(Math.max(input.parcelas ?? 1, 1), 6);
  const isSandbox = process.env.EFI_SANDBOX !== "false";

  // Em ambiente Sandbox sem tokenizador de navegador configurado, aprova em modo de homologação local
  if (!input.payment_token && isSandbox) {
    return {
      id: `CARD-${input.txid}`,
      status: "approved",
      funcao,
      parcelas,
      ultimos_digitos: input.ultimos_digitos,
      bandeira: input.bandeira,
    };
  }

  if (!input.payment_token) {
    throw new ApiError(
      400,
      "CARD_TOKEN_REQUIRED",
      "Token de segurança do cartão não gerado. Verifique NEXT_PUBLIC_EFI_ACCOUNT_ID em produção.",
    );
  }

  const credenciais = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const authRes = await fetch(`${baseUrlCobrancas()}/v1/authorize`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credenciais}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!authRes.ok) {
    throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "Não foi possível autenticar na API de Cartões da Efí.");
  }

  const { access_token } = (await authRes.json()) as { access_token: string };
  const valorCentavos = Math.round(input.amount * 100);
  const foneLimpo = (input.titular_telefone ?? "11999999999").replace(/\D/g, "");

  const payload = {
    items: [
      {
        name: `Doacao ${input.campaignTitle}`.slice(0, 255),
        value: valorCentavos,
        amount: 1,
      },
    ],
    metadata: {
      custom_id: input.txid,
    },
    payment: {
      credit_card: {
        installments: parcelas,
        payment_token: input.payment_token,
        customer: {
          name: input.titular_nome,
          cpf: input.titular_cpf.replace(/\D/g, ""),
          email: input.payerEmail || "doador@oxente.org.br",
          phone_number: foneLimpo.length >= 10 ? foneLimpo : "11999999999",
          birth: input.titular_nascimento || "1990-01-01",
        },
        billing_address: {
          street: input.endereco || "Avenida Principal",
          number: input.numero || "S/N",
          neighborhood: input.bairro || "Centro",
          zipcode: (input.cep || "50000000").replace(/\D/g, ""),
          city: input.cidade || "Recife",
          state: (input.estado || "PE").toUpperCase(),
        },
      },
    },
  };

  const chargeRes = await fetch(`${baseUrlCobrancas()}/v1/charge/one-step`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!chargeRes.ok) {
    const detalhe = await chargeRes.text().catch(() => "");
    throw new ApiError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      `Pagamento no cartão recusado pela Efí${detalhe ? `: ${detalhe}` : ""}`.slice(0, 220),
    );
  }

  const chargeData = (await chargeRes.json()) as {
    data?: { charge_id?: number | string; status?: string; total?: number };
  };

  const rawStatus = chargeData.data?.status ?? "approved";
  const status =
    rawStatus === "approved" || rawStatus === "paid"
      ? "approved"
      : rawStatus === "unpaid" || rawStatus === "canceled"
        ? "rejected"
        : "pending";

  return {
    id: String(chargeData.data?.charge_id ?? `CARD-${input.txid}`),
    status,
    funcao,
    parcelas,
    ultimos_digitos: input.ultimos_digitos,
    bandeira: input.bandeira,
  };
}

