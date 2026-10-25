import { apiFailure, apiSuccess } from "@/lib/api/response";
import { consultarPagamento, validarAssinaturaMercadoPago } from "@/lib/payments/mercadopago";
import { doacoesService } from "@/services/doacoes.service";

export async function POST(request: Request) {
  try {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (!secret) return apiFailure(new Error("Webhook não configurado."), "pagamentos/webhook");
    const dataId = new URL(request.url).searchParams.get("data.id");
    const valid = validarAssinaturaMercadoPago(request.headers.get("x-signature"), request.headers.get("x-request-id"), dataId, secret);
    if (!valid) return Response.json({ success: false, error: { code: "INVALID_SIGNATURE", message: "Assinatura inválida." } }, { status: 401 });
    const payload = await request.json() as { type?: string; action?: string; data?: { id?: string } };
    const resourceId = dataId ?? payload.data?.id;
    if (!resourceId || (payload.type && payload.type !== "payment")) return apiSuccess({ ignored: true }, 200);
    const payment = await consultarPagamento(resourceId);
    if (payment.status !== "approved" || !payment.external_reference) return apiSuccess({ processed: false }, 200);
    await doacoesService.confirm(payment.external_reference, String(payment.id), Number(payment.transaction_amount));
    return apiSuccess({ processed: true }, 200);
  } catch (error) { return apiFailure(error, "pagamentos/webhook"); }
}
