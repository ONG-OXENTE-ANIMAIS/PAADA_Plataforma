/* Tipos e utilidades de interface da Oxente.
 *
 * Os dados reais vêm da API (/api/campanhas, /api/parceiros …) — este arquivo
 * concentra apenas tipos de UI, mapeadores API→UI e constantes de interface
 * (categorias, valores sugeridos, cores do construtor). */

export type Freq = "unica" | "mes";
export type TipoCampanha = "unica" | "recorrente";
export type Modelo = "full" | "split" | "center" | "solid";
import type { StatusCampanha } from "@/types/database.types";

export type Uso = { label: string; valor: number; alcancada: boolean };
export type Atualizacao = {
  tag: string;
  iso: string;
  data: string;
  titulo: string;
  texto: string;
};

export type Campaign = {
  id: string;
  slug: string;
  title: string;
  sub: string;
  cat: string;
  place: string;
  raised: number;
  goal: number;
  backers: number;
  days?: number; // dias restantes (campanha única)
  recurring?: boolean;
  img: string | null; // imagem da listagem
  full: string | null; // imagem grande da página
  featured?: boolean;
  flash?: boolean; // recém-publicada no construtor
  story?: string[]; // parágrafos "Sobre esta vaquinha"
  usos?: Uso[]; // para onde o dinheiro vai
  updates?: Atualizacao[]; // atualizações publicadas
};

export type TickerItem = [nome: string, valor: string, causa: string];

/* ---------- payload da API ---------- */

export type CampanhaApi = {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  descricao: string | null;
  categoria: string | null;
  localidade: string | null;
  historia: string | null;
  meta_arrecadacao: number | null;
  valor_meta: number;
  valor_arrecadado: number;
  data_inicio: string | null;
  data_fim: string | null;
  status: StatusCampanha;
  mensal: boolean;
  destaque: boolean;
  meta_isvisible: boolean;
  criada_em: string;
  atualizado_em: string;
  imagem?: string | null;
  apoiadores?: number;
};

const dataCurta = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export function diasRestantes(dataFim: string | null): number | undefined {
  if (!dataFim) return undefined;
  // Supabase returns timestamp strings like "2027-02-24 00:00:00" or "2027-02-24T00:00:00.000Z"
  // Parse directly without appending time (already has time component or is ISO)
  const fim = new Date(dataFim.replace(" ", "T")).getTime();
  if (isNaN(fim)) return undefined;
  return Math.max(0, Math.ceil((fim - Date.now()) / 86_400_000));
}

/** Mapeia o payload da API para a forma usada pelos componentes. */
export function campaignFromApi(c: CampanhaApi): Campaign {
  const paragrafos = (c.descricao ?? "").split(/\n{2,}/).filter(Boolean);
  return {
    id: c.id,
    slug: c.slug,
    title: c.titulo,
    sub: paragrafos[0] ?? "Campanha da Oxente.",
    cat: c.categoria ?? "Campanha",
    place: c.localidade ?? "Pernambuco, PE",
    raised: Number(c.valor_arrecadado),
    goal: Number(c.valor_meta),
    backers: c.apoiadores ?? 0,
    days: c.mensal ? undefined : diasRestantes(c.data_fim),
    recurring: c.mensal || undefined,
    img: c.imagem ?? null,
    full: c.imagem ?? null,
    featured: c.destaque || undefined,
  };
}

/* ---------- utilidades ---------- */

export const BRL = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");

export const trunc = (s: string, n: number) =>
  (s || "").length > n ? s.slice(0, n).trimEnd() + "…" : s || "";

export const slug = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const pctOf = (c: { raised: number; goal: number }) =>
  c.goal > 0 ? Math.min(100, Math.round((c.raised / c.goal) * 100)) : 0;

export const VALORES: Record<Freq, number[]> = {
  unica: [25, 50, 100, 250],
  mes: [15, 30, 60, 120],
};

export const NOMES_MODELO: Record<Modelo, string> = {
  full: "Imersiva",
  split: "Lado a lado",
  center: "Centralizada",
  solid: "Sólida",
};

export const pickText = (hex: string) =>
  ({ "#FC681A": "#301607", "#301607": "#FDE7CD", "#FDE7CD": "#301607" })[hex] || "#301607";

export const CORES_SWATCH = ["#FC681A", "#301607", "#FDE7CD"];

export const CATEGORIAS = ["Resgate", "Castração", "Abrigo", "Adoção", "Veterinário"];

/* ---------- parceiros ---------- */

export type Parceiro = {
  nome: string;
  sigla: string;
  tipo: string; // ONG · Instituto · Coletivo · Empresa · Escola
  area: string;
  place: string;
  desde: string;
  desc: string;
  destaque?: boolean; // citado na história da vaquinha em destaque
};

/** Mapeia o payload de /api/parceiros para a UI. */
export function parceiroFromApi(p: {
  nome: string;
  sigla: string | null;
  tipo: string | null;
  area: string | null;
  localidade: string | null;
  descricao: string | null;
  desde: string | null;
  destaque: boolean;
}): Parceiro {
  return {
    nome: p.nome,
    sigla: p.sigla ?? p.nome.slice(0, 2).toUpperCase(),
    tipo: p.tipo ?? "Parceiro",
    area: p.area ?? "—",
    place: p.localidade ?? "—",
    desde: p.desde ?? "",
    desc: p.descricao ?? "",
    destaque: p.destaque || undefined,
  };
}

export const TIPOS_ORG = [
  "ONG",
  "Instituto",
  "Coletivo",
  "Empresa",
  "Escola",
  "Outro",
];

export const FORMAS_PARCERIA = [
  "Criar vaquinhas",
  "Doar mensalmente",
  "Voluntariado",
  "Divulgação",
  "Patrocínio",
];

export const TIPOS_SUGESTAO = [
  "Nova funcionalidade",
  "Melhoria no site",
  "Ideia de campanha",
  "Correção de problema",
  "Outro assunto",
];

/* ---------- contato (rótulos de status da API) ---------- */

export const ROTULO_STATUS: Record<string, string> = {
  RECEBIDA: "Recebida",
  EM_ANALISE: "Em análise",
  RESPONDIDA: "Respondida",
  ARQUIVADA: "Arquivada",
};

/* ---------- construtor ---------- */

export type Draft = {
  type: TipoCampanha;
  model: Modelo;
  title: string;
  subtitle: string;
  story: string;
  imgData: string | null;
  color: string;
  goal: number;
  goalM: number;
  date: string;
  category: string;
};

export const NOMES_CORES: Record<string, string> = {
  "#FC681A": "Laranja Oxente",
  "#301607": "Marrom Torrado",
  "#FDE7CD": "Areia Quente",
};

export const fmtData = (iso: string) => {
  if (!iso) return "sem prazo definido";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

export { dataCurta as fmtDataLonga };
