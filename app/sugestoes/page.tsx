"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/fx/ToastProvider";
import { TIPOS_SUGESTAO } from "@/lib/campaigns";
import HashLink from "@/components/shared/HashLink";

const CHAVE = "oxente-sugestoes";
const LIMITE_MSG = 600;

type Sugestao = {
  nome: string;
  email: string;
  tipo: string;
  msg: string;
  quando: string;
};

const lerLista = (): Sugestao[] => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "[]");
  } catch {
    return [];
  }
};

export default function SugestoesPage() {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("");
  const [msg, setMsg] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [total, setTotal] = useState(0);

  const limpar = () => {
    setNome("");
    setEmail("");
    setTipo("");
    setMsg("");
    setEnviado(false);
  };

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo)
      return toast("Escolha o tipo da sua sugestão.", "warning");
    if (msg.trim().length < 10)
      return toast("Conte um pouco mais — mínimo de 10 caracteres.", "warning");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return toast("Esse e-mail não parece válido.", "warning");

    const lista = lerLista();
    lista.unshift({
      nome: nome.trim(),
      email: email.trim(),
      tipo,
      msg: msg.trim(),
      quando: new Date().toISOString(),
    });
    localStorage.setItem(CHAVE, JSON.stringify(lista));
    setTotal(lista.length);
    setEnviado(true);
    toast("Sugestão registrada. Obrigado por ajudar a melhorar!", "lightbulb");
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

      <section
        className="sec sec-wide"
      >
        <div className="form-grid">
          <div className="form-card">
            {enviado ? (
              <div className="form-ok" data-reveal>
                <i className="ph-fill ph-check-circle"></i>
                <h3>Sugestão registrada!</h3>
                <p>
                  Já são <b>{total}</b> sugestão(ões) guardadas neste
                  navegador. Na plataforma final, a sua ideia cai direto na
                  caixa de entrada da equipe — com resposta em até 15 dias.
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
                <button
                  type="submit"
                  className="btn btn-laranja"
                  style={{ width: "100%", padding: "16px", fontSize: "16px" }}
                >
                  <i className="ph-fill ph-lightbulb"></i> Enviar sugestão
                </button>
                <p className="nota-bib">
                  Protótipo visual: as sugestões ficam salvas apenas neste
                  navegador.
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
