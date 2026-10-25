"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCampaigns } from "@/lib/CampaignsProvider";
import {
  BRL,
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
        {c.full ? (
          <img src={c.full} alt={c.title} />
        ) : (
          <div
            aria-hidden="true"
            style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #FC681A 0%, #301607 100%)" }}
          />
        )}
        <span className="chip-destaque">
          <svg className="sol" style={{ width: "12px", height: "12px" }}>
            <use href="#sol" />
          </svg>
          Em destaque
        </span>
        {c.days !== undefined && (
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
        )}
      </div>
      <div className="destaque-info">
        <span className="cat">
          {c.cat} · {c.place}
        </span>
        <h3>{c.title}</h3>
        <p>{c.sub}</p>
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

function Esqueleto() {
  return (
    <div className="destaque vaq-card" aria-hidden="true">
      <div className="destaque-img" style={{ background: "linear-gradient(135deg, #FDE7CD, #FC681A55)" }} />
      <div className="destaque-info">
        <span className="cat">carregando…</span>
        <h3 style={{ opacity: 0.5 }}>Buscando as vaquinhas no ar</h3>
        <p style={{ opacity: 0.5 }}>
          Um instante — estamos trazendo as campanhas direto do banco.
        </p>
      </div>
    </div>
  );
}

function Vazio() {
  return (
    <div className="destaque vaq-card">
      <div className="destaque-img" style={{ background: "linear-gradient(135deg, #301607, #FC681A)" }} />
      <div className="destaque-info">
        <span className="cat">Aguardando a primeira causa</span>
        <h3>Nenhuma vaquinha no ar agora</h3>
        <p>
          Assim que a equipe publicar uma campanha, ela aparece aqui na hora.
          Quer ver como funciona? Monte a primeira no painel da ONG.
        </p>
        <div className="hero-ctas" style={{ marginTop: "18px" }}>
          <Link href="/admin" className="btn btn-laranja">
            <i className="ph ph-plus"></i> Criar vaquinha
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VaquinhaSection() {
  const { campaigns, loading, error } = useCampaigns();

  const destaque = campaigns.find((c) => c.featured) ?? campaigns[0];
  const lista = campaigns.filter((c) => c.id !== destaque?.id);
  const total = campaigns.length;

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
    if (!c.img) return;
    const fi = fiRef.current;
    if (!fi) return;
    fi.style.backgroundImage = `url("${c.img}")`;
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
      <section className="sec sec-wide" id="vaquinhas">
        <div className="sec-head">
          <h2>
            Vaquinhas no ar{" "}
            <span className="conta">
              (<span id="vaqCount">{pad2(total)}</span>)
            </span>
          </h2>
        </div>

        {loading ? (
          <Esqueleto />
        ) : destaque ? (
          <DestaqueCard c={destaque} onEnter={mostrarImg} onLeave={esconderImg} />
        ) : error ? (
          <Vazio />
        ) : (
          <Vazio />
        )}
      </section>
      <div className="float-img" id="floatImg" ref={fiRef} aria-hidden="true"></div>
    </div>
  );
}
