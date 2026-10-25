"use client";

import type { TickerItem } from "@/lib/campaigns";

/** Faixa rolante de doações recentes. Não há ainda um endpoint público de
 *  feed de doações, então o componente só renderiza quando recebe itens —
 *  nenhum dado fictício é exibido. */
export default function Ticker({ itens = [] }: { itens?: TickerItem[] }) {
  if (!itens.length) return null;
  return (
    <div className="ticker" aria-label="Doações recentes">
      <div className="ticker-track">
        {[...itens, ...itens].map((d, i) => (
          <span className="tick" key={i}>
            <i className="ph-fill ph-hand-heart"></i>
            <b>{d[0]}</b> {d[1]} · {d[2]}
          </span>
        ))}
      </div>
    </div>
  );
}
