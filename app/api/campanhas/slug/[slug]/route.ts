import { apiFailure, apiSuccess } from "@/lib/api/response";
import { campanhasService } from "@/services/campanhas.service";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const campaign = await campanhasService.getBySlug(decodeURIComponent(slug));
    return apiSuccess(campaign);
  } catch (error) {
    return apiFailure(error, "campanhas/slug");
  }
}
