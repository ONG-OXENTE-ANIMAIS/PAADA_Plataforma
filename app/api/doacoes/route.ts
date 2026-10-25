import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parsePagination, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { doacoesService } from "@/services/doacoes.service";
import { paginated } from "@/lib/api/pagination";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: Request) {
  try {
    await authorize("doacoes:manage");
    const url = new URL(request.url);
    const { page, limit } = parsePagination(url);
    const result = await doacoesService.list({
      campanha_id: url.searchParams.get("campanha_id") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      page,
      limit,
    });
    return apiSuccess(paginated(result.data, result.count, page, limit));
  } catch (error) { return apiFailure(error, "doacoes/list"); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    await enforceRateLimit(`doacao:${ip}`, 15, 3600);
    const result = await doacoesService.create(await readJson(request));
    return apiSuccess(result, 201, "Doação iniciada. Conclua o pagamento no ambiente seguro do provedor.");
  } catch (error) { return apiFailure(error, "doacoes/create"); }
}
