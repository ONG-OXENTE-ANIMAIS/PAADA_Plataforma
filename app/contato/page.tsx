"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import HashLink from "@/components/shared/HashLink";

const LIMITE_MSG = 600;

/* Canais publicados no rodapé — nenhum contato inventado. */
const CANAIS = [
  {
    icon: "envelope-simple",
    tit: "E-mail",
    valor: "ola@oxente.org",
    href: "mailto:ola@oxente.org",
    externo: false,
    desc: "Para dúvidas sobre doações, vaquinhas e repasses.",
  },
  {
    icon: "whatsapp-logo",
    tit: "WhatsApp",
    valor: "(81) 9 8888-0000",
    href: "http://wa.me/+558****0000",
    externo: true,
    desc: "Atendimento rápido em horário comercial.",
  },
  {
    icon: "instagram-logo",
    tit: "Instagram",
    valor: "@projetooxenteanimais",
    href: "https://www.instagram.com/projetooxenteanimais/",
    externo: true,
    desc: "Bastidores dos mutirões e novidades das campanhas.",
  },
];

export default function ContatoPage() {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-spam
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const limpar = () => {
    setNome("");
    setEmail("");
    setAssunto("");
    setMensagem("");
    setEnviado(false);
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!nome.trim()) return toast("Informe o seu nome.", "warning");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return toast("Informe um e-mail válido para a resposta.", "warning");
    if (!assunto.trim()) return toast("Escreva o assunto da mensagem.", "warning");
    if (mensagem.trim().length < 10)
      return toast("Conte um pouco mais — mínimo de 10 caracteres.", "warning");

    setEnviando(true);
    try {
      await apiFetch("/api/contato", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          assunto: assunto.trim(),
          mensagem: mensagem.trim(),
          tipo: "CONTATO",
          website, // honeypot: deve permanecer vazio
        }),
      });
      setEnviado(true);
      toast("Mensagem enviada. Já está na nossa caixa de entrada!", "envelope-open");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.", "warning");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="screen active" data-screen="contato">
      <div className="page-hero">
        <HashLink href="/" className="v-voltar">
          <i className="ph ph-arrow-left"></i> Voltar para a home
        </HashLink>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Contato
        </p>
        <h1>
          Alguma dúvida? <em>Chama a gente</em>.
        </h1>
        <p className="lead">
          Doação travada, ideia de parceria, imprensa ou vontade de ajudar:
          escolha o canal que for melhor pra você — toda mensagem recebe
          resposta.
        </p>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        <div className="ct-canais">
          {CANAIS.map((c, i) => (
            <a
              key={c.tit}
              className="ct-canal"
              href={c.href}
              data-reveal
              style={{ "--d": `${i * 0.07}s` } as React.CSSProperties}
              {...(c.externo
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="ct-icone" aria-hidden="true">
                <i className={`ph ph-${c.icon}`}></i>
              </span>
              <div>
                <h3>{c.tit}</h3>
                <p className="ct-valor">{c.valor}</p>
                <p className="ct-desc">{c.desc}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="form-grid">
          <div className="form-card">
            {enviado ? (
              <div className="form-ok" data-reveal>
                <i className="ph-fill ph-check-circle"></i>
                <h3>Mensagem recebida!</h3>
                <p>
                  Obrigado, <b>{nome}</b>. A sua mensagem entrou na fila com o
                  status abaixo — a resposta chega no e-mail{" "}
                  <b>{email}</b>.
                </p>
                <span className="ct-status">
                  <i className="ph-fill ph-envelope-open"></i> status: Recebida
                </span>
                <div className="grupo-bts" style={{ justifyContent: "center" }}>
                  <button className="btn btn-marrom" onClick={limpar}>
                    <i className="ph ph-plus"></i> Enviar outra mensagem
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
                    <label htmlFor="ct-nome">
                      Nome <span className="contador">obrigatório</span>
                    </label>
                    <input
                      id="ct-nome"
                      type="text"
                      placeholder="Como podemos te chamar?"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="ct-email">
                      E-mail{" "}
                      <span className="contador">para resposta</span>
                    </label>
                    <input
                      id="ct-email"
                      type="email"
                      placeholder="voce@exemplo.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="ct-assunto">
                    Assunto <span className="contador">obrigatório</span>
                  </label>
                  <input
                    id="ct-assunto"
                    type="text"
                    placeholder="Dúvida com doação, parceria, imprensa…"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="ct-msg">
                    Mensagem{" "}
                    <span className="contador">
                      {mensagem.length}/{LIMITE_MSG}
                    </span>
                  </label>
                  <textarea
                    id="ct-msg"
                    maxLength={LIMITE_MSG}
                    placeholder="Escreva com calma — quanto mais contexto, mais rápida a resposta."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                  ></textarea>
                </div>
                {/* honeypot: invisível para pessoas, atrai bots */}
                <div className="campo" aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
                  <label htmlFor="ct-website">Website</label>
                  <input
                    id="ct-website"
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
                      <i className="ph-fill ph-paper-plane-tilt"></i> Enviar mensagem
                    </>
                  )}
                </button>
                <p className="nota-bib">
                  Sua mensagem vai direto para a caixa de entrada da equipe,
                  com status de acompanhamento.
                </p>
              </form>
            )}
          </div>

          <aside className="idcard" aria-label="O caminho da sua mensagem">
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
                className="ph-fill ph-chats-circle"
                style={{ fontSize: "26px", color: "var(--laranja)" }}
              ></i>
            </div>
            <dl>
              <div>
                <dt>1 · Recebida</dt>
                <dd>Cai direto na caixa de entrada da equipe.</dd>
              </div>
              <div>
                <dt>2 · Em análise</dt>
                <dd>Alguém lê, verifica e encaminha pra quem resolve.</dd>
              </div>
              <div>
                <dt>3 · Respondido</dt>
                <dd>
                  Você recebe a resposta no e-mail informado no formulário.
                </dd>
              </div>
            </dl>
            <div className="id-valido">
              <i className="ph-fill ph-seal-check" style={{ fontSize: "17px" }}></i>
              Toda mensagem recebe resposta
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}
