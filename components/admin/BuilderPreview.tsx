"use client";

import { BRL, pickText, trunc, type Draft } from "@/lib/campaigns";

/** Preview ao vivo da página da vaquinha — espelho do renderPreview() do protótipo. */
export default function BuilderPreview({ draft }: { draft: Draft }) {
  const rec = draft.type === "recorrente";
  const pc = draft.color;
  const tc = pickText(pc);
  const img = draft.imgData;
  const meta = rec ? draft.goalM : draft.goal;
  const pctPv = rec ? 82 : 68;
  const pvRaised = Math.round((meta * pctPv) / 100);

  const chip = (
    <span className="pv-chip" style={{ background: pc, color: tc }}>
      {draft.category}
    </span>
  );
  const chipInv = (
    <span className="pv-chip" style={{ background: tc, color: pc }}>
      {draft.category}
    </span>
  );
  const chipRec = (
    <span
      className="pv-chip"
      style={{ background: "var(--marrom)", color: "var(--areia)" }}
    >
      Apoio mensal
    </span>
  );
  const chips = (
    <span className="pv-chips">
      {rec ? chipRec : null}
      {chip}
    </span>
  );
  const chipsInv = (
    <span className="pv-chips">
      {rec ? chipRec : null}
      {chipInv}
    </span>
  );

  const titulo = draft.title || (
    <span style={{ opacity: 0.4 }}>Título da sua vaquinha</span>
  );
  const chamada = draft.subtitle || (
    <span style={{ opacity: 0.4 }}>Uma frase curta que resume a campanha…</span>
  );

  let h: React.ReactNode;
  if (draft.model === "full") {
    h = (
      <div
        className="pv-h pv-full"
        style={
          img
            ? undefined
            : { background: "linear-gradient(135deg,#4a2410,#301607)" }
        }
      >
        {img ? <img src={img} alt="" /> : null}
        <div className="pv-full-in">
          {chips}
          <h2>{titulo}</h2>
          <p>{chamada}</p>
        </div>
      </div>
    );
  } else if (draft.model === "split") {
    h = (
      <div
        className="pv-h pv-split"
        style={{
          background: pc,
          color: tc,
          ...(img ? null : { gridTemplateColumns: "1fr" }),
        }}
      >
        <div className="pv-split-t">
          {chipsInv}
          <h2>{titulo}</h2>
          <p>{chamada}</p>
        </div>
        {img ? (
          <div className="pv-split-i">
            <img src={img} alt="" />
          </div>
        ) : null}
      </div>
    );
  } else if (draft.model === "center") {
    h = (
      <div className="pv-h pv-center">
        {chips}
        <h2>{titulo}</h2>
        <p>{chamada}</p>
        {img ? <img src={img} alt="" /> : null}
      </div>
    );
  } else {
    h = (
      <div className="pv-h pv-solid" style={{ background: pc, color: tc }}>
        <svg className="sol sol-deco" style={{ color: tc }}>
          <use href="#sol" />
        </svg>
        {chipsInv}
        <h2>{titulo}</h2>
        <p>{chamada}</p>
      </div>
    );
  }

  const hist = draft.story ? (
    trunc(draft.story, 170)
  ) : (
    <span className="vazio">Escreva a história da campanha no passo 2…</span>
  );

  return (
    <div className="pv" id="pvBody">
      <div className="pv-nav">
        <b>
          <svg className="sol">
            <use href="#sol" />
          </svg>
          oxente
        </b>
        <span className="pv-doa">Doar</span>
      </div>
      {h}
      <div className="pv-corpo">
        <div className="pv-prog-top">
          <b>
            {BRL(pvRaised)}
            {rec ? <small> este mês</small> : null}
          </b>
          <span>
            {pctPv}% de {rec ? "meta mensal " : ""}
            {BRL(meta)}
          </span>
        </div>
        <div className="pv-bar">
          <i style={{ width: pctPv + "%", background: pc }}></i>
        </div>
        <h3>Sobre a vaquinha</h3>
        <p>{hist}</p>
        <div className="pv-cta" style={{ background: pc, color: tc }}>
          {rec ? "Apoiar todo mês" : "Doar agora"} · Efi Pix
        </div>
      </div>
    </div>
  );
}
