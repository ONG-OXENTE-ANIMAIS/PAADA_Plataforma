"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  login: string;
  tipo: "admin" | "operador";
  ativo: boolean;
  criado_em: string;
};

type Pagina<T> = { data: T[]; pagination: { total: number } };

const FORM_VAZIO = { nome: "", email: "", login: "", senha: "", tipo: "operador" };

export default function AdminUsuariosPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [itens, setItens] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ ...FORM_VAZIO });
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    apiFetch<Pagina<Usuario>>("/api/usuarios?limit=100")
      .then((p) => {
        setItens(p.data);
        setErro(null);
      })
      .catch((e: Error) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (user?.tipo === "admin") carregar();
  }, [user, carregar]);

  if (sessaoCarregando || !user) return null;

  if (user.tipo !== "admin") {
    return (
      <section className="screen active" data-screen="admin-usuarios">
        <div className="adm-head wrap">
          <h1>Usuários</h1>
          <p>Apenas administradores podem gerenciar usuários do painel.</p>
        </div>
        <div className="fita" aria-hidden="true"></div>
        <section className="sec sec-wide">
          <div className="form-card">
            <h3><i className="ph ph-lock" style={{ color: "#8a5a00" }}></i> Acesso restrito</h3>
            <p style={{ opacity: 0.8 }}>
              Seu perfil é <b>operador</b>. Peça a um administrador para criar
              ou ajustar contas.
            </p>
          </div>
        </section>
      </section>
    );
  }

  const usuarioAtual = user;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    if (form.senha.length < 10)
      return toast("A senha precisa ter ao menos 10 caracteres.", "warning");
    setSalvando(true);
    try {
      await apiFetch("/api/usuarios", {
        method: "POST",
        body: JSON.stringify({ ...form, nome: form.nome.trim(), email: form.email.trim(), login: form.login.trim() }),
      });
      toast("Usuário criado com senha criptografada (bcrypt).", "shield-check");
      setForm({ ...FORM_VAZIO });
      setMostrarForm(false);
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível criar o usuário.", "warning");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(u: Usuario) {
    if (u.id === usuarioAtual.id) return toast("Você não pode desativar a si mesmo.", "warning");
    try {
      await apiFetch(`/api/usuarios/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: !u.ativo }),
      });
      toast(u.ativo ? "Usuário desativado." : "Usuário reativado.", "check-circle");
      carregar();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Operação falhou.", "warning");
    }
  }

  async function excluir(u: Usuario) {
    if (u.id === usuarioAtual.id) return toast("Você não pode excluir a si mesmo.", "warning");
    if (!confirm(`Excluir o usuário ${u.nome}? Operadores administrativos perdem o acesso imediatamente.`)) return;
    try {
      await apiFetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
      toast("Usuário excluído.", "trash");
      carregar();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não foi possível excluir.", "warning");
    }
  }

  const dataCurta = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section className="screen active" data-screen="admin-usuarios">
      <div className="adm-head wrap">
        <h1>Usuários do painel</h1>
        <p>
          Equipe administrativa da Oxente. Senhas são armazenadas com hash
          bcrypt (12 rounds) e nunca voltam pela API.
        </p>
        <div className="adm-bts">
          <button className="btn btn-laranja" onClick={() => setMostrarForm((v) => !v)}>
            <i className="ph ph-plus"></i> {mostrarForm ? "Fechar formulário" : "Novo usuário"}
          </button>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        {mostrarForm && (
          <form onSubmit={salvar} className="form-card" style={{ marginBottom: "26px" }} noValidate>
            <h3>Novo usuário</h3>
            <div className="duo">
              <div className="campo">
                <label htmlFor="us-nome">Nome <span className="contador">obrigatório</span></label>
                <input id="us-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="campo">
                <label htmlFor="us-email">E-mail <span className="contador">obrigatório</span></label>
                <input id="us-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="duo">
              <div className="campo">
                <label htmlFor="us-login">Login <span className="contador">letras, números, ponto, _ ou -</span></label>
                <input id="us-login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
              </div>
              <div className="campo">
                <label htmlFor="us-tipo">Perfil</label>
                <select id="us-tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="operador">Operador — opera campanhas, doações, parceiros e mensagens</option>
                  <option value="admin">Admin — acesso total, incluindo usuários</option>
                </select>
              </div>
            </div>
            <div className="campo">
              <label htmlFor="us-senha">Senha <span className="contador">mínimo de 10 caracteres</span></label>
              <input id="us-senha" type="password" autoComplete="new-password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-laranja" disabled={salvando}>
              {salvando ? <><i className="ph ph-circle-notch spin"></i> Criando…</> : <><i className="ph ph-user-plus"></i> Criar usuário</>}
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
            <h3>Nenhum usuário</h3>
            <p style={{ opacity: 0.8 }}>Crie o primeiro acesso da equipe.</p>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Login</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(itens ?? []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.nome}</b>
                    <div style={{ fontSize: "12px", opacity: 0.6 }}>{u.email}</div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{u.login}</td>
                  <td>
                    <span className="adm-tag-status" style={{ background: u.tipo === "admin" ? "#FC681A22" : "#00909026", color: u.tipo === "admin" ? "#b3450b" : "#006969" }}>
                      {u.tipo.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="adm-tag-status" style={{ background: u.ativo ? "#30D07033" : "#00000014", color: u.ativo ? "#1c7c44" : "#555" }}>
                      {u.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                  </td>
                  <td style={{ fontSize: "12.5px", opacity: 0.7 }}>{dataCurta(u.criado_em)}</td>
                  <td>
                    <div className="adm-acoes">
                      <button className="adm-acao-btn" onClick={() => alternarAtivo(u)} disabled={u.id === usuarioAtual.id}>
                        {u.ativo ? "Desativar" : "Reativar"}
                      </button>
                      <button className="adm-acao-btn perigo" onClick={() => excluir(u)} disabled={u.id === usuarioAtual.id}>
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
