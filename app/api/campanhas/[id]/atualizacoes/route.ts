import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try { const { id } = await params; const admin = new URL(request.url).searchParams.get("admin") === "true"; if (admin) await authorize("campanhas:manage"); return apiSuccess(await campanhasService.listUpdates(parseId(id), admin)); }
  catch (error) { return apiFailure(error, "campanhas/atualizacoes/list"); }
}
export async function POST(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id } = await params; return apiSuccess(await campanhasService.createUpdate(parseId(id), await readJson(request)), 201, "Atualização criada."); }
  catch (error) { return apiFailure(error, "campanhas/atualizacoes/create"); }
}
