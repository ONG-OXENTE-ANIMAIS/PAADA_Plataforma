import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/api/errors";

/**
 * Limita requisições por chave (ex.: "login:IP") usando a função SQL
 * `consumir_rate_limit`. Se a função ainda não existir no banco
 * (ver supabase/migrations/0002_rate_limit.sql), a verificação falha aberto
 * — registramos um aviso para não derrubar endpoints essenciais.
 */
export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const db = createAdminClient();
  const { data, error } = await db.rpc("consumir_rate_limit", {
    p_chave: key,
    p_limite: limit,
    p_janela_segundos: windowSeconds,
  });
  if (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "PGRST202" || code === "404" || code === "42883") {
      console.warn(`[rate-limit] função consumir_rate_limit ausente no banco — limite não aplicado para ${key}`);
      return;
    }
    throw error;
  }
  const allowed = (data as { permitido?: boolean } | null)?.permitido ?? true;
  if (!allowed) throw new ApiError(429, "RATE_LIMITED", "Muitas requisições. Aguarde alguns minutos e tente novamente.");
}
