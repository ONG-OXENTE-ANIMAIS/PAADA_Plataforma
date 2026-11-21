import { createAdminClient } from "@/lib/supabase/admin";
import type { DoacaoRow } from "@/types/database.types";
import { parseSqlId } from "./campanhas.repository";

export class DoacoesRepository {
  private db() { return createAdminClient(); }
  async list(filters: { campanha_id?: string | number; status?: string; from?: string; to?: string; page: number; limit: number }) {
    const db = this.db();
    let query = db.from("doacoes").select("*, campanhas(titulo)", { count: "exact" });
    if (filters.campanha_id) query = query.eq("campanha_id", parseSqlId(filters.campanha_id));
    if (filters.status) query = query.eq("status", filters.status as DoacaoRow["status"]);
    if (filters.from) query = query.gte("atualizado_em", filters.from);
    if (filters.to) query = query.lte("atualizado_em", filters.to);
    const { data, error, count } = await query.order("atualizado_em", { ascending: false }).range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);
    if (error) throw error;
    const rows = (data ?? []) as (DoacaoRow & { campanhas?: { titulo: string | null } | null })[];
    return {
      data: rows.map(({ campanhas, ...row }) => ({ ...row, campanha_titulo: campanhas?.titulo ?? null })) as DoacaoRow[],
      count: count ?? 0,
    };
  }
  async findById(id: string | number) {
    const { data, error } = await this.db().from("doacoes").select("*").eq("id", parseSqlId(id)).maybeSingle();
    if (error) throw error;
    return data as DoacaoRow | null;
  }
  async findByTxid(txid: string) {
    const { data, error } = await this.db().from("doacoes").select("*").eq("txid", txid).maybeSingle();
    if (error) throw error;
    return data as DoacaoRow | null;
  }
  async create(values: Partial<DoacaoRow> & Pick<DoacaoRow, "campanha_id" | "valor" | "txid">) {
    const payload = {
      ...values,
      campanha_id: parseSqlId(values.campanha_id),
    };
    const { data, error } = await this.db().from("doacoes").insert(payload).select("*").single();
    if (error) throw error;
    return data as DoacaoRow;
  }
  async update(id: string | number, values: Partial<DoacaoRow>) {
    const { data, error } = await this.db().from("doacoes").update(values).eq("id", parseSqlId(id)).select("*").maybeSingle();
    if (error) throw error;
    return data as DoacaoRow | null;
  }
  async confirm(id: string | number, paymentId: string, amount: number) {
    const { data, error } = await this.db().rpc("confirmar_doacao", { p_doacao_id: parseSqlId(id), p_payment_id: paymentId, p_valor: amount });
    if (error) throw error;
    return data;
  }
  async setStatus(id: string | number, status: DoacaoRow["status"]) {
    const { data, error } = await this.db().rpc("definir_status_doacao", { p_doacao_id: parseSqlId(id), p_status: status });
    if (error) throw error;
    return data;
  }
  async countPaid(campanhaId: string | number) {
    const { count, error } = await this.db().from("doacoes").select("id", { count: "exact", head: true }).eq("campanha_id", parseSqlId(campanhaId)).eq("status", "PAGA");
    if (error) throw error;
    return count ?? 0;
  }
}
