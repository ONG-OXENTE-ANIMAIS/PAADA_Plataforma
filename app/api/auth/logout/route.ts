import { cookies } from "next/headers";
import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/api/request";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    (await cookies()).delete(SESSION_COOKIE);
    return apiSuccess(null, 200, "Sessão encerrada.");
  } catch (error) {
    return apiFailure(error, "auth/logout");
  }
}
