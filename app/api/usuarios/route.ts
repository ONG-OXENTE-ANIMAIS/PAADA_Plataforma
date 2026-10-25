import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parsePagination, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { usuariosService } from "@/services/usuarios.service";
import { paginated } from "@/lib/api/pagination";

export async function GET(request: Request) {
  try { await authorize("usuarios:manage"); const { page, limit } = parsePagination(new URL(request.url)); const result = await usuariosService.list(page, limit); return apiSuccess(paginated(result.data, result.count, page, limit)); }
  catch (error) { return apiFailure(error, "usuarios/list"); }
}
export async function POST(request: Request) {
  try { assertSameOrigin(request); await authorize("usuarios:manage"); return apiSuccess(await usuariosService.create(await readJson(request)), 201, "Usuário criado."); }
  catch (error) { return apiFailure(error, "usuarios/create"); }
}
