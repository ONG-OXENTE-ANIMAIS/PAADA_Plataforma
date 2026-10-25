import { apiFailure, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await authorize("dashboard:view");
    const db = createAdminClient();
    const [campanhas, doacoes, parceiros, mensagens, valores] = await Promise.all([
      db.from("campanhas").select("id", { count: "exact", head: true }).eq("status", "ATIVA"),
      db.from("doacoes").select("id", { count: "exact", head: true }).eq("status", "PAGA"),
      db.from("parceiros").select("id", { count: "exact", head: true }).eq("ativo", true),
      db.from("contato").select("id", { count: "exact", head: true }).eq("status", "RECEBIDA"),
      db.from("doacoes").select("valor").eq("status", "PAGA"),
    ]);
    if (campanhas.error || doacoes.error || parceiros.error || mensagens.error || valores.error) throw campanhas.error ?? doacoes.error ?? parceiros.error ?? mensagens.error ?? valores.error;
    const totalArrecadado = (valores.data ?? []).reduce((sum, item) => sum + Number(item.valor), 0);
    return apiSuccess({ campanhas_ativas: campanhas.count ?? 0, doacoes_pagas: doacoes.count ?? 0, parceiros_ativos: parceiros.count ?? 0, mensagens_recebidas: mensagens.count ?? 0, total_arrecadado: totalArrecadado });
  } catch (error) { return apiFailure(error, "admin/dashboard"); }
}
