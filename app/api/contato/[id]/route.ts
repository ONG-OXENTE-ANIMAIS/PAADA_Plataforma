import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { contatoService } from "@/services/contato.service";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { await authorize("contato:manage"); const { id } = await params; return apiSuccess(await contatoService.get(parseId(id))); } catch (error) { return apiFailure(error, "contato/get"); } }
export async function PATCH(request: Request, { params }: Context) { try { assertSameOrigin(request); await authorize("contato:manage"); const { id } = await params; return apiSuccess(await contatoService.update(parseId(id), await readJson(request)), 200, "Mensagem atualizada."); } catch (error) { return apiFailure(error, "contato/update"); } }
export async function DELETE(request: Request, { params }: Context) { try { assertSameOrigin(request); await authorize("contato:manage"); const { id } = await params; await contatoService.remove(parseId(id)); return apiSuccess(null, 200, "Mensagem excluída."); } catch (error) { return apiFailure(error, "contato/delete"); } }
