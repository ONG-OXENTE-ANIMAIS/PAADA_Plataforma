import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, parseId, readJson } from "@/lib/api/request";
import { authorize } from "@/lib/auth/permissions";
import { campanhasService } from "@/services/campanhas.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const campaign = await campanhasService.getPublicById(parseId(id));
    return apiSuccess(campaign);
  } catch (error) {
    return apiFailure(error, "campanhas/get");
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    await authorize("campanhas:manage");
    const { id } = await params;
    const campaign = await campanhasService.update(parseId(id), await readJson(request));
    return apiSuccess(campaign, 200, "Campanha atualizada com sucesso.");
  } catch (error) {
    return apiFailure(error, "campanhas/update");
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    await authorize("campanhas:manage");
    const { id } = await params;
    await campanhasService.remove(parseId(id));
    return apiSuccess(null, 200, "Campanha excluída com sucesso.");
  } catch (error) {
    return apiFailure(error, "campanhas/delete");
  }
}
