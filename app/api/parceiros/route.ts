import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parsePagination, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { parceirosService } from "@/services/parceiros.service";
import { paginated } from "@/lib/api/pagination";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from, to } = parsePagination(url);
    const admin = url.searchParams.get("admin") === "true";
    if (admin) await authorize("parceiros:manage");
    const result = await parceirosService.list({ ativo: admin ? undefined : true, tipo: url.searchParams.get("tipo") ?? undefined, area: url.searchParams.get("area") ?? undefined, localidade: url.searchParams.get("localidade") ?? undefined, from, to });
    return apiSuccess(paginated(result.data, result.count, page, limit));
  } catch (error) { return apiFailure(error, "parceiros/list"); }
}
export async function POST(request: Request) {
  try { assertSameOrigin(request); await authorize("parceiros:manage"); return apiSuccess(await parceirosService.create(await readJson(request)), 201, "Parceiro criado."); }
  catch (error) { return apiFailure(error, "parceiros/create"); }
}
