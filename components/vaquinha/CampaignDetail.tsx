"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/fx/ToastProvider";
import DonateModal from "@/components/vaquinha/DonateModal";
import HashLink from "@/components/shared/HashLink";
import { BRL, VALORES, pctOf, type Campaign, type Freq } from "@/lib/campaigns";

export default function CampaignDetail({
  campaign,
  retornoDoacao,
}: {
  campaign: Campaign;
  retornoDoacao?: string | null;
}) {
  const toast = useToast();
  const router = useRouter();

  const rec = !!campaign.recurring;
  const aceitaMensal = rec;
  const [freq, setFreq] = useState<Freq>("unica");
  const [amtIdx, setAmtIdx] = useState(0);
  const [custom, setCustom] = useState("");
  const [modal, setModal] = useState(false);

  /* ---- contadores animados (como refreshCampaign do protótipo) ---- */
  const raisedRef = useRef<HTMLSpanElement>(null);
  const prevRaised = useRef<number | null>(null);
  const [barW, setBarW] = useState("0%");

  /* ---- aviso de retorno do Mercado Pago (limpa a query da URL) ---- */
  useEffect(() => {
    if (!retornoDoacao) return;
    if (retornoDoacao === "PAGA")
      toast("Doação confirmada! Obrigado por ajudar.", "hand-heart");
    else if (retornoDoacao === "PENDENTE")
      toast("Recebemos sua doação — o pagamento está em processamento.", "hourglass");
    else
      toast("A doação não foi concluída. Você pode tentar novamente quando quiser.", "warning");
    router.replace(`/vaquinha/${campaign.slug}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
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
  }, [campaign.raised, campaign.goal]);

  const pct = pctOf(campaign);
  const temCustom = !!(parseFloat(custom) && parseFloat(custom) >= 5);
  const valor = temCustom ? parseFloat(custom) : VALORES[freq][amtIdx];

  const marcaFreq = (f: Freq) => {
    setFreq(f);
    if (!parseFloat(custom)) setAmtIdx(0);
  };

  const compartilhar = async () => {
    const link = window.location.href.split("?")[0];
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
  };

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
            {campaign.days !== undefined && (
              <span>
                <i className="ph ph-calendar-blank"></i>{" "}
                {campaign.days > 0
                  ? `Termina em ${campaign.days} ${campaign.days === 1 ? "dia" : "dias"}`
                  : "Prazo encerrado"}
              </span>
            )}
            <span>
              <i className="ph ph-users"></i>
              <b id="vBackersMeta">{campaign.backers}</b>&nbsp;apoiadores
            </span>
          </div>
          {campaign.full ? (
            <img id="vImg" src={campaign.full} alt={`Imagem da campanha ${campaign.title}`} />
          ) : (
            <div
              id="vImg"
              aria-hidden="true"
              style={{
                width: "100%",
                aspectRatio: "16 / 7",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #FC681A 0%, #301607 100%)",
              }}
            />
          )}
        </div>
      </div>

      <div className="v-grid wrap">
        <div className="v-conteudo">
          <h2>Sobre esta vaquinha</h2>
          <div className="texto">
            {(campaign.story?.length ? campaign.story : [campaign.sub]).map((p, i) => (
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
          {aceitaMensal ? (
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
          ) : null}
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
        key={modal ? "aberto" : "fechado"}
        open={modal}
        campaign={campaign}
        valor={valor}
        freq={freq}
        onClose={() => setModal(false)}
      />
    </section>
  );
}
