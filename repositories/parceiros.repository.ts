import { createAdminClient } from "@/lib/supabase/admin";
import type { ParceiroRow } from "@/types/database.types";

export class ParceirosRepository {
  private db() { return createAdminClient(); }
  async list(filters: { ativo?: boolean; tipo?: string; area?: string; localidade?: string; from: number; to: number }) {
    const db = this.db();
    let query = db.from("parceiros").select("*", { count: "exact" });
    if (typeof filters.ativo === "boolean") query = query.eq("ativo", filters.ativo);
    if (filters.tipo) query = query.ilike("tipo", `%${filters.tipo}%`);
    if (filters.area) query = query.ilike("area", `%${filters.area}%`);
    if (filters.localidade) query = query.ilike("localidade", `%${filters.localidade}%`);
    const { data, error, count } = await query.order("nome").range(filters.from, filters.to);
    if (error) throw error;
    return { data: (data ?? []) as ParceiroRow[], count: count ?? 0 };
  }
  async findById(id: string) {
    const { data, error } = await this.db().from("parceiros").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as ParceiroRow | null;
  }
  async create(values: Partial<ParceiroRow> & Pick<ParceiroRow, "nome">) {
    const { data, error } = await this.db().from("parceiros").insert(values).select("*").single();
    if (error) throw error;
    return data as ParceiroRow;
  }
  async update(id: string, values: Partial<ParceiroRow>) {
    const { data, error } = await this.db().from("parceiros").update(values).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as ParceiroRow | null;
  }
  async remove(id: string) {
    const { error } = await this.db().from("parceiros").delete().eq("id", id);
    if (error) throw error;
  }
}
