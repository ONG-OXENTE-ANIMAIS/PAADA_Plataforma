"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCampaigns } from "@/lib/CampaignsProvider";
import {
  BRL,
  CATEGORIAS,
  DESTAQUE,
  pctOf,
  type Campaign,
} from "@/lib/campaigns";

const pad2 = (n: number) => String(n).padStart(2, "0");

/* Barra de progresso que cresce ao entrar na viewport (como no protótipo). */
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

type HoverProps = { onEnter: (c: Campaign) => void; onLeave: () => void };

function useAbrir() {
  const router = useRouter();
  return (c: Campaign) => router.push(`/vaquinha/${c.slug}`);
}

function Row({
  c,
  n,
  onEnter,
  onLeave,
}: HoverProps & { c: Campaign; n: number }) {
  const abrir = useAbrir();
  const pct = pctOf(c);
  return (
    <li
      className={"row vaq-card" + (c.flash ? " flash" : "")}
      tabIndex={0}
      role="button"
      onMouseEnter={() => onEnter(c)}
      onMouseLeave={onLeave}
      onClick={() => abrir(c)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir(c);
        }
      }}
    >
      <div className="row-top">
        <span className="row-num">{pad2(n)}</span>
        <div className="row-main">
          <h3>{c.title}</h3>
          <p>
            {c.cat} · {c.place}
            {c.recurring ? <span className="tag-rec">Apoio mensal</span> : null}
          </p>
        </div>
        <div className="row-data">
          <b>{BRL(c.raised)}</b>
          <span>
            {pct}% da meta{c.recurring ? " mensal" : ""}
          </span>
        </div>
        <span className="row-go">
          <i className="ph ph-arrow-up-right"></i>
        </span>
      </div>
      <Barra pct={pct} className="row-bar" />
    </li>
  );
}

function DestaqueCard({ c, onEnter, onLeave }: HoverProps & { c: Campaign }) {
  const abrir = useAbrir();
  const pct = pctOf(c);
  return (
    <article
      className="destaque vaq-card"
      id="destaque"
      tabIndex={0}
      role="button"
      onMouseEnter={() => onEnter(c)}
      onMouseLeave={onLeave}
      onClick={() => abrir(c)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir(c);
        }
      }}
    >
      <div className="destaque-img">
        <img
          src="https://picsum.photos/seed/oxente-horta/980/680.jpg"
          alt="Horta comunitária"
        />
        <span className="chip-destaque">
          <svg className="sol" style={{ width: "12px", height: "12px" }}>
            <use href="#sol" />
          </svg>
          Em destaque
        </span>
        <span className="carimbo-dias">
          <span>
            <b>{c.days}</b>
            <small>
              dias
              <br />
              restantes
            </small>
          </span>
        </span>
      </div>
      <div className="destaque-info">
        <span className="cat">
          {c.cat} · {c.place}
        </span>
        <h3>{c.title}</h3>
        <p>
          Uma quadra abandonada há vinte anos virando duas toneladas de alimento
          por ano para 80 famílias do bairro. Faltam água de reúso, viveira e
          galpão — é para isso que esta vaquinha corre.
        </p>
        <div className="destaque-prog">
          <div className="numeros">
            <b>
              {BRL(c.raised)} <small>de {BRL(c.goal)}</small>
            </b>
            <span>{pct}%</span>
          </div>
          <Barra pct={pct} className="destaque-barra" />
          <div className="destaque-meta">
            <span>
              <i className="ph ph-users"></i>{" "}
              <em id="dqBackers" style={{ fontStyle: "normal" }}>
                {c.backers}
              </em>{" "}
              apoiadores
            </span>
            <span>
              <i className="ph ph-seal-check"></i> prestação publicada
            </span>
          </div>
        </div>
        <span className="destaque-cta">
          Doar nesta vaquinha
          <span className="circ">
            <i className="ph ph-arrow-up-right"></i>
          </span>
        </span>
      </div>
    </article>
  );
}

export default function VaquinhaSection() {
  const { campaigns } = useCampaigns();
  const [filtro, setFiltro] = useState("todas");

  const destaque = campaigns.find((c) => c.featured) ?? DESTAQUE;
  const lista = campaigns.filter((c) => !c.featured);
  const visiveis =
    filtro === "todas" ? lista : lista.filter((c) => c.cat === filtro);
  const destaqueVisivel = filtro === "todas" || destaque.cat === filtro;
  const total = visiveis.length + (destaqueVisivel ? 1 : 0);

  /* ---- imagem flutuante que segue o cursor (lerp como no protótipo) ---- */
  const fiRef = useRef<HTMLDivElement>(null);
  const alvo = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const ligado = useRef(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      pos.current.x += (alvo.current.x - pos.current.x) * 0.14;
      pos.current.y += (alvo.current.y - pos.current.y) * 0.14;
      const fi = fiRef.current;
      if (fi && ligado.current)
        fi.style.transform = `translate(${pos.current.x}px,${pos.current.y}px) translate(-50%,-58%) scale(1) rotate(3deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const mostrarImg = (c: Campaign) => {
    const fi = fiRef.current;
    if (!fi) return;
    fi.style.backgroundImage = `url("${c.customImg || c.img}")`;
    fi.classList.add("on");
    ligado.current = true;
  };
  const esconderImg = () => {
    fiRef.current?.classList.remove("on");
    ligado.current = false;
  };

  return (
    <div
      onMouseMove={(e) => {
        alvo.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <section
        className="sec"
        id="vaquinhas"
        style={{
          paddingLeft: 0,
          paddingRight: 0,
          maxWidth: "1240px",
          margin: "0 auto",
        }}
      >
        <div className="sec-head">
          <h2>
            Vaquinhas no ar{" "}
            <span className="conta">
              (<span id="vaqCount">{pad2(total)}</span>)
            </span>
          </h2>
          <Link href="/vaquinhas" className="link-mais">
            Ver todas as vaquinhas <i className="ph ph-arrow-right"></i>
          </Link>
        </div>
        <div
          className="filtros"
          id="filtros"
          aria-label="Filtrar vaquinhas por categoria"
        >
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

        {destaqueVisivel && (
          <DestaqueCard
            c={destaque}
            onEnter={mostrarImg}
            onLeave={esconderImg}
          />
        )}

        <ul className="lista-vaquinhas" id="vaquinhaList">
          {visiveis.map((c, i) => (
            <Row
              key={c.slug}
              c={c}
              n={i + 1}
              onEnter={mostrarImg}
              onLeave={esconderImg}
            />
          ))}
        </ul>
      </section>
      <div className="float-img" id="floatImg" ref={fiRef} aria-hidden="true"></div>
    </div>
  );
}
