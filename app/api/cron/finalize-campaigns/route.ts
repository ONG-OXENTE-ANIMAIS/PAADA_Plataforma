import { apiFailure, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

export async function GET() {
  try {
    await authorize("campanhas:manage");
    const finalizadas = await campanhasService.finalizarCampanhasAntigas();
    return apiSuccess({ finalizadas }, 200, `${finalizadas} campanha(s) finalizada(s) automaticamente.`);
  } catch (error) {
    return apiFailure(error, "cron/finalize-campaigns");
  }
}