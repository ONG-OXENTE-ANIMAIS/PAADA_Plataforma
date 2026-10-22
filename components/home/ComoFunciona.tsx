import Link from "next/link";

export default function ComoFunciona() {
  return (
    <section className="sec-alt" id="como">
      <div className="sec sec-wide">
        <div className="sec-head">
          <h2>Como ajudar: três passos.</h2>
          <Link href="/como-ajudar" className="link-mais">
            Todas as formas de ajudar <i className="ph ph-arrow-right"></i>
          </Link>
        </div>
        <div className="passos">
          <div className="passo" data-reveal>
            <span className="pnum">01</span>
            <div>
              <p className="tag">
                <i className="ph ph-hand-pointing"></i> Escolha
              </p>
              <h3>Ache a vaquinha que move você</h3>
              <p>
                Navegue pelas campanhas abertas, leia a história com calma e
                veja para qual causa está doando.
              </p>
            </div>
          </div>
          <div className="passo" data-reveal>
            <span className="pnum">02</span>
            <div>
              <p className="tag">
                <i className="ph ph-credit-card"></i> Doação
              </p>
              <h3>Doe em menos de um minuto</h3>
              <p>
                Pix ou cartão, processados com segurança pelo Mercado
                Pago. Sem cadastro, sem burocracia: você pode doar até como
                anônimo.
              </p>
            </div>
          </div>
          <div className="passo" data-reveal>
            <span className="pnum">03</span>
            <div>
              <p className="tag">
                <i className="ph ph-plant"></i> Impacto
              </p>
              <h3>Acompanhe o dinheiro virando feito</h3>
              <p>
                Publicamos atualizações, você acompanha cada novidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
