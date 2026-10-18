import Link from "next/link";
import HashLink from "@/components/shared/HashLink";

type Forma = {
  icon: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
};

const FORMAS: Forma[] = [
  {
    icon: "hand-heart",
    title: "Doe numa vaquinha",
    desc: "Escolha uma campanha aberta e pague por Pix, cartão ou boleto em menos de um minuto — sem cadastro, sem burocracia, até como anônimo.",
    cta: "Ver todas as vaquinhas",
    href: "/vaquinhas",
  },
  {
    icon: "arrows-clockwise",
    title: "Apoie todo mês",
    desc: "Campanhas com apoio mensal garantem a continuidade de abrigos, mutirões de castração e resgates. Uma assinatura pequena vira feito o ano inteiro.",
    cta: "Encontrar apoio mensal",
    href: "/vaquinhas",
  },
  {
    icon: "target",
    title: "Monte a vaquinha da sua ONG",
    desc: "Organizações parceiras criam campanhas com identidade própria em minutos, no construtor — a Oxente cuida do pagamento e do repasse.",
    cta: "Criar vaquinha",
    href: "/admin",
  },
  {
    icon: "handshake",
    title: "Seja um parceiro",
    desc: "Empresas, escolas, coletivos e institutos caminham com a gente: cedem espaço, divulgam causas, doam serviços e sustentam campanhas.",
    cta: "Cadastrar parceria",
    href: "/parcerias",
  },
  {
    icon: "megaphone",
    title: "Divulgue uma causa",
    desc: "Compartilhar custa zero e rende muito: um repique no grupo da família pode ser o empurrão que faltava para a meta ser batida.",
    cta: "Escolher uma causa",
    href: "/vaquinhas",
  },
  {
    icon: "lightbulb",
    title: "Sugira melhorias",
    desc: "Usou a plataforma e viu algo que pode ficar melhor? A Oxente é feita junto com quem doa: sua ideia entra na fila de implementação.",
    cta: "Enviar sugestão",
    href: "/sugestoes",
  },
];

export default function ComoAjudarPage() {
  return (
    <section className="screen active" data-screen="como-ajudar">
      <div className="page-hero">
        <HashLink href="/" className="v-voltar">
          <i className="ph ph-arrow-left"></i> Voltar para a home
        </HashLink>
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Como Ajudar
        </p>
        <h1>
          Tem mais de um jeito de <em>ajeitar</em> o mundo.
        </h1>
        <p className="lead">
          Doar é o caminho mais rápido — mas não é o único. Aqui estão todas as
          formas de somar com o Instituto Oxente, do Pix de quarenta segundos
          à parceria que dura anos.
        </p>
        <ul className="compromissos">
          <li>
            <i className="ph-fill ph-lightning"></i> Doação em ~40s
          </li>
          <li>
            <i className="ph-fill ph-hand-heart"></i> A partir de R$ 5
          </li>
          <li>
            <i className="ph-fill ph-incognito"></i> Anônimo, se preferir
          </li>
          <li>
            <i className="ph-fill ph-handshake"></i> Parceria em até 5 dias
          </li>
        </ul>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section
        className="sec sec-wide"
      >
        <div className="sec-head">
          <h2>
            Escolha o seu jeito <span className="conta">(todos cabem)</span>
          </h2>
        </div>
        <div className="ajudar-grid">
          {FORMAS.map((f, i) => (
            <article
              key={f.title}
              className="ajuda-card"
              data-reveal
              style={{ "--d": `${(i % 3) * 0.08}s` } as React.CSSProperties}
            >
              <span className="ajuda-num">0{i + 1}</span>
              <h3>
                <i className={"ph ph-" + f.icon}></i> {f.title}
              </h3>
              <p>{f.desc}</p>
              <Link href={f.href} className="ajuda-link">
                {f.cta} <i className="ph ph-arrow-right"></i>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="sec-alt">
        <div className="sec sec-wide">
          <div className="sec-head">
            <h2>
              O que acontece depois que você <em>ajuda</em>
            </h2>
          </div>
          <div className="passos">
            <div className="passo" data-reveal>
              <span className="pnum">01</span>
              <div>
                <p className="tag">
                  <i className="ph ph-seal-check"></i> Confirmação
                </p>
                <h3>Sua doação cai na conta da campanha</h3>
                <p>
                  O pagamento é processado pelo Mercado Pago e o repasse vai
                  direto para a conta vinculada da ONG responsável — sem
                  intermediário, sem burocracia.
                </p>
              </div>
            </div>
            <div className="passo" data-reveal>
              <span className="pnum">02</span>
              <div>
                <p className="tag">
                  <i className="ph ph-receipt"></i> Prestação
                </p>
                <h3>Quem criou publica cada gasto</h3>
                <p>
                  Atualizações com fotos, notas fiscais e comprovantes de
                  repasse aparecem na página da vaquinha — quem doou acompanha
                  tudo de perto.
                </p>
              </div>
            </div>
            <div className="passo" data-reveal>
              <span className="pnum">03</span>
              <div>
                <p className="tag">
                  <i className="ph ph-plant"></i> Impacto
                </p>
                <h3>A causa vira história com nome</h3>
                <p>
                  Gato castrado, telhado novo, cão no sofá do lar adotante:
                  cada vaquinha encerrada ganha o relatório final com o
                  resultado para quem ajudou.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="sec sec-wide"
      >
        <div className="sec-head">
          <h2>Perguntas de quem quer ajudar</h2>
        </div>
        <div className="faq">
          <details>
            <summary>Preciso criar conta para doar?</summary>
            <p className="faq-a">
              Não. Você escolhe a vaquinha, paga e pronto — o comprovante e as
              atualizações da campanha chegam no e-mail que você informar na
              hora, sem senha, sem cadastro.
            </p>
          </details>
          <details>
            <summary>Posso doar pouco? De R$ 5?</summary>
            <p className="faq-a">
              Pode e vale. Boa parte das doações da Oxente é de valores
              pequenos — é o R$ 10 recorrente de dona Tereza que segura o
              abrigo inteiro no fim do mês.
            </p>
          </details>
          <details>
            <summary>Como acompanho para onde foi meu dinheiro?</summary>
            <p className="faq-a">
              Cada vaquinha tem uma página de atualizações publicada por quem
              criou a campanha, com fotos e notas fiscais dos gastos. Quem
              doa recebe cada novidade por e-mail, inclusive quem doou como
              anônimo.
            </p>
          </details>
          <details>
            <summary>Minha ONG pode criar vaquinha aqui?</summary>
            <p className="faq-a">
              Pode. Organizações parceiras usam o construtor para montar
              campanhas com identidade própria em minutos — única ou
              recorrente. Faça o cadastro de parceria que a gente cuida do
              resto.
            </p>
          </details>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: "90px" }}>
        <div className="compartilhar" style={{ marginTop: 0 }}>
          <div>
            <h3>
              Já sabe como <em>vai ajudar</em>?
            </h3>
            <p>
              Então bora: escolha uma vaquinha no ar ou cadastre a parceria da
              sua organização.
            </p>
          </div>
          <div className="grupo-bts">
            <Link href="/vaquinhas" className="btn btn-laranja">
              <i className="ph ph-hand-heart"></i> Doar agora
            </Link>
            <Link href="/parcerias" className="btn btn-areia">
              <i className="ph ph-handshake"></i> Ser parceiro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
