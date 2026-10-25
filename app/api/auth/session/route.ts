import { apiFailure, apiSuccess } from "@/lib/api/response";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await readSession();
    return apiSuccess({ authenticated: Boolean(user), user });
  } catch (error) {
    return apiFailure(error, "auth/session");
  }
}
