import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try { const { id } = await params; return apiSuccess(await campanhasService.listGoals(parseId(id))); }
  catch (error) { return apiFailure(error, "campanhas/submetas/list"); }
}
export async function POST(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id } = await params; return apiSuccess(await campanhasService.createGoal(parseId(id), await readJson(request)), 201, "Submeta criada."); }
  catch (error) { return apiFailure(error, "campanhas/submetas/create"); }
}
