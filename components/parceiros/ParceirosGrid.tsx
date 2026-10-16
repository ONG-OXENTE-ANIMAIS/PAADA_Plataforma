import { PARCEIROS } from "@/lib/campaigns";

/** Grade de parceiros — usada na home e na página de parcerias. */
export default function ParceirosGrid() {
  return (
    <ul className="parceiros-grid">
      {PARCEIROS.map((p, i) => (
        <li
          key={p.nome}
          className="parc-card"
          data-reveal
          style={{ "--d": `${(i % 4) * 0.07}s` } as React.CSSProperties}
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
  );
}
