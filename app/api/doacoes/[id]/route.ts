import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { doacoesService } from "@/services/doacoes.service";
import { readSession } from "@/lib/auth/session";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const session = await readSession();
    if (session) return apiSuccess(await doacoesService.getAdmin(parseId(id)));
    const token = new URL(request.url).searchParams.get("token");
    return apiSuccess(await doacoesService.getPublic(parseId(id), token));
  } catch (error) { return apiFailure(error, "doacoes/get"); }
}
export async function PATCH(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("doacoes:manage"); const { id } = await params; return apiSuccess(await doacoesService.updateStatus(parseId(id), await readJson(request)), 200, "Status da doação atualizado."); }
  catch (error) { return apiFailure(error, "doacoes/status"); }
}
