import { createAdminClient } from "@/lib/supabase/admin";
import type { AtualizacaoRow, CampanhaRow, ImagemRow, SubmetaRow } from "@/types/database.types";

export class CampanhasRepository {
  private db() { return createAdminClient(); }

  async listPublic(filters: { q?: string; categoria?: string; localidade?: string; destaque?: boolean; mensal?: boolean; from: number; to: number }) {
    const db = this.db();
    let query = db.from("campanhas").select("*", { count: "exact" }).eq("status", "ATIVA").eq("meta_isvisible", true);
    if (filters.q) query = query.or(`titulo.ilike.%${filters.q}%,descricao.ilike.%${filters.q}%`);
    if (filters.categoria) query = query.eq("categoria", filters.categoria);
    if (filters.localidade) query = query.ilike("localidade", `%${filters.localidade}%`);
    if (typeof filters.destaque === "boolean") query = query.eq("destaque", filters.destaque);
    if (typeof filters.mensal === "boolean") query = query.eq("mensal", filters.mensal);
    const { data, error, count } = await query.order("destaque", { ascending: false }).order("criada_em", { ascending: false }).range(filters.from, filters.to);
    if (error) throw error;
    return { data: (data ?? []) as CampanhaRow[], count: count ?? 0 };
  }

  async listAdmin(filters: { q?: string; status?: string; from: number; to: number }) {
    const db = this.db();
    let query = db.from("campanhas").select("*", { count: "exact" });
    if (filters.q) query = query.or(`titulo.ilike.%${filters.q}%,slug.ilike.%${filters.q}%`);
    if (filters.status) query = query.eq("status", filters.status as CampanhaRow["status"]);
    const { data, error, count } = await query.order("criada_em", { ascending: false }).range(filters.from, filters.to);
    if (error) throw error;
    return { data: (data ?? []) as CampanhaRow[], count: count ?? 0 };
  }

  async findById(id: string) {
    const { data, error } = await this.db().from("campanhas").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as CampanhaRow | null;
  }

  async findBySlug(slug: string) {
    const { data, error } = await this.db().from("campanhas").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data as CampanhaRow | null;
  }

  async create(values: Partial<CampanhaRow> & Pick<CampanhaRow, "titulo" | "slug">) {
    const { data, error } = await this.db().from("campanhas").insert(values).select("*").single();
    if (error) throw error;
    return data as CampanhaRow;
  }

  async update(id: string, values: Partial<CampanhaRow>) {
    const { data, error } = await this.db().from("campanhas").update(values).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as CampanhaRow | null;
  }

  async remove(id: string) {
    const { error } = await this.db().from("campanhas").delete().eq("id", id);
    if (error) throw error;
  }

  async hasDonations(id: string) {
    const { count, error } = await this.db().from("doacoes").select("id", { count: "exact", head: true }).eq("campanha_id", id);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async imagesForCampaigns(ids: string[]) {
    if (!ids.length) return [] as ImagemRow[];
    const { data, error } = await this.db().from("imagens_campanhas").select("*").in("campanha_id", ids).order("ordem");
    if (error) throw error;
    return (data ?? []) as ImagemRow[];
  }

  async paidDonationsForCampaigns(ids: string[]) {
    if (!ids.length) return [] as { campanha_id: string }[];
    const { data, error } = await this.db().from("doacoes").select("campanha_id").in("campanha_id", ids).eq("status", "PAGA");
    if (error) throw error;
    return (data ?? []) as { campanha_id: string }[];
  }

  async images(campanhaId: string) {
    const { data, error } = await this.db().from("imagens_campanhas").select("*").eq("campanha_id", campanhaId).order("ordem");
    if (error) throw error;
    return (data ?? []) as ImagemRow[];
  }

  async createImage(values: Partial<ImagemRow> & Pick<ImagemRow, "campanha_id" | "url">) {
    const { data, error } = await this.db().from("imagens_campanhas").insert(values).select("*").single();
    if (error) throw error;
    return data as ImagemRow;
  }

  async findImage(campanhaId: string, id: string) {
    const { data, error } = await this.db().from("imagens_campanhas").select("*").eq("campanha_id", campanhaId).eq("id", id).maybeSingle();
    if (error) throw error;
    return data as ImagemRow | null;
  }

  async updateImage(campanhaId: string, id: string, values: Partial<ImagemRow>) {
    const { data, error } = await this.db().from("imagens_campanhas").update(values).eq("campanha_id", campanhaId).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as ImagemRow | null;
  }

  async removeImage(campanhaId: string, id: string) {
    const { error } = await this.db().from("imagens_campanhas").delete().eq("campanha_id", campanhaId).eq("id", id);
    if (error) throw error;
  }

  async goals(campanhaId: string) {
    const { data, error } = await this.db().from("submetas_campanhas").select("*").eq("campanha_id", campanhaId).order("ordem");
    if (error) throw error;
    return (data ?? []) as SubmetaRow[];
  }

  async createGoal(values: Partial<SubmetaRow> & Pick<SubmetaRow, "campanha_id" | "titulo" | "valor">) {
    const { data, error } = await this.db().from("submetas_campanhas").insert(values).select("*").single();
    if (error) throw error;
    return data as SubmetaRow;
  }

  async findGoal(campanhaId: string, id: string) {
    const { data, error } = await this.db().from("submetas_campanhas").select("*").eq("campanha_id", campanhaId).eq("id", id).maybeSingle();
    if (error) throw error;
    return data as SubmetaRow | null;
  }

  async updateGoal(campanhaId: string, id: string, values: Partial<SubmetaRow>) {
    const { data, error } = await this.db().from("submetas_campanhas").update(values).eq("campanha_id", campanhaId).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as SubmetaRow | null;
  }

  async removeGoal(campanhaId: string, id: string) {
    const { error } = await this.db().from("submetas_campanhas").delete().eq("campanha_id", campanhaId).eq("id", id);
    if (error) throw error;
  }

  async updates(campanhaId: string, includePrivate = false) {
    let query = this.db().from("atualizacoes_campanhas").select("*").eq("campanha_id", campanhaId);
    const { data, error } = await query.order("titulo", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AtualizacaoRow[];
  }

  async createUpdate(values: Partial<AtualizacaoRow> & Pick<AtualizacaoRow, "campanha_id" | "titulo" | "texto">) {
    const { data, error } = await this.db().from("atualizacoes_campanhas").insert(values).select("*").single();
    if (error) throw error;
    return data as AtualizacaoRow;
  }

  async findUpdate(campanhaId: string, id: string) {
    const { data, error } = await this.db().from("atualizacoes_campanhas").select("*").eq("campanha_id", campanhaId).eq("id", id).maybeSingle();
    if (error) throw error;
    return data as AtualizacaoRow | null;
  }

  async updateUpdate(campanhaId: string, id: string, values: Partial<AtualizacaoRow>) {
    const { data, error } = await this.db().from("atualizacoes_campanhas").update(values).eq("campanha_id", campanhaId).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data as AtualizacaoRow | null;
  }

  async removeUpdate(campanhaId: string, id: string) {
    const { error } = await this.db().from("atualizacoes_campanhas").delete().eq("campanha_id", campanhaId).eq("id", id);
    if (error) throw error;
  }
}
