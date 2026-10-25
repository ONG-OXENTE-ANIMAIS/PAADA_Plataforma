"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";

type Doacao = {
  id: string;
  campanha_id: string;
  campanha_titulo?: string;
  nome: string | null;
  email: string | null;
  anonimo: boolean;
  valor: number;
  status: "PENDENTE" | "PAGA" | "CANCELADA" | "REEMBOLSADA";
  txid: string;
  payment_id: string | null;
  criado_em: string;
  pago_em: string | null;
};

type Pagina<T> = { data: T[]; pagination: { page: number; totalPages: number; total: number } };

const STATUS_CORES: Record<string, { bg: string; fg: string }> = {
  PAGA: { bg: "#30D07033", fg: "#1c7c44" },
  PENDENTE: { bg: "#fbbf2455", fg: "#8a5a00" },
  CANCELADA: { bg: "#00000014", fg: "#555" },
  REEMBOLSADA: { bg: "#b3261e26", fg: "#b3261e" },
};

const BRL = (v: number) => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export default function AdminDoacoesPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [itens, setItens] = useState<Doacao[] | null>(null);
  const [paginacao, setPaginacao] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState("");
  const [periodo, setPeriodo] = useState({ de: "", ate: "" });
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    (page = 1) => {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (status) params.set("status", status);
      if (periodo.de) params.set("from", periodo.de);
      if (periodo.ate) params.set("to", periodo.ate);
      apiFetch<Pagina<Doacao>>(`/api/doacoes?${params}`)
        .then((p) => {
          setItens(p.data);
          setPaginacao(p.pagination);
          setErro(null);
        })
        .catch((e: Error) => setErro(e.message));
    },
    [status, periodo],
  );

  useEffect(() => {
    if (user) carregar(1);
  }, [user, carregar]);

  if (sessaoCarregando || !user) return null;

  async function mudarStatus(d: Doacao, novo: "CANCELADA" | "REEMBOLSADA") {
    const msg =
      novo === "REEMBOLSADA"
        ? `Confirmar reembolso de ${BRL(d.valor)}? O valor sai do total arrecadado da campanha.`
        : `Cancelar a doação de ${BRL(d.valor)}?`;
    if (!confirm(msg)) return;
    try {
      await apiFetch(`/api/doacoes/${d.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: novo }),
      });
      toast(`Doação marcada como ${novo.toLowerCase()}.`, "check-circle");
      carregar(paginacao.page);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Operação falhou.", "warning");
    }
  }

  const dataCurta = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <section className="screen active" data-screen="admin-doacoes">
      <div className="adm-head wrap">
        <h1>Doações</h1>
        <p>
          Registro financeiro da plataforma. Doações nascem PENDENTES e viram
          PAGAS só pela confirmação do webhook do provedor — aqui você pode
          cancelar pendências e registrar reembolsos.
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
            <option value="PENDENTE">Pendente</option>
            <option value="PAGA">Paga</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="REEMBOLSADA">Reembolsada</option>
          </select>
          <label style={{ fontSize: "13px", opacity: 0.8 }}>
            De{" "}
            <input
              type="date"
              value={periodo.de}
              onChange={(e) => setPeriodo((p) => ({ ...p, de: e.target.value }))}
              style={{ padding: "8px 10px", borderRadius: "10px", border: "1.5px solid rgba(48,22,7,.2)" }}
            />
          </label>
          <label style={{ fontSize: "13px", opacity: 0.8 }}>
            Até{" "}
            <input
              type="date"
              value={periodo.ate}
              onChange={(e) => setPeriodo((p) => ({ ...p, ate: e.target.value }))}
              style={{ padding: "8px 10px", borderRadius: "10px", border: "1.5px solid rgba(48,22,7,.2)" }}
            />
          </label>
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
            <h3>Nenhuma doação no filtro</h3>
            <p style={{ opacity: 0.8 }}>Ajuste status ou período.</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Valor</th>
                <th>Doador</th>
                <th>Status</th>
                <th>Txid / Pagamento</th>
                <th>Criada</th>
                <th>Paga</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(itens ?? []).map((d) => {
                const cor = STATUS_CORES[d.status] ?? STATUS_CORES.CANCELADA;
                return (
                  <tr key={d.id}>
                    <td><b>{BRL(d.valor)}</b></td>
                    <td>
                      {d.anonimo ? (
                        <span style={{ fontStyle: "italic", opacity: 0.7 }}>Anônimo</span>
                      ) : (
                        <>
                          <b>{d.nome ?? "—"}</b>
                          <div style={{ fontSize: "12px", opacity: 0.6 }}>{d.email ?? ""}</div>
                        </>
                      )}
                    </td>
                    <td>
                      <span className="adm-tag-status" style={{ background: cor.bg, color: cor.fg }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", fontFamily: "monospace", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.txid}
                      {d.payment_id ? ` · MP:${d.payment_id}` : ""}
                    </td>
                    <td style={{ fontSize: "12.5px", opacity: 0.7 }}>{dataCurta(d.criado_em)}</td>
                    <td style={{ fontSize: "12.5px", opacity: 0.7 }}>{dataCurta(d.pago_em)}</td>
                    <td>
                      <div className="adm-acoes">
                        {d.status !== "CANCELADA" && d.status !== "REEMBOLSADA" && (
                          <button className="adm-acao-btn" onClick={() => mudarStatus(d, "CANCELADA")}>
                            Cancelar
                          </button>
                        )}
                        {d.status === "PAGA" && (
                          <button className="adm-acao-btn perigo" onClick={() => mudarStatus(d, "REEMBOLSADA")}>
                            Reembolsar
                          </button>
                        )}
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
            <button className="adm-acao-btn" disabled={paginacao.page <= 1} onClick={() => carregar(paginacao.page - 1)}>
              <i className="ph ph-arrow-left"></i> Anterior
            </button>
            <span>
              Página {paginacao.page} de {paginacao.totalPages} · {paginacao.total} doações
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
