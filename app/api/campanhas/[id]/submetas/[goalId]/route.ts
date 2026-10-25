import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

type Context = { params: Promise<{ id: string; goalId: string }> };
export async function GET(_request: Request, { params }: Context) {
  try { const { id, goalId } = await params; const goals = await campanhasService.listGoals(parseId(id)); const goal = goals.find((item) => item.id === parseId(goalId)); if (!goal) throw new Error("NOT_FOUND"); return apiSuccess(goal); }
  catch (error) { return apiFailure(error, "campanhas/submetas/get"); }
}
export async function PATCH(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id, goalId } = await params; return apiSuccess(await campanhasService.updateGoal(parseId(id), parseId(goalId), await readJson(request)), 200, "Submeta atualizada."); }
  catch (error) { return apiFailure(error, "campanhas/submetas/update"); }
}
export async function DELETE(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id, goalId } = await params; await campanhasService.removeGoal(parseId(id), parseId(goalId)); return apiSuccess(null, 200, "Submeta excluída."); }
  catch (error) { return apiFailure(error, "campanhas/submetas/delete"); }
}
