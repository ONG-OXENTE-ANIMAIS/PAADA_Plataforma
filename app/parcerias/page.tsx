"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/fx/ToastProvider";
import { FORMAS_PARCERIA, PARCEIROS, TIPOS_ORG } from "@/lib/campaigns";
import HashLink from "@/components/shared/HashLink";
import ParceirosGrid from "@/components/parceiros/ParceirosGrid";

const CHAVE = "oxente-parcerias";
const LIMITE_MSG = 600;

type Cadastro = {
  org: string;
  tipo: string;
  cnpj: string;
  email: string;
  lugar: string;
  site: string;
  formas: string[];
  msg: string;
  quando: string;
};

const lerLista = (): Cadastro[] => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "[]");
  } catch {
    return [];
  }
};

export default function ParceriasPage() {
  const toast = useToast();
  const [org, setOrg] = useState("");
  const [tipo, setTipo] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [lugar, setLugar] = useState("");
  const [site, setSite] = useState("");
  const [formas, setFormas] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [enviado, setEnviado] = useState(false);

  const toggleForma = (f: string) =>
    setFormas((fs) =>
      fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f],
    );

  const limpar = () => {
    setOrg("");
    setTipo("");
    setCnpj("");
    setEmail("");
    setLugar("");
    setSite("");
    setFormas([]);
    setMsg("");
    setEnviado(false);
  };

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!org.trim())
      return toast("Informe o nome da sua organização.", "warning");
    if (!tipo) return toast("Escolha o tipo de organização.", "warning");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return toast("Informe um e-mail de contato válido.", "warning");
    if (!lugar.trim()) return toast("Informe a cidade e o estado.", "warning");
    if (!formas.length)
      return toast("Escolha pelo menos uma forma de ajudar.", "warning");
    if (msg.trim().length < 10)
      return toast("Conte um pouco sobre a organização (mínimo 10 caracteres).", "warning");

    const lista = lerLista();
    lista.unshift({
      org: org.trim(),
      tipo,
      cnpj: cnpj.trim(),
      email: email.trim(),
      lugar: lugar.trim(),
      site: site.trim(),
      formas,
      msg: msg.trim(),
      quando: new Date().toISOString(),
    });
    localStorage.setItem(CHAVE, JSON.stringify(lista));
    setEnviado(true);
    toast("Cadastro de parceria enviado. Bem-vindo(a)!", "handshake");
  }

  return (
    <section className="screen active" data-screen="parcerias">
      <div className="page-hero">
        <div
          className="sobre-hero"
          style={{ padding: 0, gap: "56px" }}
        >
          <div>
            <HashLink href="/" className="v-voltar">
              <i className="ph ph-arrow-left"></i> Voltar para a home
            </HashLink>
            <p className="eyebrow">
              <svg className="sol">
                <use href="#sol" />
              </svg>{" "}
              Parcerias
            </p>
            <h1>
              Sua organização pode caminhar <em>com a gente</em>.
            </h1>
            <p className="lead">
              ONGs, institutos, coletivos, empresas e escolas que apostam no
              Nordeste: a Oxente dá a estrutura — construtor de vaquinhas,
              pagamento seguro e repasse direto — e você traz a causa.
            </p>
            <ul className="compromissos">
              <li>
                <i className="ph-fill ph-hand-heart"></i> Repasse direto na
                conta
              </li>
              <li>
                <i className="ph-fill ph-users-three"></i> Suporte da equipe
              </li>
              <li>
                <i className="ph-fill ph-seal-check"></i> Prestação auditada
              </li>
              <li>
                <i className="ph-fill ph-presentation-chart"></i> Kit de
                divulgação
              </li>
            </ul>
          </div>
          <div className="idcard">
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
                className="ph-fill ph-handshake"
                style={{ fontSize: "26px", color: "var(--laranja)" }}
              ></i>
            </div>
            <dl>
              <div>
                <dt>Modelos</dt>
                <dd>Vaquinha única ou recorrente</dd>
              </div>
              <div>
                <dt>Repasse</dt>
                <dd>Direto na conta da organização</dd>
              </div>
              <div>
                <dt>Operação</dt>
                <dd>6% do arrecadado, auditoria inclusa</dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>Kit com logo, carimbo e texto pronto</dd>
              </div>
            </dl>
            <div className="id-valido">
              <i className="ph-fill ph-seal-check" style={{ fontSize: "17px" }}></i>
              Resposta em até 5 dias úteis
            </div>
          </div>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section
        className="sec sec-wide"
      >
        <div className="sec-head">
          <h2>
            Parceiros que já caminham com a gente{" "}
            <span className="conta">({PARCEIROS.length})</span>
          </h2>
        </div>
        <ParceirosGrid />
      </section>

      <section className="sec-alt">
        <div className="sec sec-wide">
          <div className="sec-head">
            <h2>
              Cadastro de <em>novos parceiros</em>
            </h2>
          </div>
          <div className="form-grid">
            <div className="form-card">
              {enviado ? (
                <div className="form-ok" data-reveal>
                  <i className="ph-fill ph-handshake"></i>
                  <h3>Cadastro enviado!</h3>
                  <p>
                    Recebemos o interesse de parceria da <b>{org}</b>. Nossa
                    equipe responde no e-mail <b>{email}</b> em até 5 dias
                    úteis com os próximos passos.
                  </p>
                  <div className="grupo-bts" style={{ justifyContent: "center" }}>
                    <button className="btn btn-marrom" onClick={limpar}>
                      <i className="ph ph-plus"></i> Cadastrar outro parceiro
                    </button>
                    <Link href="/admin" className="btn btn-areia">
                      <i className="ph ph-target"></i> Explorar o construtor
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={enviar} noValidate>
                  <div className="duo">
                    <div className="campo">
                      <label htmlFor="par-org">
                        Nome da organização{" "}
                        <span className="contador">obrigatório</span>
                      </label>
                      <input
                        id="par-org"
                        type="text"
                        placeholder="Instituto Sossego da Boa Vista"
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="par-cnpj">
                        CNPJ <span className="contador">se tiver</span>
                      </label>
                      <input
                        id="par-cnpj"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="campo">
                    <label>Tipo de organização</label>
                    <div
                      className="chips"
                      role="group"
                      aria-label="Tipo de organização"
                    >
                      {TIPOS_ORG.map((t) => (
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
                  <div className="duo">
                    <div className="campo">
                      <label htmlFor="par-email">
                        E-mail de contato{" "}
                        <span className="contador">obrigatório</span>
                      </label>
                      <input
                        id="par-email"
                        type="email"
                        placeholder="contato@suaorganizacao.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="par-lugar">
                        Cidade/UF <span className="contador">obrigatório</span>
                      </label>
                      <input
                        id="par-lugar"
                        type="text"
                        placeholder="Recife, PE"
                        value={lugar}
                        onChange={(e) => setLugar(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="campo">
                    <label htmlFor="par-site">
                      Site ou Instagram <span className="contador">opcional</span>
                    </label>
                    <input
                      id="par-site"
                      type="text"
                      placeholder="@suacao ou https://…"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label>Como quer ajudar?</label>
                    <div
                      className="chips"
                      role="group"
                      aria-label="Formas de ajudar"
                    >
                      {FORMAS_PARCERIA.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={formas.includes(f) ? "on" : ""}
                          onClick={() => toggleForma(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="campo">
                    <label htmlFor="par-msg">
                      Conte sobre a organização{" "}
                      <span className="contador">
                        {msg.length}/{LIMITE_MSG}
                      </span>
                    </label>
                    <textarea
                      id="par-msg"
                      maxLength={LIMITE_MSG}
                      placeholder="O que faz, desde quando, qual causa moveria sua primeira vaquinha…"
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-laranja"
                    style={{ width: "100%", padding: "16px", fontSize: "16px" }}
                  >
                    <i className="ph-fill ph-handshake"></i> Enviar cadastro de
                    parceria
                  </button>
                  <p className="nota-bib">
                    Protótipo visual: os cadastros ficam salvos apenas neste
                    navegador.
                  </p>
                </form>
              )}
            </div>

            <aside aria-label="Como funciona o cadastro">
              <h3 className="form-lateral-tit">Como funciona o cadastro</h3>
              <ol className="form-passos">
                <li>
                  <div>
                    <b>Você envia este formulário</b>
                    <p>
                      Nome, contato e como quer ajudar — leva menos de três
                      minutos.
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <b>A gente marca uma conversa</b>
                    <p>
                      Uma call de 30 minutos para entender a causa e montar o
                      plano da primeira campanha.
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <b>Assinatura do termo de parceria</b>
                    <p>
                      Documento simples que formaliza repasses, prazos e
                      prestação de contas.
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <b>Sua primeira vaquinha no ar</b>
                    <p>
                      No construtor, com identidade própria — e a Oxente cuida
                      do pagamento.
                    </p>
                  </div>
                </li>
              </ol>
            </aside>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: "90px" }}>
        <div className="compartilhar" style={{ marginTop: 0 }}>
          <div>
            <h3>
              Prefere começar <em>doando</em>?
            </h3>
            <p>
              Dá pra ajudar uma campanha parceira hoje mesmo — o cadastro da
              sua organização pode ficar pra depois.
            </p>
          </div>
          <div className="grupo-bts">
            <Link href="/vaquinhas" className="btn btn-laranja">
              <i className="ph ph-hand-heart"></i> Ver vaquinhas
            </Link>
            <Link href="/como-ajudar" className="btn btn-areia">
              <i className="ph ph-arrow-right"></i> Como Ajudar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
