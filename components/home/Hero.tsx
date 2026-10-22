"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HashLink from "@/components/shared/HashLink";
import { BRL, DESTAQUE, pctOf } from "@/lib/campaigns";

const PALAVRAS = ["vaquinha", "corrente", "ideia", "patinha", "coragem"];

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const [troca, setTroca] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTroca(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PALAVRAS.length);
        setTroca(false);
      }, 270);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hero">
      <div>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Projeto Oxente · Petrolina, Pernambuco
        </p>
        <h1>
          Mudar o mundo começa com uma{" "}
          <span className={"rot" + (troca ? " troca" : "")} id="rotWord">
            {PALAVRAS[idx]}
          </span>
          .
        </h1>
        <p className="sub">
          Escolha uma causa, pague por Pix ou cartão em menos de um
          minuto — e acompanhe cada real virando história. Sem cadastro, sem
          burocracia, com total compromisso com a causa animal.
        </p>
        <div className="hero-ctas">
          <HashLink href="/#vaquinhas" className="btn btn-marrom">
            Ir para Vaquinha <i className="ph ph-arrow-down"></i>
          </HashLink>
          {/* <Link href="/admin" className="btn btn-fantasma">
            Sou da ONG — montar vaquinha <i className="ph ph-arrow-right"></i>
          </Link> */}
        </div>
        <div className="hero-confia">
          <div>
            <b>
              <i className="ph-fill ph-lightning"></i>~40s
            </b>
            <span>pra doar via Pix</span>
          </div>
          <div>
            <b>
              <i className="ph-fill ph-incognito"></i>Zero cadastro
            </b>
            <span>pra doar como anônimo</span>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <svg className="selo" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="60" fill="#FC681A" />
          <g className="gira">
            <defs>
              <path
                id="circ"
                d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"
              />
            </defs>
            <text>
              <textPath href="#circ">
                DOE • AJUDE • TRANSFORME • &#160;
              </textPath>
            </text>
          </g>
          <svg
            x="43"
            y="43"
            width="34"
            height="34"
            viewBox="0 0 24 24"
            style={{ color: "#301607" }}
          >
            <use href="#sol" />
          </svg>
        </svg>
        <img
          className="hv-main"
          src="https://picsum.photos/seed/oxente-patas/900/740.jpg"
          alt="Cão resgatado em mutirão da Oxente"
        />
        <img
          className="hv-side"
          src="https://picsum.photos/seed/oxente-abrigo/520/440.jpg"
          alt="Gatos do abrigo do Arraial"
        />
        <Link className="mini-card" id="miniCard" href={`/vaquinha/${DESTAQUE.slug}`}>
          <small>Em destaque</small>
          <b>{DESTAQUE.title}</b>
          <div className="barra">
            <i style={{ width: pctOf(DESTAQUE) + "%" }}></i>
          </div>
          <div className="leg">
            <b>{BRL(DESTAQUE.raised)}</b>
            <span>{pctOf(DESTAQUE)}% da meta</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
