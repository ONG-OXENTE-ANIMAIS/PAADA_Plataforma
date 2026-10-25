"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { TIPOS_SUGESTAO } from "@/lib/campaigns";
import HashLink from "@/components/shared/HashLink";

const LIMITE_MSG = 600;

export default function SugestoesPage() {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("");
  const [msg, setMsg] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-spam
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const limpar = () => {
    setNome("");
    setEmail("");
    setTipo("");
    setMsg("");
    setEnviado(false);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!tipo)
      return toast("Escolha o tipo da sua sugestão.", "warning");
    if (msg.trim().length < 10)
      return toast("Conte um pouco mais — mínimo de 10 caracteres.", "warning");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return toast("Esse e-mail não parece válido.", "warning");

    setEnviando(true);
    try {
      await apiFetch("/api/contato", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.trim() || "Anônimo",
          email: email.trim() || "sem-email@oxente.org",
          assunto: `[Sugestão] ${tipo}`,
          mensagem: msg.trim(),
          tipo: "SUGESTAO",
          website, // honeypot: deve permanecer vazio
        }),
      });
      setEnviado(true);
      toast("Sugestão registrada. Obrigado por ajudar a melhorar!", "lightbulb");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível registrar a sugestão.", "warning");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="screen active" data-screen="sugestoes">
      <div className="page-hero">
        <HashLink href="/como-ajudar" className="v-voltar">
          <i className="ph ph-arrow-left"></i> Voltar para Como Ajudar
        </HashLink>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Sugestões de implementação
        </p>
        <h1>
          Sua ideia deixa a Oxente <em>melhor</em>.
        </h1>
        <p className="lead">
          A plataforma é feita junto com quem usa: doou, criou vaquinha,
          divulgou uma causa e viu algo que pode melhorar? Escreve aqui —
          toda sugestão entra na fila de implementação e recebe resposta.
        </p>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        <div className="form-grid">
          <div className="form-card">
            {enviado ? (
              <div className="form-ok" data-reveal>
                <i className="ph-fill ph-check-circle"></i>
                <h3>Sugestão registrada!</h3>
                <p>
                  A sua ideia caiu direto na caixa de entrada da equipe — com
                  resposta em até 15 dias no e-mail{" "}
                  <b>{email || "informado"}</b>.
                </p>
                <div className="grupo-bts" style={{ justifyContent: "center" }}>
                  <button className="btn btn-marrom" onClick={limpar}>
                    <i className="ph ph-plus"></i> Enviar outra sugestão
                  </button>
                  <Link href="/vaquinhas" className="btn btn-areia">
                    <i className="ph ph-hand-heart"></i> Ver vaquinhas
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={enviar} noValidate>
                <div className="duo">
                  <div className="campo">
                    <label htmlFor="sug-nome">
                      Seu nome <span className="contador">opcional</span>
                    </label>
                    <input
                      id="sug-nome"
                      type="text"
                      placeholder="Como podemos te chamar?"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="sug-email">
                      E-mail <span className="contador">para resposta</span>
                    </label>
                    <input
                      id="sug-email"
                      type="email"
                      placeholder="voce@exemplo.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="campo">
                  <label>Tipo de sugestão</label>
                  <div className="chips" role="group" aria-label="Tipo de sugestão">
                    {TIPOS_SUGESTAO.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={tipo === t ? "on" : ""}
                        onClick={() => setTipo(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="sug-msg">
                    Sua sugestão{" "}
                    <span className="contador">
                      {msg.length}/{LIMITE_MSG}
                    </span>
                  </label>
                  <textarea
                    id="sug-msg"
                    maxLength={LIMITE_MSG}
                    placeholder="O que você implementaria na plataforma? Quanto mais detalhe, mais rápido a ideia vira funcionalidade."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  ></textarea>
                </div>
                {/* honeypot: invisível para pessoas, atrai bots */}
                <div className="campo" aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
                  <label htmlFor="sug-website">Website</label>
                  <input
                    id="sug-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
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
                      <i className="ph ph-circle-notch spin"></i> Enviando…
                    </>
                  ) : (
                    <>
                      <i className="ph-fill ph-lightbulb"></i> Enviar sugestão
                    </>
                  )}
                </button>
                <p className="nota-bib">
                  Sua sugestão vai direto para a fila de implementação da
                  equipe.
                </p>
              </form>
            )}
          </div>

          <aside className="idcard" aria-label="O caminho da sua sugestão">
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
                className="ph-fill ph-lightbulb"
                style={{ fontSize: "26px", color: "var(--laranja)" }}
              ></i>
            </div>
            <dl>
              <div>
                <dt>Semana 1</dt>
                <dd>Chegou e foi registrada</dd>
              </div>
              <div>
                <dt>Semana 2</dt>
                <dd>A equipe técnica avalia</dd>
              </div>
              <div>
                <dt>Até 15 dias</dt>
                <dd>Você recebe a resposta</dd>
              </div>
              <div>
                <dt>Se aprovada</dt>
                <dd>Entra no roadmap público</dd>
              </div>
            </dl>
            <div className="id-valido">
              <i className="ph-fill ph-seal-check" style={{ fontSize: "17px" }}></i>
              Toda sugestão recebe resposta
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}
