"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";

type Parceiro = {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: string | null;
  area: string | null;
  localidade: string | null;
  descricao: string | null;
  logo_url: string | null;
  desde: string | null;
  destaque: boolean;
  ativo: boolean;
};

type Pagina<T> = { data: T[]; pagination: { total: number } };

const FORM_VAZIO = { nome: "", sigla: "", tipo: "ONG", area: "", localidade: "", descricao: "", logo_url: "", desde: "", destaque: false };

export default function AdminParceirosPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [itens, setItens] = useState<Parceiro[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    apiFetch<Pagina<Parceiro>>("/api/parceiros?limit=100&admin=true")
      .then((p) => {
        setItens(p.data);
        setErro(null);
      })
      .catch((e: Error) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (user) carregar();
  }, [user, carregar]);

  if (sessaoCarregando || !user) return null;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    if (!form.nome.trim()) return toast("Informe o nome do parceiro.", "warning");
    setSalvando(true);
    try {
      await apiFetch("/api/parceiros", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome.trim(),
          sigla: form.sigla.trim() || null,
          tipo: form.tipo.trim() || null,
          area: form.area.trim() || null,
          localidade: form.localidade.trim() || null,
          descricao: form.descricao.trim() || null,
          logo_url: form.logo_url.trim() || null,
          desde: form.desde.trim() || null,
          destaque: form.destaque,
          ativo: true,
        }),
      });
      toast("Parceiro cadastrado.", "handshake");
      setForm({ ...FORM_VAZIO });
      setMostrarForm(false);
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível salvar.", "warning");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(p: Parceiro) {
    try {
      await apiFetch(`/api/parceiros/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: !p.ativo }),
      });
      toast(p.ativo ? "Parceiro desativado." : "Parceiro ativado.", "check-circle");
      carregar();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Operação falhou.", "warning");
    }
  }

  async function excluir(p: Parceiro) {
    if (!confirm(`Excluir o parceiro “${p.nome}”?`)) return;
    try {
      await apiFetch(`/api/parceiros/${p.id}`, { method: "DELETE" });
      toast("Parceiro excluído.", "trash");
      carregar();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não foi possível excluir.", "warning");
    }
  }

  return (
    <section className="screen active" data-screen="admin-parceiros">
      <div className="adm-head wrap">
        <h1>Parceiros</h1>
        <p>
          Quem caminha com a Oxente. Parceiros ativos aparecem na home; os
          inativos ficam só aqui no painel.
        </p>
        <div className="adm-bts">
          <button className="btn btn-laranja" onClick={() => setMostrarForm((v) => !v)}>
            <i className="ph ph-plus"></i> {mostrarForm ? "Fechar formulário" : "Novo parceiro"}
          </button>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        {mostrarForm && (
          <form onSubmit={salvar} className="form-card" style={{ marginBottom: "26px" }} noValidate>
            <h3>Novo parceiro</h3>
            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-nome">Nome <span className="contador">obrigatório</span></label>
                <input id="pc-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="campo">
                <label htmlFor="pc-sigla">Sigla <span className="contador">2–3 letras</span></label>
                <input id="pc-sigla" maxLength={5} value={form.sigla} onChange={(e) => setForm({ ...form, sigla: e.target.value })} />
              </div>
            </div>
            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-tipo">Tipo</label>
                <select id="pc-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  {["ONG", "Instituto", "Coletivo", "Empresa", "Escola", "Outro"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="pc-area">Área de atuação</label>
                <input id="pc-area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              </div>
            </div>
            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-local">Localidade</label>
                <input id="pc-local" placeholder="Recife, PE" value={form.localidade} onChange={(e) => setForm({ ...form, localidade: e.target.value })} />
              </div>
              <div className="campo">
                <label htmlFor="pc-desde">Parceiro desde</label>
                <input id="pc-desde" placeholder="2023" value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value })} />
              </div>
            </div>
            <div className="campo">
              <label htmlFor="pc-desc">Descrição <span className="contador">uma linha no card</span></label>
              <textarea id="pc-desc" maxLength={220} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}></textarea>
            </div>
            <div className="campo">
              <label htmlFor="pc-logo">Logo (URL)</label>
              <input id="pc-logo" type="url" placeholder="https://…" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </div>
            <label htmlFor="pc-destaque" style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "14px", marginBottom: "14px", cursor: "pointer" }}>
              <input id="pc-destaque" type="checkbox" checked={form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} />
              Parceria em destaque (aparece na home)
            </label>
            <button type="submit" className="btn btn-laranja" disabled={salvando}>
              {salvando ? <><i className="ph ph-circle-notch spin"></i> Salvando…</> : <><i className="ph ph-floppy-disk"></i> Cadastrar parceiro</>}
            </button>
          </form>
        )}

        {erro ? (
          <div className="form-card">
            <h3><i className="ph ph-warning" style={{ color: "#b3261e" }}></i> Erro ao carregar</h3>
            <p style={{ opacity: 0.8 }}>{erro}</p>
          </div>
        ) : itens && !itens.length ? (
          <div className="form-card">
            <h3>Nenhum parceiro cadastrado</h3>
            <p style={{ opacity: 0.8 }}>Cadastre o primeiro com o botão “Novo parceiro”.</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>Tipo · Área</th>
                <th>Localidade</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(itens ?? []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.nome}</b>
                    <div style={{ fontSize: "12px", opacity: 0.6 }}>{p.descricao}</div>
                  </td>
                  <td style={{ fontSize: "13px" }}>{p.tipo} · {p.area ?? "—"}</td>
                  <td style={{ fontSize: "13px" }}>{p.localidade ?? "—"}</td>
                  <td>
                    <span
                      className="adm-tag-status"
                      style={{ background: p.ativo ? "#30D07033" : "#00000014", color: p.ativo ? "#1c7c44" : "#555" }}
                    >
                      {p.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                    {p.destaque ? " ★" : ""}
                  </td>
                  <td>
                    <div className="adm-acoes">
                      <button className="adm-acao-btn" onClick={() => alternarAtivo(p)}>
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button className="adm-acao-btn perigo" onClick={() => excluir(p)}>
                        <i className="ph ph-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
