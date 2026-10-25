import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { parceirosService } from "@/services/parceiros.service";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { const { id } = await params; return apiSuccess(await parceirosService.get(parseId(id))); } catch (error) { return apiFailure(error, "parceiros/get"); } }
export async function PATCH(request: Request, { params }: Context) { try { assertSameOrigin(request); await authorize("parceiros:manage"); const { id } = await params; return apiSuccess(await parceirosService.update(parseId(id), await readJson(request)), 200, "Parceiro atualizado."); } catch (error) { return apiFailure(error, "parceiros/update"); } }
export async function DELETE(request: Request, { params }: Context) { try { assertSameOrigin(request); await authorize("parceiros:manage"); const { id } = await params; await parceirosService.remove(parseId(id)); return apiSuccess(null, 200, "Parceiro excluído."); } catch (error) { return apiFailure(error, "parceiros/delete"); } }
