"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";
import { ROTULO_STATUS } from "@/lib/campaigns";

type Mensagem = {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  tipo: "CONTATO" | "SUGESTAO";
  status: "RECEBIDA" | "EM_ANALISE" | "RESPONDIDA" | "ARQUIVADA";
  criado_em: string;
  respondido_em: string | null;
};

type Pagina<T> = { data: T[]; pagination: { page: number; totalPages: number; total: number } };

const STATUS_CORES: Record<string, { bg: string; fg: string }> = {
  RECEBIDA: { bg: "#fbbf2455", fg: "#8a5a00" },
  EM_ANALISE: { bg: "#00909026", fg: "#006969" },
  RESPONDIDA: { bg: "#30D07033", fg: "#1c7c44" },
  ARQUIVADA: { bg: "#00000014", fg: "#555" },
};

export default function AdminContatoPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [itens, setItens] = useState<Mensagem[] | null>(null);
  const [paginacao, setPaginacao] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    (page = 1) => {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (status) params.set("status", status);
      apiFetch<Pagina<Mensagem>>(`/api/contato?${params}`)
        .then((p) => {
          setItens(p.data);
          setPaginacao(p.pagination);
          setErro(null);
        })
        .catch((e: Error) => setErro(e.message));
    },
    [status],
  );

  useEffect(() => {
    if (user) carregar(1);
  }, [user, carregar]);

  if (sessaoCarregando || !user) return null;

  async function mudarStatus(m: Mensagem, novo: Mensagem["status"]) {
    try {
      await apiFetch(`/api/contato/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: novo }),
      });
      toast(`Mensagem marcada como ${ROTULO_STATUS[novo].toLowerCase()}.`, "check-circle");
      carregar(paginacao.page);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Operação falhou.", "warning");
    }
  }

  async function excluir(m: Mensagem) {
    if (!confirm(`Excluir a mensagem de ${m.nome}? Esta ação não tem volta.`)) return;
    try {
      await apiFetch(`/api/contato/${m.id}`, { method: "DELETE" });
      toast("Mensagem excluída.", "trash");
      carregar(paginacao.page);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não foi possível excluir.", "warning");
    }
  }

  const dataCurta = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <section className="screen active" data-screen="admin-contato">
      <div className="adm-head wrap">
        <h1>Mensagens</h1>
        <p>
          Fila de contato e sugestões enviadas pelo site. Os dados dos
          remetentes ficam aqui dentro do painel — nada é exposto publicamente.
        </p>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        <div style={{ marginBottom: "22px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por status"
            style={{ padding: "10px 14px", borderRadius: "12px", border: "1.5px solid rgba(48,22,7,.2)", background: "#fff" }}
          >
            <option value="">Todos os status</option>
            <option value="RECEBIDA">Recebida</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="RESPONDIDA">Respondida</option>
            <option value="ARQUIVADA">Arquivada</option>
          </select>
          <button className="btn btn-marrom" onClick={() => carregar(1)}>
            <i className="ph ph-funnel"></i> Filtrar
          </button>
        </div>

        {erro ? (
          <div className="form-card">
            <h3><i className="ph ph-warning" style={{ color: "#b3261e" }}></i> Erro ao carregar</h3>
            <p style={{ opacity: 0.8 }}>{erro}</p>
          </div>
        ) : itens && !itens.length ? (
          <div className="form-card">
            <h3>Caixa de entrada vazia</h3>
            <p style={{ opacity: 0.8 }}>Nenhuma mensagem com esse filtro.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {(itens ?? []).map((m) => {
              const cor = STATUS_CORES[m.status] ?? STATUS_CORES.RECEBIDA;
              const expandida = aberta === m.id;
              return (
                <article key={m.id} className="form-card" style={{ cursor: "pointer" }} onClick={() => setAberta(expandida ? null : m.id)}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <span className="adm-tag-status" style={{ background: cor.bg, color: cor.fg }}>
                      {ROTULO_STATUS[m.status] ?? m.status}
                    </span>
                    <b>{m.assunto}</b>
                    {m.tipo === "SUGESTAO" && (
                      <span className="adm-tag-status" style={{ background: "#FC681A22", color: "#b3450b" }}>
                        SUGESTÃO
                      </span>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: "12.5px", opacity: 0.6 }}>{dataCurta(m.criado_em)}</span>
                  </div>
                  <div style={{ fontSize: "13.5px", opacity: 0.75, marginTop: "6px" }}>
                    {m.nome} · {m.email}
                  </div>
                  {expandida && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(48,22,7,.12)" }}>
                      <p style={{ whiteSpace: "pre-wrap", fontSize: "14.5px", lineHeight: 1.55 }}>{m.mensagem}</p>
                      <div className="adm-acoes" style={{ marginTop: "14px" }} onClick={(e) => e.stopPropagation()}>
                        <a className="adm-acao-btn" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.assunto)}`}>
                          <i className="ph ph-envelope-simple"></i> Responder por e-mail
                        </a>
                        {m.status !== "EM_ANALISE" && (
                          <button className="adm-acao-btn" onClick={() => mudarStatus(m, "EM_ANALISE")}>
                            Em análise
                          </button>
                        )}
                        {m.status !== "RESPONDIDA" && (
                          <button className="adm-acao-btn" onClick={() => mudarStatus(m, "RESPONDIDA")}>
                            Marcar respondida
                          </button>
                        )}
                        {m.status !== "ARQUIVADA" && (
                          <button className="adm-acao-btn" onClick={() => mudarStatus(m, "ARQUIVADA")}>
                            Arquivar
                          </button>
                        )}
                        <button className="adm-acao-btn perigo" onClick={() => excluir(m)}>
                          <i className="ph ph-trash"></i> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {paginacao.totalPages > 1 && (
          <div className="adm-paginacao">
            <button className="adm-acao-btn" disabled={paginacao.page <= 1} onClick={() => carregar(paginacao.page - 1)}>
              <i className="ph ph-arrow-left"></i> Anterior
            </button>
            <span>
              Página {paginacao.page} de {paginacao.totalPages} · {paginacao.total} mensagens
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
