import { createAdminClient } from "@/lib/supabase/admin";
import type { UsuarioRow } from "@/types/database.types";

export class UsuariosRepository {
  private db() { return createAdminClient(); }
  async list(page: number, limit: number) {
    const { data, error, count } = await this.db().from("usuarios").select("*", { count: "exact" }).order("nome").range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return { data: (data ?? []) as UsuarioRow[], count: count ?? 0 };
  }
  async findById(id: string) {
    const { data, error } = await this.db().from("usuarios").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as UsuarioRow | null;
  }
  async findByLogin(login: string) {
    const { data, error } = await this.db().from("usuarios").select("*").or(`login.eq.${login},email.eq.${login}`).maybeSingle();
    if (error) throw error;
    return data as UsuarioRow | null;
  }
  async create(values: Partial<UsuarioRow> & Pick<UsuarioRow, "nome" | "email" | "login" | "senha">) {
    const { data, error } = await this.db().from("usuarios").insert(values).select("*").single();
    if (error) throw error;
    return data as UsuarioRow;
  }
  async update(id: string, values: Partial<UsuarioRow>) {
    const { data, error } = await this.db().from("usuarios").update(values).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as UsuarioRow | null;
  }
  async remove(id: string) {
    const { error } = await this.db().from("usuarios").delete().eq("id", id);
    if (error) throw error;
  }
  async countAdmins() {
    const { count, error } = await this.db().from("usuarios").select("id", { count: "exact", head: true }).eq("tipo", "admin").eq("ativo", true);
    if (error) throw error;
    return count ?? 0;
  }
}
