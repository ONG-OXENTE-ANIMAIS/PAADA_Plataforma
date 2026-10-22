"use client";

import { useEffect, useRef, useState } from "react";
import { useCampaigns } from "@/lib/CampaignsProvider";
import { useToast } from "@/components/fx/ToastProvider";
import DonateModal from "@/components/vaquinha/DonateModal";
import HashLink from "@/components/shared/HashLink";
import {
  BACKERS_SEED,
  BRL,
  SEED_CAMPAIGNS,
  VALORES,
  pctOf,
  slug as slugify,
  type Backer,
  type Freq,
} from "@/lib/campaigns";

export default function CampaignDetail({ slug }: { slug: string }) {
  const { campaigns, donate } = useCampaigns();
  const toast = useToast();

  const campaign =
    campaigns.find((c) => c.slug === slug) ??
    SEED_CAMPAIGNS.find((c) => c.slug === slug);

  const rec = !!campaign?.recurring;
  const [freq, setFreq] = useState<Freq>(rec ? "mes" : "unica");
  const [amtIdx, setAmtIdx] = useState(0);
  const [custom, setCustom] = useState("");
  const [modal, setModal] = useState(false);
  const [backers, setBackers] = useState<Backer[]>(BACKERS_SEED);

  /* ---- contadores animados (como refreshCampaign do protótipo) ---- */
  const raisedRef = useRef<HTMLSpanElement>(null);
  const prevRaised = useRef<number | null>(null);
  const [barW, setBarW] = useState("0%");

  useEffect(() => {
    if (!campaign) return;
    const to = campaign.raised;
    const first = prevRaised.current === null;
    const from = prevRaised.current ?? 0;
    prevRaised.current = to;
    const el = raisedRef.current;
    const t0 = performance.now();
    const dur = first ? 1100 : 500;
    (function f(t: number) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      if (el) el.textContent = BRL(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
    setBarW("0%");
    const t = setTimeout(() => setBarW(pctOf(campaign) + "%"), 90);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.raised, campaign?.goal]);

  if (!campaign) {
    return (
      <section className="screen active" style={{ padding: "150px 0 110px" }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <p className="eyebrow">
            <svg className="sol">
              <use href="#sol" />
            </svg>{" "}
            Vaquinha não encontrada
          </p>
          <h1
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontSize: "clamp(2rem, 6vw, 3.4rem)",
              letterSpacing: "-0.03em",
            }}
          >
            Essa vaquinha <em>já se foi</em>.
          </h1>
          <p
            className="lead"
            style={{ maxWidth: "540px", margin: "16px auto 30px", opacity: 0.85 }}
          >
            O endereço não bate com nenhuma campanha no ar. Volte pra lista e
            escolha outra causa.
          </p>
          <div className="hero-ctas" style={{ justifyContent: "center" }}>
            <HashLink href="/#vaquinhas" className="btn btn-marrom">
              <i className="ph ph-arrow-left"></i> Ver vaquinhas no ar
            </HashLink>
          </div>
        </div>
      </section>
    );
  }

  const pct = pctOf(campaign);
  const temCustom = !!(parseFloat(custom) && parseFloat(custom) >= 5);
  const valor = temCustom ? parseFloat(custom) : VALORES[freq][amtIdx];

  const marcaFreq = (f: Freq) => {
    setFreq(f);
    if (!parseFloat(custom)) setAmtIdx(0);
  };

  const aplicarDoacao = (v: number) => {
    donate(campaign.slug, v);
    setBackers((b) =>
      [
        {
          ini: "VO",
          nome: "Você" + (freq === "mes" ? " · assinatura mensal" : ""),
          quando: "agora mesmo",
          valor: v,
        },
        ...b,
      ].slice(0, 6),
    );
    toast("Doação confirmada. Obrigado por ajudar!", "hand-heart");
  };

  const compartilhar = async () => {
    const link = "https://oxente.org/v/" + slugify(campaign.title || "vaquinha");
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const i = document.createElement("input");
      i.value = link;
      document.body.appendChild(i);
      i.select();
      document.execCommand("copy");
      i.remove();
    }
    toast("Link copiado: " + link, "link");
  }

  return (
    <section className="screen active" data-screen="vaquinha">
      <div className="v-hero">
        <div className="wrap">
          <HashLink href="/#vaquinhas" className="v-voltar">
            <i className="ph ph-arrow-left"></i> Voltar para as vaquinhas
          </HashLink>
          <h1 id="vTitle">{campaign.title}</h1>
          <p className="v-sub" id="vSub">
            {campaign.sub}
          </p>
          <div className="v-meta">
            <span>
              <i className="ph ph-map-pin"></i>
              <span id="vPlace">{campaign.place}</span>
            </span>
            <span>
              <i className="ph ph-calendar-blank"></i> Criada em 12 de março de
              2025
            </span>
            <span>
              <i className="ph ph-users"></i>
              <b id="vBackersMeta">{campaign.backers}</b>&nbsp;apoiadores
            </span>
          </div>
          <img
            id="vImg"
            src={campaign.customImg || campaign.full}
            alt="Imagem da campanha"
          />
        </div>
      </div>

      <div className="v-grid wrap">
        <div className="v-conteudo">
          <h2>Sobre esta vaquinha</h2>
          <div className="texto">
            {(campaign.story ?? [campaign.sub]).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {campaign.usos?.length ? (
            <ul className="lista-usos">
              {campaign.usos.map((u, i) => (
                <li key={i}>
                  <i className="ph-fill ph-check-circle"></i>
                  <span>{u.label}</span>
                  <b>{BRL(u.valor)}</b>
                </li>
              ))}
            </ul>
          ) : null}

          {campaign.updates?.length ? (
            <div className="atualizacoes">
              <h2>Atualizações</h2>
              {campaign.updates.map((u, i) => (
                <article className="upd" key={i}>
                  <header>
                    <span className="data-tag">{u.tag}</span>
                    <time dateTime={u.iso}>{u.data}</time>
                  </header>
                  <h4>{u.titulo}</h4>
                  <p>{u.texto}</p>
                </article>
              ))}
            </div>
          ) : null}

          <div className="apoiadores">
            <h2>Apoiadores recentes</h2>
            <div id="backerList">
              {backers.map((b, i) => (
                <div className="apoio" key={i}>
                  <span
                    className="avatar-ini"
                    style={b.ini === "VO" ? { background: "var(--laranja)" } : undefined}
                  >
                    {b.ini}
                  </span>
                  <div>
                    <div className="nome">{b.nome}</div>
                    <div className="quando">{b.quando}</div>
                  </div>
                  <span className="valor">{BRL(b.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="compartilhar">
            <div>
              <h3>
                Essa causa move <em>você</em>?
              </h3>
              <p>
                Compartilhar custa zero e rende muito. Chama a família, o grupo
                do trabalho, a turma do futebol.
              </p>
            </div>
            <button className="btn btn-laranja" id="btnShare" onClick={compartilhar}>
              <i className="ph ph-link"></i> Copiar link da vaquinha
            </button>
          </div>
        </div>

        <aside className="v-doar" aria-label="Fazer uma doação">
          <div className="pct-grande">
            <span id="pctTxt">{pct}</span>
            <span id="pctLabel">{rec ? "% da meta mensal" : "% da meta"}</span>
          </div>
          <div className="barra">
            <i id="detailBar" style={{ width: barW }}></i>
          </div>
          <p className="de" style={{ marginTop: "12px" }}>
            <b
              id="raisedNum"
              style={{
                fontFamily: '"Bricolage Grotesque"',
                fontSize: "1.35rem",
                letterSpacing: "-0.02em",
              }}
            >
              <span ref={raisedRef}>R$ 0</span>
            </b>
            <br />
            <span id="raisedGoal">
              {rec ? "meta mensal de " + BRL(campaign.goal) : "de " + BRL(campaign.goal)}
            </span>
          </p>
          <div className="dois">
            <div>
              <i className="ph ph-users"></i>
              <span>
                <b id="backersNum">{campaign.backers}</b> apoiadores
              </span>
            </div>
            <div>
              <i className="ph ph-clock"></i>
              <span>
                <b id="daysNum">{rec ? "∞" : campaign.days}</b>{" "}
                <span id="daysLabel">
                  {rec ? "campanha contínua" : "dias restantes"}
                </span>
              </span>
            </div>
          </div>
          <div className="freq" role="group" aria-label="Frequência da doação">
            <button
              className={freq === "unica" ? "on" : ""}
              id="freqU"
              onClick={() => marcaFreq("unica")}
            >
              Doação única
            </button>
            <button
              className={freq === "mes" ? "on" : ""}
              id="freqM"
              onClick={() => marcaFreq("mes")}
            >
              Todo mês
            </button>
          </div>
          <div className="amts" id="amtChips">
            {VALORES[freq].map((v, i) => (
              <button
                key={i}
                className={!temCustom && i === amtIdx ? "on" : ""}
                onClick={() => {
                  setAmtIdx(i);
                  setCustom("");
                }}
              >
                R$ {v}
              </button>
            ))}
          </div>
          <div className="campo-valor">
            <span>R$</span>
            <input
              type="number"
              id="amtCustom"
              min={5}
              step={5}
              placeholder="Ou outro valor"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                if (!parseFloat(e.target.value)) setAmtIdx(0);
              }}
            />
          </div>
          <button
            className="btn btn-laranja"
            id="btnDonate"
            style={{ fontSize: "16px", padding: "16px" }}
            onClick={() => setModal(true)}
          >
            <i className="ph-fill ph-hand-heart"></i>
            <span id="btnDonateTxt">
              {freq === "unica" ? `Doar ${BRL(valor)}` : `Doar ${BRL(valor)} todo mês`}
            </span>
          </button>
          <div className="segura">
            <div className="linha1">
              <i className="ph-fill ph-lock-key"></i> Pagamento seguro processado
              pelo Mercado Pago
            </div>
            <div className="formas">
              <i className="ph-fill ph-pix-logo" title="Pix"></i>
              <i className="ph ph-credit-card" title="Cartão"></i>
              <i className="ph ph-barcode" title="Boleto"></i>
            </div>
          </div>
        </aside>
      </div>

      <DonateModal
        open={modal}
        campaign={campaign}
        valor={valor}
        freq={freq}
        onClose={() => setModal(false)}
        onConfirm={aplicarDoacao}
      />
    </section>
  );
}
