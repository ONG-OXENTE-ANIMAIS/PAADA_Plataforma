import { ApiError } from "@/lib/api/errors";
import { apiFailure, apiSuccess } from "@/lib/api/response";
import { doacoesService } from "@/services/doacoes.service";
import { DoacoesRepository } from "@/repositories/doacoes.repository";

export const runtime = "nodejs";

const repo = new DoacoesRepository();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const donation = await repo.findById(id);
    if (!donation) {
      return apiFailure(new ApiError(404, "NOT_FOUND", "Doação não encontrada."), "doacoes/simular");
    }
    const valor = Number(donation.valor);
    await doacoesService.confirm(String(donation.id), donation.txid, valor);
    return apiSuccess({ id: String(donation.id), status: "PAGA" }, 200, "Pagamento simulado com sucesso!");
  } catch (error) {
    return apiFailure(error, "doacoes/simular");
  }
}
