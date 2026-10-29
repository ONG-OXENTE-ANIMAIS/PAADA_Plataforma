import { apiFailure, apiSuccess } from "@/lib/api/response";
import { consultarPagamento } from "@/lib/payments/efi";
import { doacoesService } from "@/services/doacoes.service";
import { DoacoesRepository } from "@/repositories/doacoes.repository";

const repo = new DoacoesRepository();

export async function POST(request: Request) {
  try {
    const payload = await request.json() as {
      tipo?: string;
      txid?: string;
      status?: string;
      chave?: string;
    };
    const txid = payload.txid;
    if (!txid) return apiSuccess({ ignored: true }, 200);

    // Verificação servidor-a-servidor: o webhook do Efi não assina as notificações,
    // então consultamos a cobrança diretamente na API do Efi antes de confirmar.
    const pagamento = await consultarPagamento(txid);
    if (pagamento.status !== "approved") {
      return apiSuccess({ processed: false, status: pagamento.status }, 200);
    }

    const donation = await repo.findByTxid(txid);
    if (!donation) return apiSuccess({ ignored: true, reason: "doacao-nao-encontrada" }, 200);
    if (donation.status === "PAGA") return apiSuccess({ processed: false, reason: "ja-paga" }, 200);

    await doacoesService.confirm(
      donation.id,
      txid,
      pagamento.transaction_amount || Number(donation.valor),
    );
    return apiSuccess({ processed: true, doacao: donation.id }, 200);
  } catch (error) {
    return apiFailure(error, "pagamentos/webhook");
  }
}
