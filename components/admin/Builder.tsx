"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCampaigns } from "@/lib/CampaignsProvider";
import { useToast } from "@/components/fx/ToastProvider";
import BuilderPreview from "@/components/admin/BuilderPreview";
import {
  BRL,
  CATEGORIAS,
  CORES_SWATCH,
  NOMES_CORES,
  NOMES_MODELO,
  fmtData,
  slug as slugify,
  trunc,
  type Campaign,
  type Draft,
  type Modelo,
  type TipoCampanha,
} from "@/lib/campaigns";

const DRAFT_INICIAL = (tipo: TipoCampanha): Draft => ({
  type: tipo,
  model: "split",
  title: "Horta Comunitária da Boa Vista",
  subtitle:
    "Uma quadra abandonada virando duas toneladas de alimento por ano.",
  story:
    "A Rua do Sossego tinha uma quadra cercada havia vinte anos. Dez famílias limparam o terreno e plantaram as primeiras mudas. Hoje a horta entrega verdura para 80 famílias toda semana — esta vaquinha vai garantir água, sombra e galpão para o próximo ano.",
  imgData: null,
  color: "#FC681A",
  goal: 60000,
  goalM: 3000,
  date: "2025-08-30",
  category: "Comunidade",
});

const MODELOS: { id: Modelo; nome: string; desc: string; wire: string; extra?: "e" | "aa" }[] = [
  {
    id: "full",
    nome: "Imersiva",
    desc: "Foto de ponta a ponta com o título por cima. Impacto imediato.",
    wire: "w-immer",
  },
  {
    id: "split",
    nome: "Lado a lado",
    desc: "Texto e foto dividindo a cena. Bom para contar história.",
    wire: "w-split",
    extra: "e",
  },
  {
    id: "center",
    nome: "Centralizada",
    desc: "Título em destaque e foto logo abaixo. Clássico e limpo.",
    wire: "w-center",
  },
  {
    id: "solid",
    nome: "Sólida",
    desc: "Cor cheia e tipografia grande. Sem foto, pura presença.",
    wire: "w-solid",
    extra: "aa",
  },
];

export default function Builder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { campaigns, addCampaign } = useCampaigns();

  const recInicial = useRef(searchParams.get("tipo") === "recorrente");
  const [draft, setDraft] = useState<Draft>(() =>
    DRAFT_INICIAL(recInicial.current ? "recorrente" : "unica"),
  );
  const [step, setStep] = useState(1);

  const inTitleRef = useRef<HTMLInputElement>(null);
  const inGoalRef = useRef<HTMLInputElement>(null);
  const inGoalMRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* aviso ao entrar pelo atalho "vaquinha recorrente" */
  useEffect(() => {
    if (recInicial.current)
      toast(
        "Modo vaquinha recorrente ativado — defina a meta mensal no passo 3.",
        "arrows-clockwise",
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setTipo = (t: TipoCampanha) => set({ type: t });
  const metaAtual = () => (draft.type === "recorrente" ? draft.goalM : draft.goal);
  const slugPrevisto = slugify(draft.title) || "sua-vaquinha";

  /* ---- upload de imagem ---- */
  function lerArquivo(f: File) {
    if (!f.type.startsWith("image/")) {
      toast("Envie um arquivo de imagem (JPG ou PNG).", "warning");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast("Imagem muito grande — o limite é 5 MB.", "warning");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      set({ imgData: String(r.result) });
      toast("Imagem carregada! Ela já está no preview.", "image");
    };
    r.readAsDataURL(f);
  }

  /* ---- publicar ---- */
  function publicar() {
    const rec = draft.type === "recorrente";
    if (!draft.title.trim()) {
      toast("Dê um título à sua vaquinha antes de publicar.", "warning");
      setStep(2);
      requestAnimationFrame(() => inTitleRef.current?.focus());
      return;
    }
    if (metaAtual() <= 0) {
      toast(
        rec
          ? "Defina uma meta mensal maior que zero."
          : "Defina uma meta de arrecadação maior que zero.",
        "warning",
      );
      setStep(3);
      requestAnimationFrame(() =>
        (rec ? inGoalMRef.current : inGoalRef.current)?.focus(),
      );
      return;
    }

    const base = slugify(draft.title) || "oxente-nova";
    let finalSlug = base;
    let i = 2;
    while (campaigns.some((c) => c.slug === finalSlug))
      finalSlug = `${base}-${i++}`;

    const nova: Campaign = {
      slug: finalSlug,
      title: draft.title,
      sub: draft.subtitle || "Campanha criada no construtor da Oxente.",
      cat: draft.category,
      place: "Pernambuco, PE",
      raised: 0,
      goal: metaAtual(),
      backers: 0,
      days: 30,
      recurring: rec || undefined,
      img: `https://picsum.photos/seed/${finalSlug}/640/420.jpg`,
      full: `https://picsum.photos/seed/${finalSlug}/1600/740.jpg`,
      customImg: draft.imgData,
      flash: true,
    };
    addCampaign(nova);
    toast(
      `“${trunc(draft.title, 32)}” publicada${rec ? " — campanha mensal no ar!" : " — no ar na página inicial!"}`,
      "hand-heart",
    );
    router.push("/#vaquinhas");
  }

  const rec = draft.type === "recorrente";

  return (
    <section className="screen active" data-screen="admin">
      <div className="adm-head wrap">
        <h1>Nova vaquinha</h1>
        <p>
          Monte a página da sua campanha em quatro passos. Escolha o tipo abaixo
          — única (com meta e prazo) ou recorrente (apoio todo mês) — e acompanhe
          tudo no preview ao lado.
        </p>
        <div className="adm-bts">
          <button
            className={"btn btn-fantasma tipo-btn" + (rec ? "" : " on")}
            onClick={() => setTipo("unica")}
          >
            <i className="ph ph-target"></i> Vaquinha única
          </button>
          <button
            className={"btn btn-fantasma tipo-btn" + (rec ? " on" : "")}
            onClick={() => setTipo("recorrente")}
          >
            <i className="ph ph-arrows-clockwise"></i> Vaquinha recorrente
          </button>
        </div>
      </div>

      <ol className="stepper wrap" id="stepper">
        {[1, 2, 3, 4].map((s) => (
          <li
            key={s}
            className={
              s === step ? "on" : s < step ? "done" : undefined
            }
            onClick={() => setStep(s)}
          >
            <span className="s-num">
              {s < step ? <i className="ph ph-check"></i> : s}
            </span>
            <span className="s-lab">
              {["Cabeçalho", "Conteúdo", "Meta", "Revisar"][s - 1]}
            </span>
          </li>
        ))}
      </ol>

      <div className="adm-grid wrap">
        <div>
          {/* PASSO 1 */}
          <div className={"step painel" + (step === 1 ? " active" : "")}>
            <h2>Como sua vaquinha começa?</h2>
            <p>
              Primeiro o tipo da campanha, depois o tipo de cabeçalho. Todo o
              resto se adapta às suas escolhas.
            </p>

            <div className="tipos">
              <button
                className={"tcard" + (rec ? "" : " sel")}
                onClick={() => setTipo("unica")}
              >
                <span className="nome">
                  <i className="ph ph-target"></i> Única
                </span>
                <span className="desc">
                  Meta e prazo definidos. Ideal para uma obra, um evento ou uma
                  compra específica.
                </span>
              </button>
              <button
                className={"tcard" + (rec ? " sel" : "")}
                onClick={() => setTipo("recorrente")}
              >
                <span className="nome">
                  <i className="ph ph-arrows-clockwise"></i> Recorrente
                </span>
                <span className="desc">
                  Apoio todo mês, sem prazo. Ideal para custos fixos: merenda,
                  aluguel, bolsas, insumos.
                </span>
              </button>
            </div>

            <div className="modelos">
              {MODELOS.map((m) => (
                <button
                  key={m.id}
                  className={"mcard" + (draft.model === m.id ? " sel" : "")}
                  onClick={() => set({ model: m.id })}
                >
                  <div className={"wire " + m.wire}>
                    {m.extra === "aa" ? <span className="aa">Aa</span> : null}
                    <i className="a"></i>
                    <i className="b"></i>
                    {m.wire !== "w-center" ? <i className="c"></i> : null}
                    {m.wire === "w-immer" || m.wire === "w-split" ? (
                      <i className="d"></i>
                    ) : null}
                    {m.extra === "e" ? <i className="e"></i> : null}
                  </div>
                  <span className="nome">
                    {m.nome} <i className="ph-fill ph-check-circle"></i>
                  </span>
                  <span className="desc">{m.desc}</span>
                </button>
              ))}
            </div>
            <div className="step-nav">
              <span className="vazio"></span>
              <button className="btn btn-laranja" onClick={() => setStep(2)}>
                Escolher e continuar <i className="ph ph-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* PASSO 2 */}
          <div className={"step painel" + (step === 2 ? " active" : "")}>
            <h2>Preencha o conteúdo</h2>
            <p>
              Tudo aqui é exclusivo desta campanha — é isso que dá a identidade
              própria de cada vaquinha.
            </p>
            <div className="campo">
              <label>
                Título da campanha
                <span className="contador">
                  <span id="cTitle">{draft.title.length}</span>/68
                </span>
              </label>
              <input
                type="text"
                id="inTitle"
                maxLength={68}
                value={draft.title}
                ref={inTitleRef}
                onChange={(e) => set({ title: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>
                Chamada (frase curta de apoio)
                <span className="contador">
                  <span id="cSub">{draft.subtitle.length}</span>/90
                </span>
              </label>
              <input
                type="text"
                id="inSub"
                maxLength={90}
                value={draft.subtitle}
                onChange={(e) => set({ subtitle: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>
                História da campanha
                <span className="contador">
                  <span id="cStory">{draft.story.length}</span>/600
                </span>
              </label>
              <textarea
                id="inStory"
                maxLength={600}
                value={draft.story}
                onChange={(e) => set({ story: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Imagem de capa</label>
              <div
                className="dropzone"
                id="dropzone"
                tabIndex={0}
                role="button"
                aria-label="Enviar imagem de capa"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("#dzRemover")) return;
                  fileInputRef.current?.click();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("drag");
                }}
                onDragLeave={(e) => e.currentTarget.classList.remove("drag")}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("drag");
                  const f = e.dataTransfer.files[0];
                  if (f) lerArquivo(f);
                }}
              >
                <div className={"dz-vazio" + (draft.imgData ? " hidden" : "")}>
                  <i className="ph ph-upload-simple"></i>
                  <b>Envie a foto da campanha</b>
                  <span>
                    Arraste aqui ou clique para escolher · JPG ou PNG, até 5 MB
                  </span>
                </div>
                <div className={"dz-preview" + (draft.imgData ? "" : " hidden")}>
                  <img id="dzImg" src={draft.imgData ?? undefined} alt="Prévia da imagem enviada" />
                  <div className="dz-bts">
                    <button
                      className="btn btn-fantasma"
                      style={{ padding: "9px 16px", fontSize: "13px" }}
                    >
                      <i className="ph ph-arrows-counter-clockwise"></i> Trocar
                      imagem
                    </button>
                    <button
                      className="btn btn-fantasma"
                      id="dzRemover"
                      style={{ padding: "9px 16px", fontSize: "13px" }}
                      onClick={() => set({ imgData: null })}
                    >
                      <i className="ph ph-trash"></i> Remover
                    </button>
                  </div>
                </div>
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) lerArquivo(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <p className="nota-bib">
                Neste protótipo a imagem fica só no seu navegador — no produto
                real, o upload vai para o storage da plataforma.
              </p>
            </div>
            <div className="campo">
              <label>Cor da campanha</label>
              <div className="swatches" id="swatches">
                {CORES_SWATCH.map((cor) => (
                  <button
                    key={cor}
                    className={"swatch" + (draft.color === cor ? " sel" : "")}
                    onClick={() => set({ color: cor })}
                  >
                    <span
                      className="bolinha"
                      style={{ background: cor.toLowerCase() }}
                    ></span>
                    <small>{NOMES_CORES[cor]}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="step-nav">
              <button className="btn btn-fantasma" onClick={() => setStep(1)}>
                <i className="ph ph-arrow-left"></i> Voltar
              </button>
              <button className="btn btn-laranja" onClick={() => setStep(3)}>
                Continuar <i className="ph ph-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* PASSO 3 */}
          <div className={"step painel" + (step === 3 ? " active" : "")}>
            <h2>Meta e organização</h2>
            <p>
              Defina quanto precisa arrecadar e, se for campanha única, até
              quando.
            </p>

            <div id="metaUnica" className={rec ? "hidden" : undefined}>
              <div className="duo">
                <div className="campo">
                  <label>Meta de arrecadação</label>
                  <div className="input-moeda">
                    <span>R$</span>
                    <input
                      type="number"
                      id="inGoal"
                      value={draft.goal}
                      min={100}
                      step={100}
                      ref={inGoalRef}
                      onChange={(e) =>
                        set({ goal: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                    />
                  </div>
                </div>
                <div className="campo">
                  <label>Prazo final</label>
                  <input
                    type="date"
                    id="inDate"
                    value={draft.date}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div id="metaRec" className={rec ? undefined : "hidden"}>
              <div className="campo">
                <label>
                  Meta mensal
                  <span className="contador">
                    quanto custa manter o projeto por mês
                  </span>
                </label>
                <div className="input-moeda">
                  <span>R$</span>
                  <input
                    type="number"
                    id="inGoalM"
                    value={draft.goalM}
                    min={50}
                    step={50}
                    ref={inGoalMRef}
                    onChange={(e) =>
                      set({ goalM: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                  />
                </div>
              </div>
              <div className="aviso-revisao" style={{ marginTop: 0 }}>
                <i className="ph ph-arrows-clockwise"></i>
                <span>
                  Campanha contínua: sem data de fim. Os apoiadores doam todo mês
                  e podem pausar quando quiserem — a página mostra sempre o
                  progresso do mês corrente.
                </span>
              </div>
            </div>

            <div className="campo" style={{ marginTop: "22px" }}>
              <label>Categoria</label>
              <div className="chips" id="catChips">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    className={draft.category === cat ? "on" : ""}
                    onClick={() => set({ category: cat })}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="campo">
              <label>Endereço da página</label>
              <input
                type="text"
                className="fixo"
                id="slugField"
                value={"oxente.org/v/" + slugPrevisto}
                readOnly
              />
            </div>
            <div className="step-nav">
              <button className="btn btn-fantasma" onClick={() => setStep(2)}>
                <i className="ph ph-arrow-left"></i> Voltar
              </button>
              <button className="btn btn-laranja" onClick={() => setStep(4)}>
                Continuar <i className="ph ph-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* PASSO 4 */}
          <div className={"step painel" + (step === 4 ? " active" : "")}>
            <h2>Tudo pronto para publicar?</h2>
            <p>
              Confira o resumo — o preview ao lado mostra exatamente como a
              página vai ficar.
            </p>
            <dl className="revisao">
              <div>
                <dt>Tipo</dt>
                <dd id="rvTipo">
                  {rec ? "Recorrente — apoio todo mês" : "Única — meta e prazo"}
                </dd>
              </div>
              <div>
                <dt>Cabeçalho</dt>
                <dd id="rvModelo">{NOMES_MODELO[draft.model]}</dd>
              </div>
              <div>
                <dt>Título</dt>
                <dd id="rvTitulo">{draft.title || "—"}</dd>
              </div>
              <div>
                <dt>Imagem</dt>
                <dd id="rvImagem">{draft.imgData ? "Enviada ✓" : "Sem imagem"}</dd>
              </div>
              <div>
                <dt>Cor</dt>
                <dd id="rvCor">{NOMES_CORES[draft.color] || "—"}</dd>
              </div>
              <div>
                <dt>Meta</dt>
                <dd id="rvMeta">
                  {rec ? BRL(metaAtual()) + " por mês" : BRL(metaAtual())}
                </dd>
              </div>
              <div>
                <dt>Prazo</dt>
                <dd id="rvPrazo">
                  {rec ? "Contínua (sem prazo)" : fmtData(draft.date)}
                </dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd id="rvCat">{draft.category}</dd>
              </div>
            </dl>
            <div className="aviso-revisao">
              <i className="ph ph-info"></i>
              <span>
                No produto final, esta etapa inclui também a revisão da ONG e a
                vinculação da conta do Mercado Pago, para que os repasses caiam
                direto na conta da instituição.
              </span>
            </div>
            <div className="step-nav">
              <button className="btn btn-fantasma" onClick={() => setStep(3)}>
                <i className="ph ph-arrow-left"></i> Voltar
              </button>
              <button
                className="btn btn-laranja"
                id="btnPublish"
                onClick={publicar}
              >
                <i className="ph-fill ph-hand-heart"></i> Publicar vaquinha
              </button>
            </div>
          </div>
        </div>

        <div className="pv-side">
          <div className="rotulo">
            <span className="ponto"></span> Preview ao vivo
          </div>
          <div className="browser">
            <div className="browser-top">
              <span className="dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="url" id="pvUrl">
                {"oxente.org/v/" + slugPrevisto}
              </span>
            </div>
            <div className="pv-body-prev">
              <BuilderPreview draft={draft} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
