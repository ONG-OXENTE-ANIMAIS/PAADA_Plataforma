import HashLink from "@/components/shared/HashLink";

export default function SobrePage() {
  return (
    <section className="screen active" data-screen="sobre">
      <div className="sobre-hero">
        <div>
          <HashLink href="/" className="v-voltar">
            <i className="ph ph-arrow-left"></i> Voltar para a home
          </HashLink>
          <p className="eyebrow">
            <svg className="sol">
              <use href="#sol" />
            </svg>{" "}
            Sobre a Oxente
          </p>
          <h1>
            Oxente?! É o <em>susto bom</em> de quem nasceu no Nordeste.
          </h1>
          <p className="lead">
            A gente transformou essa exclamação em solidariedade organizada:
            vaquinhas transparentes, feitas pelo povo do lugar, para o povo do
            lugar — com a moeda certa, no prazo certo, pro lugar certo.
          </p>
          <div className="compromissos">
            <li>
              <i className="ph-fill ph-map-pin"></i> Nascida e sediada no Recife
            </li>
            <li>
              <i className="ph-fill ph-calendar-check"></i> Desde 2019
            </li>
            <li>
              <i className="ph-fill ph-hand-heart"></i> Sem fins lucrativos
            </li>
          </div>
        </div>
        <div className="colecao">
          <svg className="selo esq" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="60" fill="#FC681A" />
            <g className="gira">
              <defs>
                <path
                  id="circ2"
                  d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"
                />
              </defs>
              <text>
                <textPath href="#circ2">
                  DESDE 2019 • RECIFE • PE • OXENTE •&#160;
                </textPath>
              </text>
            </g>
            <svg
              x="43"
              y="43"
              width="34"
              height="34"
              viewBox="0 0 24 24"
              style={{ color: "#301607" }}
            >
              <use href="#sol" />
            </svg>
          </svg>
          <img
            className="c-main"
            src="https://picsum.photos/seed/oxente-carnaval/900/760.jpg"
            alt="Comunidade reunida em evento da Oxente"
          />
          <img
            className="c-side"
            src="https://picsum.photos/seed/oxente-time/520/440.jpg"
            alt="Equipe da Oxente"
          />
        </div>
      </div>

      <section className="manifesto sec-wide">
        <p className="eyebrow">
          <svg className="sol">
            <use href="#sol" />
          </svg>{" "}
          Nosso jeito de fazer
        </p>
        <p data-reveal>
          Doar tem que ser <b>simples</b> como um oi,
        </p>
        <p data-reveal>
          transparente como <b>conta de bar</b> no fim da noite,
        </p>
        <p data-reveal>
          e bonito como <b>frevo</b> na segunda-feira de carnaval.
        </p>
      </section>

      <div className="fita" aria-hidden="true"></div>

      <section
        className="sec sec-wide"
      >
        <div className="sec-head">
          <h2>De onde viemos</h2>
        </div>
        <div className="timeline">
          <div className="tl" data-reveal>
            <span className="ano">2019</span>
            <div>
              <h4>Um grupo de WhatsApp da Boa Vista</h4>
              <p>
                Onze vizinhos se juntaram pra pagar a reforma da creche do
                bairro. A vaquinha bateu a meta em seis dias — e a pergunta que
                ficou foi: "por que a gente não faz isso sempre?"
              </p>
            </div>
          </div>
          <div className="tl" data-reveal>
            <span className="ano">2021</span>
            <div>
              <h4>Nasce o Instituto Oxente</h4>
              <p>
                Estatuto registrado, diretoria eleita e a primeira campanha
                formal: 40 cisternas de placas para Cabrobá, entregues antes do
                período de seca.
              </p>
            </div>
          </div>
          <div className="tl" data-reveal>
            <span className="ano">2023</span>
            <div>
              <h4>Plataforma própria, pagos pelo Mercado Pago</h4>
              <p>
                Saímos das listas de pessoas e ganhamos endereço na internet:
                vaquinhas com página própria, doação por Pix em segundos e
                repasse auditado.
              </p>
            </div>
          </div>
          <div className="tl" data-reveal>
            <span className="ano">2025</span>
            <div>
              <h4>R$ 1,2 milhão e o construtor de vaquinhas</h4>
              <p>
                Passamos da marca de R$ 1 milhão arrecadados e lançamos o
                construtor: qualquer ONG parceira monta sua campanha com
                identidade própria em minutos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-alt">
        <div className="sec sec-wide">
          <div className="sec-head">
            <h2>Como a gente trabalha</h2>
          </div>
          <div className="passos">
            <div className="passo" data-reveal>
              <span className="pnum">a</span>
              <div>
                <p className="tag">
                  <i className="ph ph-users-three"></i> Princípio 01
                </p>
                <h3>O povo do lugar decide</h3>
                <p>
                  Nenhuma vaquinha nasce na diretoria. Toda campanha parte de
                  quem vive o problema — a Oxente dá estrutura, não dá palpite.
                </p>
              </div>
            </div>
            <div className="passo" data-reveal>
              <span className="pnum">b</span>
              <div>
                <p className="tag">
                  <i className="ph ph-receipt"></i> Princípio 02
                </p>
                <h3>Prestação antes do pedido</h3>
                <p>
                  Não pedimos confiança: mostramos. Cada repasse tem
                  comprovante, cada campanha concluída tem relatório com foto e
                  nota fiscal.
                </p>
              </div>
            </div>
            <div className="passo" data-reveal>
              <span className="pnum">c</span>
              <div>
                <p className="tag">
                  <i className="ph ph-heart"></i> Princípio 03
                </p>
                <h3>Ninguém doa e some</h3>
                <p>
                  Cada doador entra na lista de atualizações da campanha e
                  acompanha o resultado até o fim — inclusive quem doou como
                  anônimo, por e-mail.
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
          <h2>Quem faz acontecer</h2>
        </div>
        <ul className="time">
          <li data-reveal>
            <span className="avatar-ini">MC</span>
            <div>
              <div className="nome">Maria do Carmo</div>
              <div className="cargo">Coordenação geral · fundadora</div>
            </div>
            <span className="piada">
              "Se não tá na prestação de contas, não aconteceu."
            </span>
          </li>
          <li data-reveal>
            <span className="avatar-ini">ZF</span>
            <div>
              <div className="nome">Zé Filho</div>
              <div className="cargo">Tecnologia</div>
            </div>
            <span className="piada">
              Faz o site funcionar até quando o lucro da Light cai.
            </span>
          </li>
          <li data-reveal>
            <span className="avatar-ini">LF</span>
            <div>
              <div className="nome">Luana Freire</div>
              <div className="cargo">Comunicação</div>
            </div>
            <span className="piada">Já foi rainha de bateria. Duas vezes.</span>
          </li>
          <li data-reveal>
            <span className="avatar-ini">BL</span>
            <div>
              <div className="nome">Beto Lacerda</div>
              <div className="cargo">Financeiro & transparência</div>
            </div>
            <span className="piada">
              Guarda cada nota fiscal num pasto… quer dizer, pasta.
            </span>
          </li>
          <li data-reveal>
            <span className="avatar-ini">SR</span>
            <div>
              <div className="nome">Sônia Ramos</div>
              <div className="cargo">Voluntariado</div>
            </div>
            <span className="piada">
              Café do mutirão de terça é responsabilidade dela.
            </span>
          </li>
        </ul>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="mosaico">
          <img
            src="https://picsum.photos/seed/oxente-horta/900/720.jpg"
            alt="Mutirão na horta comunitária"
          />
          <img
            src="https://picsum.photos/seed/oxente-maracatu/700/640.jpg"
            alt="Oficina de percussão"
          />
          <img
            src="https://picsum.photos/seed/oxente-biblioteca/700/640.jpg"
            alt="Biblioteca comunitária"
          />
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: "90px" }}>
        <div className="compartilhar" style={{ marginTop: 0 }}>
          <div>
            <h3>
              Bora <em>ajeitar</em> o mundo junto?
            </h3>
            <p>
              Veja todas as formas de ajudar — ou monte a vaquinha da sua ONG
              parceira.
            </p>
          </div>
          <div className="grupo-bts">
            <HashLink href="/como-ajudar" className="btn btn-areia">
              <i className="ph ph-hand-heart"></i> Como ajudar
            </HashLink>
            <HashLink href="/#vaquinhas" className="btn btn-laranja">
              <i className="ph ph-arrow-down"></i> Doar agora
            </HashLink>
          </div>
        </div>
      </div>
    </section>
  );
}
