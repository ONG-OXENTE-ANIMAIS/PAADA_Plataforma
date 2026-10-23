import Link from "next/link";
import { PARCEIROS } from "@/lib/campaigns";

/** Seção "Parceiros" da home — resume quem caminha com a Oxente. */
export default function Parceiros() {
  const destaques = PARCEIROS.filter((p) => p.destaque);
  const demais = PARCEIROS.filter((p) => !p.destaque);

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
        São {PARCEIROS.length} organizações sustentando os mutirões, as vaquinhas
        e as feiras de adoção — cedendo espaço, insumo, serviço e divulgação.
        Duas delas estão direto no mutirão da vaquinha em destaque.
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
                <i className="ph ph-map-pin"></i> {p.place} · desde {p.desde}
              </span>
            </div>
            <span className="parc-badge">
              <i className="ph-fill ph-seal-check"></i> Na vaquinha em destaque
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
                <i className="ph ph-map-pin"></i> {p.place} · desde {p.desde}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
