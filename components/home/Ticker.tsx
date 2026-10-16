import { DOACOES_TICKER, type TickerItem } from "@/lib/campaigns";

function Item({ d }: { d: TickerItem }) {
  return (
    <>
      <span className="tk">
        <i className="ph-fill ph-hand-heart"></i>
        {d[0]} <b>{d[1]}</b> para {d[2]}
      </span>
      <svg className="sol tk-sep" style={{ width: "11px", height: "11px" }}>
        <use href="#sol" />
      </svg>
    </>
  );
}

export default function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track" id="tickerTrack">
        {[...DOACOES_TICKER, ...DOACOES_TICKER].map((d, i) => (
          <Item key={i} d={d} />
        ))}
      </div>
    </div>
  );
}
