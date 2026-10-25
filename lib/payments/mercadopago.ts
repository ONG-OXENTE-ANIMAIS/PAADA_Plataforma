import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/api/errors";

const API_URL = "https://api.mercadopago.com";

export type PagamentoPreferencia = {
  id: string;
  checkoutUrl: string;
  initPoint: string;
  sandboxInitPoint: string | null;
};

export async function criarPreferenciaPagamento(input: {
  donationId: string;
  donationToken: string;
  campaignSlug: string;
  txid: string;
  amount: number;
  campaignTitle: string;
  payerEmail?: string;
  payerName?: string;
}): Promise<PagamentoPreferencia> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new ApiError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "O provedor de pagamento ainda não foi configurado.");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const retorno = `${appUrl}/vaquinha/${input.campaignSlug}?doacao=${input.donationId}&token=${input.donationToken}`;
  const response = await fetch(`${API_URL}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": input.txid },
    body: JSON.stringify({
      items: [{ title: input.campaignTitle, quantity: 1, unit_price: input.amount, currency_id: "BRL" }],
      payer: input.payerEmail ? { email: input.payerEmail, name: input.payerName } : undefined,
      external_reference: input.donationId,
      back_urls: { success: retorno, pending: retorno, failure: retorno },
      auto_return: "approved",
      notification_url: `${appUrl}/api/pagamentos/mercadopago/webhook`,
      statement_descriptor: "PAADA OXENTE",
    }),
  });
  if (!response.ok) {
    throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "O provedor de pagamento não conseguiu criar a cobrança.");
  }
  const data = await response.json() as { id: string; init_point: string; sandbox_init_point?: string };
  return { id: data.id, checkoutUrl: data.sandbox_init_point ?? data.init_point, initPoint: data.init_point, sandboxInitPoint: data.sandbox_init_point ?? null };
}

export function validarAssinaturaMercadoPago(rawSignature: string | null, requestId: string | null, dataId: string | null, secret: string, toleranceSeconds = 300) {
  if (!rawSignature || !requestId || !dataId) return false;
  const parts = rawSignature.split(",").map((part) => part.trim().split("="));
  const ts = parts.find(([key]) => key === "ts")?.[1];
  const received = parts.find(([key]) => key === "v1")?.[1];
  if (!ts || !received) return false;
  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function consultarPagamento(paymentId: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new ApiError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "O provedor de pagamento ainda não foi configurado.");
  const response = await fetch(`${API_URL}/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "Não foi possível consultar o pagamento no provedor.");
  return response.json() as Promise<{ id: number | string; status: string; transaction_amount: number; external_reference?: string }>;
}
