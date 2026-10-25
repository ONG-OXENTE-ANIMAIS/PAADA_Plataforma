"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import HashLink from "@/components/shared/HashLink";
import { useSession } from "@/hooks/useSession";

export default function AdminLoginPage() {
  const toast = useToast();
  const router = useRouter();
  const { user, loading } = useSession();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  /* já autenticado → direto para o painel */
  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, user, router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!login.trim() || !senha) return toast("Preencha login e senha.", "warning");
    setEnviando(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: login.trim(), senha }),
      });
      toast("Bem-vindo(a) de volta!", "hand-heart");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível entrar.", "warning");
      setEnviando(false);
    }
  }

  return (
    <section className="screen active" data-screen="admin-login">
      <div className="page-hero">
        <HashLink href="/" className="v-voltar">
          <i className="ph ph-arrow-left"></i> Voltar para o site
        </HashLink>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Painel da ONG
        </p>
        <h1>
          Entrar no <em>painel</em>.
        </h1>
        <p className="lead">
          Acesso restrito à equipe da Oxente — campanhas, doações e mensagens
          ficam atrás deste login.
        </p>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        <div className="form-grid">
          <div className="form-card" style={{ maxWidth: "520px" }}>
            <form onSubmit={entrar} noValidate>
              <div className="campo">
                <label htmlFor="lg-login">
                  Login ou e-mail <span className="contador">obrigatório</span>
                </label>
                <input
                  id="lg-login"
                  type="text"
                  placeholder="ex.: equipe.oxente"
                  autoComplete="username"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="lg-senha">
                  Senha <span className="contador">obrigatória</span>
                </label>
                <input
                  id="lg-senha"
                  type="password"
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-laranja"
                style={{ width: "100%", padding: "16px", fontSize: "16px" }}
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <i className="ph ph-circle-notch spin"></i> Entrando…
                  </>
                ) : (
                  <>
                    <i className="ph ph-sign-in"></i> Entrar no painel
                  </>
                )}
              </button>
              <p className="nota-bib">
                A sessão dura 8 horas e fica em um cookie seguro, assinado pelo
                servidor.
              </p>
            </form>
          </div>

          <aside className="idcard" aria-label="Segurança do acesso">
            <svg className="num-bg">
              <use href="#sol" />
            </svg>
            <div className="id-top">
              <span className="logo">
                <svg className="sol">
                  <use href="#sol" />
                </svg>
                oxente
              </span>
              <i
                className="ph-fill ph-shield-check"
                style={{ fontSize: "26px", color: "var(--laranja)" }}
              ></i>
            </div>
            <dl>
              <div>
                <dt>admin</dt>
                <dd>Gerencia tudo, inclusive usuários do painel.</dd>
              </div>
              <div>
                <dt>operador</dt>
                <dd>Cuida de campanhas, doações, parceiros e mensagens.</dd>
              </div>
              <div>
                <dt>Proteções</dt>
                <dd>
                  Senhas com hash bcrypt, limite de tentativas e origem
                  verificada em cada operação.
                </dd>
              </div>
            </dl>
            <div className="id-valido">
              <i className="ph-fill ph-seal-check" style={{ fontSize: "17px" }}></i>
              Acesso monitorado no servidor
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}
