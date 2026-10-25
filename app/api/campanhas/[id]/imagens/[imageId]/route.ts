import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

type Context = { params: Promise<{ id: string; imageId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id, imageId } = await params; return apiSuccess(await campanhasService.updateImage(parseId(id), parseId(imageId), await readJson(request)), 200, "Imagem atualizada."); }
  catch (error) { return apiFailure(error, "campanhas/imagens/update"); }
}
export async function DELETE(request: Request, { params }: Context) {
  try { assertSameOrigin(request); await authorize("campanhas:manage"); const { id, imageId } = await params; await campanhasService.removeImage(parseId(id), parseId(imageId)); return apiSuccess(null, 200, "Imagem excluída."); }
  catch (error) { return apiFailure(error, "campanhas/imagens/delete"); }
}
