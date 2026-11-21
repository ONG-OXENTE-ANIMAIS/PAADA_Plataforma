import { apiFailure, apiSuccess } from "@/lib/api/response";
import { doacoesService } from "@/services/doacoes.service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const resultado = await doacoesService.syncPending();
    return apiSuccess(resultado, 200, "Sincronização de doações pendentes concluída.");
  } catch (error) {
    return apiFailure(error, "doacoes/sincronizar");
  }
}

export async function GET() {
  try {
    const resultado = await doacoesService.syncPending();
    return apiSuccess(resultado, 200, "Sincronização de doações pendentes concluída.");
  } catch (error) {
    return apiFailure(error, "doacoes/sincronizar");
  }
}
