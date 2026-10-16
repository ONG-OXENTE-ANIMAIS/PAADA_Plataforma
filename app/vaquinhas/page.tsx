"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCampaigns } from "@/lib/CampaignsProvider";
import { BRL, CATEGORIAS, pctOf, type Campaign } from "@/lib/campaigns";
import HashLink from "@/components/shared/HashLink";

/* Barra que cresce ao entrar na viewport (mesma ideia da home). */
function Barra({ pct, className }: { pct: number; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            setOn(true);
            io.disconnect();
          }
        }),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={className} ref={ref}>
      <i style={{ width: (on ? pct : 0) + "%" }}></i>
    </div>
  );
}

function Tile({ c, i }: { c: Campaign; i: number }) {
  const pct = pctOf(c);
  return (
    <Link
      href={`/vaquinha/${c.slug}`}
      className="vt-card"
      data-reveal
      style={{ "--d": `${Math.min(i, 8) * 0.05}s` } as React.CSSProperties}
    >
      <div className="vt-img">
        <img src={c.customImg || c.img} alt={c.title} />
        {c.featured && <span className="vt-chip">Em destaque</span>}
        {c.recurring && <span className="vt-chip rec">Apoio mensal</span>}
        <span className="vt-dias">
          <i className="ph ph-clock"></i>
          {c.recurring ? "contínua" : `${c.days} dias restantes`}
        </span>
      </div>
      <div className="vt-info">
        <span className="cat">
          {c.cat} · {c.place}
        </span>
        <h3>{c.title}</h3>
        <Barra pct={pct} className="vt-barra" />
        <div className="vt-numeros">
          <b>{BRL(c.raised)}</b>
          <span>
            de {BRL(c.goal)} · {pct}% da meta{c.recurring ? " mensal" : ""}
          </span>
        </div>
        <span className="vt-cta">
          Apoiar esta vaquinha <i className="ph ph-arrow-up-right"></i>
        </span>
      </div>
    </Link>
  );
}

export default function VaquinhasPage() {
  const { campaigns } = useCampaigns();
  const [filtro, setFiltro] = useState("todas");
  const [busca, setBusca] = useState("");

  const q = busca.trim().toLowerCase();
  const visiveis = campaigns.filter(
    (c) =>
      (filtro === "todas" || c.cat === filtro) &&
      (!q || `${c.title} ${c.place} ${c.cat}`.toLowerCase().includes(q)),
  );

  const arrecadado = visiveis.reduce((s, c) => s + c.raised, 0);
  const apoiadores = visiveis.reduce((s, c) => s + c.backers, 0);

  return (
    <section className="screen active" data-screen="vaquinhas">
      <div className="page-hero">
        <HashLink href="/" className="v-voltar">
          <i className="ph ph-arrow-left"></i> Voltar para a home
        </HashLink>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Todas as vaquinhas
        </p>
        <h1>
          Cada vaquinha no ar, <em>numa página só</em>.
        </h1>
        <p className="lead">
          A lista completa das campanhas abertas da plataforma — filtre por
          categoria, busque por causa ou cidade e escolha qual história você
          quer ajudar a terminar bem.
        </p>
        <div className="vt-resumo" data-reveal>
          <div>
            <b>{visiveis.length}</b>
            <span>campanhas no ar</span>
          </div>
          <div>
            <b>{BRL(arrecadado)}</b>
            <span>arrecadados até aqui</span>
          </div>
          <div>
            <b>{apoiadores.toLocaleString("pt-BR")}</b>
            <span>apoiadores</span>
          </div>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section
        className="sec sec-wide"
      >
        <div className="vt-filtros">
          <div className="chips" aria-label="Filtrar vaquinhas por categoria">
            <button
              className={filtro === "todas" ? "on" : ""}
              onClick={() => setFiltro("todas")}
            >
              Todas
            </button>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                className={filtro === cat ? "on" : ""}
                onClick={() => setFiltro(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="vt-busca">
            <i className="ph ph-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Buscar por causa ou cidade…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar vaquinhas"
            />
          </div>
        </div>

        {visiveis.length ? (
          <div className="vt-grid" key="grid">
            {visiveis.map((c, i) => (
              <Tile key={c.slug} c={c} i={i} />
            ))}
          </div>
        ) : (
          <div className="vt-vazio" key="vazio" data-reveal>
            <i className="ph ph-binoculars"></i>
            <h3>Nenhuma vaquinha encontrada</h3>
            <p>
              Nada com esses filtros por aqui. Tente outra categoria ou limpe a
              busca — o povo do lugar sempre cria uma vaquinha nova toda
              semana.
            </p>
            <button
              className="btn btn-marrom"
              style={{ marginTop: "22px" }}
              onClick={() => {
                setFiltro("todas");
                setBusca("");
              }}
            >
              <i className="ph ph-arrow-counter-clockwise"></i> Limpar filtros
            </button>
          </div>
        )}
      </section>

      <div className="wrap" style={{ paddingBottom: "90px" }}>
        <div className="compartilhar" style={{ marginTop: 0 }}>
          <div>
            <h3>
              Tem uma causa que <em>só espera por você</em>?
            </h3>
            <p>
              Se a sua ONG não está na lista ainda, ela pode estar: monte a
              vaquinha em minutos ou cadastre a parceria.
            </p>
          </div>
          <div className="grupo-bts">
            <Link href="/admin" className="btn btn-laranja">
              <i className="ph ph-plus"></i> Criar vaquinha
            </Link>
            <Link href="/parcerias" className="btn btn-areia">
              <i className="ph ph-handshake"></i> Ser parceiro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
