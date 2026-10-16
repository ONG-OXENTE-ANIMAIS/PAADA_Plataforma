import Link from "next/link";

export default function NotFound() {
  return (
    <section className="screen active" style={{ padding: "150px 0 110px" }}>
      <div className="wrap" style={{ textAlign: "center" }}>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Página não encontrada
        </p>
        <h1
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontSize: "clamp(2rem, 6vw, 3.4rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Oxente?! Essa página <em>sumiu do mapa</em>.
        </h1>
        <p
          className="lead"
          style={{ maxWidth: "540px", margin: "16px auto 30px", opacity: 0.85 }}
        >
          O endereço que você abriu não existe — ou a vaquinha já foi
          arquivada. Bora voltar pro começo?
        </p>
        <div className="hero-ctas" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-marrom">
            <i className="ph ph-arrow-left"></i> Voltar para a home
          </Link>
          <Link href="/vaquinhas" className="btn btn-fantasma">
            Ver vaquinhas no ar <i className="ph ph-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
