"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";

/** Lista estática das UFs brasileiras (evita uma requisição a mais no form). */
const UFS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "TO", nome: "Tocantins" },
];

type Municipio = { id: number; nome: string };

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

const ANO_ATUAL = new Date().getFullYear();

const FORM_VAZIO = {
  nome: "",
  sigla: "",
  tipo: "ONG",
  area: "",
  estadoSigla: "",
  cidadeNome: "",
  localidade: "",
  descricao: "",
  logo_url: "",
  desde: "",
  destaque: false,
};

export default function AdminParceirosPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [itens, setItens] = useState<Parceiro[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [salvando, setSalvando] = useState(false);

  /* Cascata Estado → Cidade (IBGE). */
  const [cidades, setCidades] = useState<Municipio[]>([]);
  const [cidadesCarregando, setCidadesCarregando] = useState(false);
  const [cidadeErro, setCidadeErro] = useState(false);

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

  async function carregarCidades(uf: string) {
    setCidadesCarregando(true);
    setCidadeErro(false);
    setCidades([]);
    // Atualização funcional: não lê o `form` do fechamento (estale), para não
    // sobrescrever o estadoSigla que o onChange do UF acabou de definir.
    setForm((prev) => ({ ...prev, cidadeNome: "", localidade: "" }));
    try {
      const data = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
      ).then((r) => r.json());
      setCidades(data.map((c: any) => ({ id: c.id, nome: c.nome })));
    } catch {
      setCidadeErro(true);
      toast("Não foi possível carregar as cidades deste estado.", "warning");
    } finally {
      setCidadesCarregando(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    if (!form.nome.trim())
      return toast("Informe o nome do parceiro.", "warning");

    const sigla = form.sigla.trim();
    if (sigla && sigla.length > 3) {
      return toast("A sigla deve ter no máximo 3 caracteres.", "warning");
    }

    const desde = form.desde.trim();
    if (desde && !/^\d{4}$/.test(desde)) {
      return toast(
        "Informe um ano válido (4 dígitos) para 'Parceiro desde'.",
        "warning",
      );
    }
    if (desde) {
      const ano = Number(desde);
      if (ano < 1900 || ano > ANO_ATUAL + 1) {
        return toast(
          `O ano deve estar entre 1900 e ${ANO_ATUAL + 1}.`,
          "warning",
        );
      }
    }

    setSalvando(true);
    try {
      await apiFetch("/api/parceiros", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome.trim(),
          sigla: sigla || null,
          tipo: form.tipo.trim() || null,
          area: form.area.trim() || null,
          localidade:
            form.cidadeNome && form.estadoSigla
              ? `${form.cidadeNome} - ${form.estadoSigla}`
              : form.localidade.trim() || null,
          descricao: form.descricao.trim() || null,
          logo_url: form.logo_url.trim() || null,
          desde: desde || null,
          destaque: form.destaque,
          ativo: true,
        }),
      });
      toast("Parceiro cadastrado.", "handshake");
      setForm({ ...FORM_VAZIO });
      setCidades([]);
      setCidadeErro(false);
      setMostrarForm(false);
      carregar();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Não foi possível salvar.",
        "warning",
      );
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
      toast(
        p.ativo ? "Parceiro desativado." : "Parceiro ativado.",
        "check-circle",
      );
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
      toast(
        e instanceof Error ? e.message : "Não foi possível excluir.",
        "warning",
      );
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
          <button
            className="btn btn-laranja"
            onClick={() => setMostrarForm((v) => !v)}
          >
            <i className="ph ph-plus"></i>{" "}
            {mostrarForm ? "Fechar formulário" : "Novo parceiro"}
          </button>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        {mostrarForm && (
          <form
            onSubmit={salvar}
            className="form-card"
            style={{ marginBottom: "26px" }}
            noValidate
          >
            <h3>Novo parceiro</h3>

            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-nome">
                  Nome <span className="contador">obrigatório</span>
                </label>
                <input
                  id="pc-nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="pc-sigla">
                  Sigla <span className="contador">até 3 letras</span>
                </label>
                <input
                  id="pc-sigla"
                  maxLength={3}
                  value={form.sigla.toUpperCase()}
                  onChange={(e) =>
                    setForm({ ...form, sigla: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>

            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-tipo">Tipo</label>
                <select
                  id="pc-tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {[
                    "ONG",
                    "Instituto",
                    "Coletivo",
                    "Empresa",
                    "Escola",
                    "Outro",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="pc-area">Área de atuação</label>
                <input
                  id="pc-area"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
              </div>
            </div>

            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-uf">
                  Estado <span className="contador">primeiro passo</span>
                </label>
                <select
                  id="pc-uf"
                  value={form.estadoSigla}
                  disabled={cidadesCarregando}
                  onChange={(e) => {
                    const uf = e.target.value;
                    setForm({
                      ...form,
                      estadoSigla: uf,
                      cidadeNome: "",
                      localidade: "",
                    });
                    if (uf) carregarCidades(uf);
                  }}
                >
                  <option value="">Selecione o estado</option>
                  {UFS.map((u) => (
                    <option key={u.sigla} value={u.sigla}>
                      {u.nome} ({u.sigla})
                    </option>
                  ))}
                </select>
                {cidadesCarregando && (
                  <span className="contador">Buscando cidades…</span>
                )}
              </div>
              <div className="campo">
                <label htmlFor="pc-cidade">
                  Cidade <span className="contador">conforme o estado</span>
                </label>
                {cidadeErro ? (
                  <input
                    id="pc-cidade"
                    placeholder="Digite a cidade manualmente"
                    value={form.cidadeNome}
                    onChange={(e) =>
                      setForm({ ...form, cidadeNome: e.target.value })
                    }
                  />
                ) : (
                  <select
                    id="pc-cidade"
                    value={form.cidadeNome}
                    disabled={!form.estadoSigla || cidadesCarregando}
                    onChange={(e) =>
                      setForm({ ...form, cidadeNome: e.target.value })
                    }
                  >
                    <option value="">Escolha o estado primeiro</option>
                    {cidades.map((c) => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                )}
                {cidadeErro && (
                  <span className="contador" style={{ color: "#b3261e" }}>
                    API indisponível — digite a cidade
                  </span>
                )}
              </div>
            </div>

            <div className="duo">
              <div className="campo">
                <label htmlFor="pc-desde">
                  Parceiro desde <span className="contador">ano válido</span>
                </label>
                <input
                  id="pc-desde"
                  type="number"
                  min="1900"
                  max={ANO_ATUAL + 1}
                  placeholder={String(ANO_ATUAL)}
                  value={form.desde}
                  onChange={(e) => setForm({ ...form, desde: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="pc-logo">Logo (URL)</label>
                <input
                  id="pc-logo"
                  type="url"
                  placeholder="https://…"
                  value={form.logo_url}
                  onChange={(e) =>
                    setForm({ ...form, logo_url: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="campo">
              <label htmlFor="pc-desc">
                Descrição <span className="contador">uma linha no card</span>
              </label>
              <textarea
                id="pc-desc"
                maxLength={220}
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
              ></textarea>
            </div>

            <div className="campo">
              <label htmlFor="pc-destaque" className="campo-check">
                <input
                  id="pc-destaque"
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(e) =>
                    setForm({ ...form, destaque: e.target.checked })
                  }
                />
                Parceria em destaque (aparece na home)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-laranja"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <i className="ph ph-circle-notch spin"></i> Salvando…
                </>
              ) : (
                <>
                  <i className="ph ph-floppy-disk"></i> Cadastrar parceiro
                </>
              )}
            </button>
          </form>
        )}

        {erro ? (
          <div className="form-card">
            <h3>
              <i className="ph ph-warning" style={{ color: "#b3261e" }}></i>{" "}
              Erro ao carregar
            </h3>
            <p style={{ opacity: 0.8 }}>{erro}</p>
          </div>
        ) : itens && !itens.length ? (
          <div className="form-card">
            <h3>Nenhum parceiro cadastrado</h3>
            <p style={{ opacity: 0.8 }}>
              Cadastre o primeiro com o botão “Novo parceiro”.
            </p>
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
                    <div style={{ fontSize: "12px", opacity: 0.6 }}>
                      {p.descricao}
                    </div>
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    {p.tipo} · {p.area ?? "—"}
                  </td>
                  <td style={{ fontSize: "13px" }}>{p.localidade ?? "—"}</td>
                  <td>
                    <span
                      className="adm-tag-status"
                      style={{
                        background: p.ativo ? "#30D07033" : "#00000014",
                        color: p.ativo ? "#1c7c44" : "#555",
                      }}
                    >
                      {p.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                    {p.destaque ? " ★" : ""}
                  </td>
                  <td>
                    <div className="adm-acoes">
                      <button
                        className="adm-acao-btn"
                        onClick={() => alternarAtivo(p)}
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        className="adm-acao-btn perigo"
                        onClick={() => excluir(p)}
                      >
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
