import { apiFailure, apiSuccess } from "@/lib/api/response";
import { configurarWebhookEfi } from "@/lib/payments/efi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || url.host;
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const webhookUrl = `${proto}://${host}/api/pagamentos/efi/webhook/pix`;

    const resultado = await configurarWebhookEfi(webhookUrl);
    return apiSuccess(
      { webhookUrl, resultado },
      200,
      `Webhook registrado na Efí com sucesso para: ${webhookUrl}`,
    );
  } catch (error) {
    return apiFailure(error, "pagamentos/webhook/configurar");
  }
}

export async function GET(request: Request) {
  return POST(request);
}
