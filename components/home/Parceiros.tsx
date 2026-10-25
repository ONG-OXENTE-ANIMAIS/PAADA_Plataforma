"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { parceiroFromApi, type Parceiro } from "@/lib/campaigns";

type ParceiroApi = Parameters<typeof parceiroFromApi>[0] & { id: string };

type Pagina<T> = { data: T[]; pagination: { total: number } };

/** Seção "Parceiros" da home — parceiros ativos vindos do banco. */
export default function Parceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[] | null>(null);

  useEffect(() => {
    let ativo = true;
    apiFetch<Pagina<ParceiroApi>>("/api/parceiros?limit=50")
      .then((p) => ativo && setParceiros(p.data.map(parceiroFromApi)))
      .catch(() => ativo && setParceiros([]));
    return () => {
      ativo = false;
    };
  }, []);

  if (parceiros && !parceiros.length) return null;

  const destaques = (parceiros ?? []).filter((p) => p.destaque);
  const demais = (parceiros ?? []).filter((p) => !p.destaque);

  return (
    <section className="sec sec-wide" id="parceiros">
      <div className="sec-head">
        <h2>
          Quem caminha <span className="conta">com a gente</span>
        </h2>
        <Link href="/contato" className="link-mais">
          Quero ser parceiro <i className="ph ph-arrow-right"></i>
        </Link>
      </div>
      <p className="parc-lead">
        São {(parceiros ?? []).length || "várias"} organizações sustentando os
        mutirões, as vaquinhas e as feiras de adoção — cedendo espaço, insumo,
        serviço e divulgação.
      </p>

      <ul className="parc-destaques">
        {destaques.map((p, i) => (
          <li
            key={p.nome}
            className="parc-destaque"
            data-reveal
            style={{ "--d": `${i * 0.07}s` } as React.CSSProperties}
          >
            <span className="parc-ini" aria-hidden="true">
              {p.sigla}
            </span>
            <div>
              <p className="parc-tipo">
                {p.tipo} · {p.area}
              </p>
              <h3>{p.nome}</h3>
              <p className="parc-desc">{p.desc}</p>
              <span className="parc-meta">
                <i className="ph ph-map-pin"></i> {p.place}
                {p.desde ? ` · desde ${p.desde}` : ""}
              </span>
            </div>
            <span className="parc-badge">
              <i className="ph-fill ph-seal-check"></i> Parceria em destaque
            </span>
          </li>
        ))}
      </ul>

      <ul className="parceiros-grid">
        {demais.map((p, i) => (
          <li
            key={p.nome}
            className="parc-card"
            data-reveal
            style={{ "--d": `${(i % 3) * 0.07}s` } as React.CSSProperties}
          >
            <span className="parc-ini" aria-hidden="true">
              {p.sigla}
            </span>
            <div>
              <h3>{p.nome}</h3>
              <p className="parc-tipo">
                {p.tipo} · {p.area}
              </p>
              <p className="parc-desc">{p.desc}</p>
              <span className="parc-meta">
                <i className="ph ph-map-pin"></i> {p.place}
                {p.desde ? ` · desde ${p.desde}` : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
