import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

type Context = { params: Promise<{ id: string; updateId: string }> };
export async function GET(_request: Request, { params }: Context) {
  try { const { id, updateId } = await params; const updates = await campanhasService.listUpdates(parseId(id)); const update = updates.find((item) => item.id === parseId(updateId)); if (!update) throw new Error("NOT_FOUND"); return apiSuccess(update); }
  catch (error) { return apiFailure(error, "campanhas/atualizacoes/get"); }
}
export async function PATCH(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id, updateId } = await params; return apiSuccess(await campanhasService.updateUpdate(parseId(id), parseId(updateId), await readJson(request)), 200, "Atualização editada."); }
  catch (error) { return apiFailure(error, "campanhas/atualizacoes/update"); }
}
export async function DELETE(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id, updateId } = await params; await campanhasService.removeUpdate(parseId(id), parseId(updateId)); return apiSuccess(null, 200, "Atualização excluída."); }
  catch (error) { return apiFailure(error, "campanhas/atualizacoes/delete"); }
}
