import { createAdminClient } from "@/lib/supabase/admin";
import type { ContatoRow } from "@/types/database.types";

export class ContatoRepository {
  private db() { return createAdminClient(); }
  async list(filters: { status?: string; from?: string; to?: string; page: number; limit: number }) {
    const db = this.db();
    let query = db.from("contato").select("*", { count: "exact" });
    if (filters.status) query = query.eq("status", filters.status as ContatoRow["status"]);
    if (filters.from) query = query.gte("criado_em", filters.from);
    if (filters.to) query = query.lte("criado_em", filters.to);
    const { data, error, count } = await query.order("criado_em", { ascending: false }).range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);
    if (error) throw error;
    return { data: (data ?? []) as ContatoRow[], count: count ?? 0 };
  }
  async findById(id: string) {
    const { data, error } = await this.db().from("contato").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as ContatoRow | null;
  }
  async create(values: Partial<ContatoRow> & Pick<ContatoRow, "nome" | "email" | "assunto" | "mensagem">) {
    const { data, error } = await this.db().from("contato").insert(values).select("*").single();
    if (error) throw error;
    return data as ContatoRow;
  }
  async update(id: string, values: Partial<ContatoRow>) {
    const { data, error } = await this.db().from("contato").update(values).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as ContatoRow | null;
  }
  async remove(id: string) {
    const { error } = await this.db().from("contato").delete().eq("id", id);
    if (error) throw error;
  }
}
