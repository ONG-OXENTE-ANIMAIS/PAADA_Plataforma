import { apiFailure, apiSuccess } from "@/lib/api/response";
import { consultarPagamento } from "@/lib/payments/efi";
import { doacoesService } from "@/services/doacoes.service";
import { DoacoesRepository } from "@/repositories/doacoes.repository";

// 1. Força execução no Node.js completo (necessário para mTLS / fs / https da Efí)
export const runtime = "nodejs";

const repo = new DoacoesRepository();

type EfiPixItem = {
  endToEndId?: string;
  txid?: string;
  chave?: string;
  valor?: string | number;
  horario?: string;
};

type EfiWebhookPayload = {
  pix?: EfiPixItem[];
  txid?: string;
  valor?: string | number;
  evento?: string;
  tipo?: string;
  status?: string;
};

// Aceita GET de validação de disponibilidade (Ping da Efí)
export async function GET() {
  return apiSuccess({ status: "200 OK" }, 200, "Webhook Efí Pix ativo.");
}

// Aceita POST em /api/pagamentos/efi/webhook e /api/pagamentos/efi/webhook/pix
export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as EfiWebhookPayload;

    // Monta lista unificada de notificações (padrão oficial Efí payload.pix[] ou txid direto)
    const itensPix: EfiPixItem[] = Array.isArray(payload.pix)
      ? payload.pix
      : payload.txid
        ? [{ txid: payload.txid, valor: payload.valor }]
        : [];

    // Se for apenas o PING de validação da Efí na hora do registro do webhook
    if (itensPix.length === 0) {
      return apiSuccess({ status: "200 OK", ignored: true }, 200);
    }

    const confirmadas: string[] = [];

    for (const item of itensPix) {
      const txid = item.txid?.trim();
      if (!txid) continue;

      // 2. Trava de Idempotência: consulta no Supabase antes de processar
      const donation = await repo.findByTxid(txid);
      if (!donation) continue;
      if (donation.status === "PAGA") continue;

      // 3. Verificação servidor-a-servidor na API da Efí
      const pagamento = await consultarPagamento(txid);
      if (pagamento.status !== "approved") {
        continue;
      }

      const valorConfirmado =
        Number(pagamento.transaction_amount) ||
        Number(item.valor) ||
        Number(donation.valor);

      // 4. Escrita atômica no Supabase via RPC confirmar_doacao
      await doacoesService.confirm(donation.id, txid, valorConfirmado);
      confirmadas.push(donation.id);
    }

    return apiSuccess(
      {
        status: "200 OK",
        processed: confirmadas.length > 0,
        doacoes: confirmadas,
      },
      200,
    );
  } catch (error) {
    return apiFailure(error, "pagamentos/webhook");
  }
}
