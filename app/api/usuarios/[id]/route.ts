import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { usuariosService } from "@/services/usuarios.service";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { await authorize("usuarios:manage"); const { id } = await params; return apiSuccess(await usuariosService.get(parseId(id))); } catch (error) { return apiFailure(error, "usuarios/get"); } }
export async function PATCH(request: Request, { params }: Context) { try { assertSameOrigin(request); await authorize("usuarios:manage"); const { id } = await params; return apiSuccess(await usuariosService.update(parseId(id), await readJson(request)), 200, "Usuário atualizado."); } catch (error) { return apiFailure(error, "usuarios/update"); } }
export async function DELETE(request: Request, { params }: Context) { try { assertSameOrigin(request); await authorize("usuarios:manage"); const { id } = await params; await usuariosService.remove(parseId(id)); return apiSuccess(null, 200, "Usuário excluído."); } catch (error) { return apiFailure(error, "usuarios/delete"); } }
