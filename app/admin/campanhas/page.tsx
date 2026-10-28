"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";
import { BRL, type CampanhaApi } from "@/lib/campaigns";

type Pagina<T> = { data: T[]; pagination: { page: number; totalPages: number; total: number } };

const STATUS_CORES: Record<string, { bg: string; fg: string }> = {
  ATIVA: { bg: "#30D07033", fg: "#1c7c44" },
  RASCUNHO: { bg: "#00000014", fg: "#555" },
  PAUSADA: { bg: "#fbbf2455", fg: "#8a5a00" },
  CONCLUIDA: { bg: "#00909026", fg: "#006969" },
  CANCELADA: { bg: "#b3261e26", fg: "#b3261e" },
};

export default function AdminCampanhasPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [itens, setItens] = useState<CampanhaApi[] | null>(null);
  const [paginacao, setPaginacao] = useState({ page: 1, totalPages: 1, total: 0 });
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    (page = 1) => {
      const params = new URLSearchParams({ admin: "true", page: String(page), limit: "20" });
      if (busca.trim()) params.set("q", busca.trim());
      if (status) params.set("status", status);
      apiFetch<Pagina<CampanhaApi>>(`/api/campanhas?${params}`)
        .then((p) => {
          setItens(p.data);
          setPaginacao(p.pagination);
          setErro(null);
        })
        .catch((e: Error) => setErro(e.message));
    },
    [busca, status],
  );

  useEffect(() => {
    if (user) carregar(1);
  }, [user, carregar]);

  if (sessaoCarregando || !user) return null;

  async function alterar(id: string, patch: Partial<CampanhaApi>, rotulo: string) {
    try {
      await apiFetch(`/api/campanhas/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      toast(rotulo, "check-circle");
      carregar(paginacao.page);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Operação falhou.", "warning");
    }
  }

  async function excluir(c: CampanhaApi) {
    if (!confirm(`Excluir a campanha “${c.titulo}”? Campanhas com doações não podem ser excluídas.`)) return;
    try {
      await apiFetch(`/api/campanhas/${c.id}`, { method: "DELETE" });
      toast("Campanha excluída.", "trash");
      carregar(paginacao.page);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não foi possível excluir.", "warning");
    }
  }

  const dataCurta = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <section className="screen active" data-screen="admin-campanhas">
      <div className="adm-head wrap">
        <h1>Campanhas</h1>
        <p>
          Todas as campanhas do banco — inclusive rascunhos e pausadas. Altere
          status, visibilidade e destaque; publicadas aparecem no site na hora.
        </p>
        <div className="adm-bts">
          <Link href="/admin/nova" className="btn btn-laranja">
            <i className="ph ph-plus"></i> Nova vaquinha
          </Link>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        <div className="vt-filtros" style={{ marginBottom: "22px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
          <div className="vt-busca" style={{ minWidth: "240px" }}>
            <i className="ph ph-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Buscar por título ou slug…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && carregar(1)}
              aria-label="Buscar campanhas"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por status"
            style={{ padding: "10px 14px", borderRadius: "12px", border: "1.5px solid rgba(48,22,7,.2)", background: "#fff" }}
          >
            <option value="">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="ATIVA">Ativa</option>
            <option value="PAUSADA">Pausada</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <button className="btn btn-marrom" onClick={() => carregar(1)}>
            <i className="ph ph-magnifying-glass"></i> Buscar
          </button>
        </div>

        {erro ? (
          <div className="form-card">
            <h3><i className="ph ph-warning" style={{ color: "#b3261e" }}></i> Erro ao carregar</h3>
            <p style={{ opacity: 0.8 }}>{erro}</p>
          </div>
        ) : itens && !itens.length ? (
          <div className="form-card">
            <h3>Nenhuma campanha encontrada</h3>
            <p style={{ opacity: 0.8 }}>Ajuste a busca ou crie a primeira vaquinha.</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Status</th>
                <th>Arrecadado</th>
                <th>Flags</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(itens ?? []).map((c) => {
                const cor = STATUS_CORES[c.status] ?? STATUS_CORES.RASCUNHO;
                return (
                  <tr key={c.id}>
                    <td>
                      <Link className="adm-linha-link" href={`/vaquinha/${c.slug}`}>
                        {c.titulo}
                      </Link>
                      <div style={{ fontSize: "12px", opacity: 0.6 }}>/{c.slug}</div>
                    </td>
                    <td>
                      <span className="adm-tag-status" style={{ background: cor.bg, color: cor.fg }}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <b>{BRL(c.valor_arrecadado)}</b>
                      <div style={{ fontSize: "12px", opacity: 0.6 }}>meta {BRL(c.valor_meta)}</div>
                    </td>
                    <td style={{ fontSize: "12.5px" }}>
                      {c.mensal ? "mensal · " : ""}
                      {c.meta_isvisible ? "visível" : "oculta"}
                      {c.destaque ? " · destaque" : ""}
                    </td>
                    <td style={{ fontSize: "12.5px", opacity: 0.7 }}>{dataCurta(c.criada_em)}</td>
                    <td>
                      <div className="adm-acoes">
                        <select
                          value={c.status}
                          onChange={(e) => alterar(c.id, { status: e.target.value as CampanhaApi["status"] }, `Status alterado para ${e.target.value}.`)}
                          aria-label={`Status de ${c.titulo}`}
                          style={{ padding: "6px 8px", borderRadius: "8px", border: "1.5px solid rgba(48,22,7,.2)" }}
                        >
                          <option value="RASCUNHO">Rascunho</option>
                          <option value="ATIVA">Ativa</option>
                          <option value="PAUSADA">Pausada</option>
                          <option value="CONCLUIDA">Concluída</option>
                          <option value="CANCELADA">Cancelada</option>
                        </select>
                        <button
                          className="adm-acao-btn"
                          onClick={() => alterar(c.id, { meta_isvisible: !c.meta_isvisible }, c.meta_isvisible ? "Campanha oculta do site." : "Campanha visível no site.")}
                        >
                          {c.meta_isvisible ? "Ocultar" : "Publicar"}
                        </button>
                        <button
                          className="adm-acao-btn"
                          onClick={() => alterar(c.id, { destaque: !c.destaque }, c.destaque ? "Removida do destaque." : "Marcada como destaque.")}
                        >
                          {c.destaque ? "Tirar destaque" : "Destacar"}
                        </button>
                        <button className="adm-acao-btn perigo" onClick={() => excluir(c)}>
                          <i className="ph ph-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {paginacao.totalPages > 1 && (
          <div className="adm-paginacao">
            <button
              className="adm-acao-btn"
              disabled={paginacao.page <= 1}
              onClick={() => carregar(paginacao.page - 1)}
            >
              <i className="ph ph-arrow-left"></i> Anterior
            </button>
            <span>
              Página {paginacao.page} de {paginacao.totalPages} · {paginacao.total} campanhas
            </span>
            <button
              className="adm-acao-btn"
              disabled={paginacao.page >= paginacao.totalPages}
              onClick={() => carregar(paginacao.page + 1)}
            >
              Próxima <i className="ph ph-arrow-right"></i>
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
