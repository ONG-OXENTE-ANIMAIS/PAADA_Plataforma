import { cookies } from "next/headers";
import { apiFailure, apiSuccess } from "@/lib/api/response";
import { assertSameOrigin, readJson } from "@/lib/api/request";
import { loginSchema } from "@/lib/validations/schemas";
import { usuariosService } from "@/services/usuarios.service";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    await enforceRateLimit(`login:${ip}`, 10, 900);
    const data = loginSchema.parse(await readJson(request));
    const user = await usuariosService.authenticate(data.login, data.senha);
    const token = await createSessionToken(user);
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
    return apiSuccess({ user }, 200, "Login realizado com sucesso.");
  } catch (error) {
    return apiFailure(error, "auth/login");
  }
}
