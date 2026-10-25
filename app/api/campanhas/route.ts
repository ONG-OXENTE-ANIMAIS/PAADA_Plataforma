import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parsePagination, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";
import { paginated } from "@/lib/api/pagination";
import { readSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from, to } = parsePagination(url);
    const admin = url.searchParams.get("admin") === "true";
    if (admin) {
      await authorize("campanhas:manage");
      const result = await campanhasService.listAdmin({ q: url.searchParams.get("q") ?? undefined, status: url.searchParams.get("status") ?? undefined, from, to });
      return apiSuccess(paginated(result.data, result.count, page, limit));
    }
    const result = await campanhasService.listPublic({
      q: url.searchParams.get("q") ?? undefined,
      categoria: url.searchParams.get("categoria") ?? undefined,
      localidade: url.searchParams.get("localidade") ?? undefined,
      destaque: url.searchParams.has("destaque") ? url.searchParams.get("destaque") === "true" : undefined,
      mensal: url.searchParams.has("mensal") ? url.searchParams.get("mensal") === "true" : undefined,
      from,
      to,
    });
    return apiSuccess(paginated(result.data, result.count, page, limit));
  } catch (error) {
    return apiFailure(error, "campanhas/list");
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await authorize("campanhas:manage");
    const campaign = await campanhasService.create(await readJson(request));
    return apiSuccess(campaign, 201, "Campanha criada com sucesso.");
  } catch (error) {
    return apiFailure(error, "campanhas/create");
  }
}
