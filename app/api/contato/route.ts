import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parsePagination, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { contatoService } from "@/services/contato.service";
import { paginated } from "@/lib/api/pagination";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  try { await authorize("contato:manage"); const url = new URL(request.url); const { page, limit } = parsePagination(url); const result = await contatoService.list({ status: url.searchParams.get("status") ?? undefined, from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined, page, limit }); return apiSuccess(paginated(result.data, result.count, page, limit)); }
  catch (error) { return apiFailure(error, "contato/list"); }
}
export async function POST(request: Request) {
  try { assertSameOrigin(request); const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"; await enforceRateLimit(`contato:${ip}`, 5, 3600); const message = await contatoService.create(await readJson(request)); return apiSuccess({ id: message.id, status: message.status }, 201, "Mensagem recebida."); }
  catch (error) { return apiFailure(error, "contato/create"); }
}
