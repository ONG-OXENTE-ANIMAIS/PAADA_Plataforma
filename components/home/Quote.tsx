export default function Quote() {
  return (
    <section className="quote">
      <blockquote data-reveal>
        “Oxente é o susto bom de quem é daqui — e a gente provoca esse susto{" "}
        <em>todo dia</em>, uma vaquinha por vez.”
      </blockquote>
      <cite data-reveal style={{ "--d": "0.1s" } as React.CSSProperties}>
        — Maria do Carmo, fundadora do Instituto Oxente
      </cite>
    </section>
  );
}
