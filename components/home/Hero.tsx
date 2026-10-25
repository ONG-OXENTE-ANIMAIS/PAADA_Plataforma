"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HashLink from "@/components/shared/HashLink";
import { useCampaigns } from "@/lib/CampaignsProvider";
import { BRL, pctOf, type Campaign } from "@/lib/campaigns";

const PALAVRAS = ["vaquinha", "corrente", "ideia", "patinha", "coragem"];

/** Card flutuante do hero: usa a campanha em destaque real (se houver). */
function MiniCard({ c }: { c: Campaign }) {
  return (
    <Link className="mini-card" id="miniCard" href={`/vaquinha/${c.slug}`}>
      <small>Em destaque</small>
      <b>{c.title}</b>
      <div className="barra">
        <i style={{ width: pctOf(c) + "%" }}></i>
      </div>
      <div className="leg">
        <b>{BRL(c.raised)}</b>
        <span>{pctOf(c)}% da meta</span>
      </div>
    </Link>
  );
}

export default function Hero() {
  const { campaigns, loading } = useCampaigns();
  const destaque = campaigns.find((c) => c.featured) ?? campaigns[0];
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
          <Link href="/admin/nova" className="btn btn-fantasma">
            Sou da ONG — montar vaquinha <i className="ph ph-arrow-right"></i>
          </Link>
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
          src={destaque?.full ?? "https://picsum.photos/seed/oxente-patas/900/740.jpg"}
          alt={destaque ? `Imagem da campanha ${destaque.title}` : "Cão resgatado em mutirão da Oxente"}
        />
        <img
          className="hv-side"
          src="https://picsum.photos/seed/oxente-abrigo/520/440.jpg"
          alt="Gatos do abrigo do Arraial"
        />
        {destaque ? (
          <MiniCard c={destaque} />
        ) : (
          !loading && (
            <Link className="mini-card" id="miniCard" href="/vaquinhas">
              <small>Em breve</small>
              <b>Nenhuma vaquinha no ar agora</b>
              <div className="leg">
                <span>Crie a primeira no painel da ONG</span>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
