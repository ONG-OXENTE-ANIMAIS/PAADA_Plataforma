import { apiFailure, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const db = createAdminClient();
    const [campanhas, doacoes, valores] = await Promise.all([
      db.from("campanhas").select("id", { count: "exact", head: true }).eq("status", "ATIVA").eq("meta_isvisible", true),
      db.from("doacoes").select("id", { count: "exact", head: true }).eq("status", "PAGA"),
      db.from("doacoes").select("valor").eq("status", "PAGA"),
    ]);
    if (campanhas.error || doacoes.error || valores.error) throw campanhas.error ?? doacoes.error ?? valores.error;
    return apiSuccess({ campanhas_ativas: campanhas.count ?? 0, doacoes_pagas: doacoes.count ?? 0, total_arrecadado: (valores.data ?? []).reduce((sum, item) => sum + Number(item.valor), 0) });
  } catch (error) { return apiFailure(error, "estatisticas/publicas"); }
}
