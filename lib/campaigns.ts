/* Dados e utilidades da Oxente — extraídos do protótipo original */

export type Freq = "unica" | "mes";
export type TipoCampanha = "unica" | "recorrente";
export type Modelo = "full" | "split" | "center" | "solid";

export type Campaign = {
  slug: string;
  title: string;
  sub: string;
  cat: string;
  place: string;
  raised: number;
  goal: number;
  backers: number;
  days: number; // dias restantes (campanha única)
  recurring?: boolean;
  img: string; // imagem da listagem
  full: string; // imagem grande da página
  featured?: boolean;
  flash?: boolean; // recém-publicada no construtor
  customImg?: string | null; // imagem enviada no construtor (dataURL)
};

export type TickerItem = [nome: string, valor: string, causa: string];

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
  Math.min(100, Math.round((c.raised / c.goal) * 100));

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

/* ---------- campanhas (seed do protótipo) ---------- */

const mk = (c: Omit<Campaign, "slug">): Campaign => ({ ...c, slug: slug(c.title) });

export const SEED_CAMPAIGNS: Campaign[] = [
  mk({
    title: "Horta Comunitária da Boa Vista",
    sub: "Uma quadra abandonada há vinte anos virando duas toneladas de alimento por ano para 80 famílias do bairro.",
    cat: "Comunidade",
    place: "Recife, PE",
    raised: 42380,
    goal: 60000,
    backers: 312,
    days: 23,
    img: "https://picsum.photos/seed/oxente-horta/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-horta/1600/740.jpg",
    featured: true,
  }),
  mk({
    title: "Água no Sertão: 40 cisternas para Cabrobá",
    sub: "Água de beber a cinquenta passos de casa para quarenta famílias do semiárido pernambucano.",
    cat: "Comunidade",
    place: "Cabrobá, PE",
    raised: 18940,
    goal: 45000,
    backers: 148,
    days: 41,
    img: "https://picsum.photos/seed/oxente-agua/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-agua/1600/740.jpg",
  }),
  mk({
    title: "Percussão de Meninas: oficinas de maracatu",
    sub: "Tambores na mão de 60 meninas de Olinda: oficinas gratuitas de maracatu, fanfarra e construção de instrumentos.",
    cat: "Cultura",
    place: "Olinda, PE",
    raised: 9120,
    goal: 12000,
    backers: 96,
    days: 9,
    img: "https://picsum.photos/seed/oxente-maracatu/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-maracatu/1600/740.jpg",
  }),
  mk({
    title: "Patas do Mercadão: castração e adoção",
    sub: "Cem castrações, microchips e um mutirão de adoção responsável para os gatos e cães do Mercadão da Madalena.",
    cat: "Animais",
    place: "Recife, PE",
    raised: 6480,
    goal: 15000,
    backers: 122,
    days: 30,
    img: "https://picsum.photos/seed/oxente-patas/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-patas/1600/740.jpg",
  }),
  mk({
    title: "Biblioteca do Arraial: um mundo em 2.000 livros",
    sub: "Acervo, estantes e um balcão de café para a biblioteca comunitária que atende 180 crianças por semana.",
    cat: "Educação",
    place: "João Pessoa, PB",
    raised: 27300,
    goal: 30000,
    backers: 410,
    days: 5,
    img: "https://picsum.photos/seed/oxente-biblioteca/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-biblioteca/1600/740.jpg",
  }),
  mk({
    title: "Marmitas Solidárias do Arraial",
    sub: "Quinhentas marmitas quentes por semana, feitas por quem mora no arraial, para quem mora no arraial.",
    cat: "Alimentação",
    place: "Recife, PE",
    raised: 3850,
    goal: 8000,
    backers: 61,
    days: 17,
    img: "https://picsum.photos/seed/oxente-marmitas/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-marmitas/1600/740.jpg",
  }),
];

export const CATEGORIAS = ["Comunidade", "Educação", "Cultura", "Animais", "Alimentação"];

export const DESTAQUE = SEED_CAMPAIGNS.find((c) => c.featured)!;
export const LISTA_SEED = SEED_CAMPAIGNS.filter((c) => !c.featured);

/* ---------- ticker da home ---------- */

export const DOACOES_TICKER: TickerItem[] = [
  ["Tereza M. doou", "R$ 80", "Horta da Boa Vista"],
  ["Anônimo doou", "R$ 25", "Água no Sertão"],
  ["Rafael & Ana doaram", "R$ 200", "Percussão de Meninas"],
  ["Padre Jonas doou", "R$ 60", "Biblioteca do Arraial"],
  ["Grupo Zé de Lula doou", "R$ 310", "Marmitas Solidárias"],
  ["Anônimo doou", "R$ 120", "Patas do Mercadão"],
  ["Cida do Aconchego doou", "R$ 130", "Horta da Boa Vista"],
  ["Donana doou", "R$ 45", "Biblioteca do Arraial"],
];

/* ---------- parceiros ---------- */

export type Parceiro = {
  nome: string;
  sigla: string;
  tipo: string; // ONG · Instituto · Coletivo · Empresa · Escola
  area: string;
  place: string;
  desde: string;
  desc: string;
};

export const PARCEIROS: Parceiro[] = [
  {
    nome: "Instituto Rosa e Sertão",
    sigla: "RS",
    tipo: "ONG",
    area: "Comunidade",
    place: "Cabrobá, PE",
    desde: "2021",
    desc: "Cisternas, hortas e aulas de leitura para as famílias do semiárido.",
  },
  {
    nome: "Coletivo Maré Cheia",
    sigla: "MC",
    tipo: "Coletivo",
    area: "Cultura",
    place: "Olinda, PE",
    desde: "2022",
    desc: "Oficinas gratuitas de maracatu e fanfarra para meninas de Olinda.",
  },
  {
    nome: "Padaria do Arraial",
    sigla: "PA",
    tipo: "Empresa",
    area: "Alimentação",
    place: "Recife, PE",
    desde: "2023",
    desc: "Doa o pão bumbaiado de todo domingo para o mutirão das marmitas.",
  },
  {
    nome: "Clínica Bicho de Estimação",
    sigla: "BE",
    tipo: "Empresa",
    area: "Animais",
    place: "Jaboatão, PE",
    desde: "2022",
    desc: "Castrações e vacinas a preço de custo nos mutirões de adoção.",
  },
  {
    nome: "Escola João Redondo",
    sigla: "JR",
    tipo: "Escola",
    area: "Educação",
    place: "Natal, RN",
    desde: "2024",
    desc: "Mantém a biblioteca comunitária com uma vaquinha recorrente.",
  },
  {
    nome: "Mercado da Madalena",
    sigla: "MM",
    tipo: "Empresa",
    area: "Comunidade",
    place: "Recife, PE",
    desde: "2021",
    desc: "Cede o espaço dos mutirões de adoção e das marmitas solidárias.",
  },
  {
    nome: "Frente Volta Verde",
    sigla: "VG",
    tipo: "ONG",
    area: "Meio ambiente",
    place: "Caruaru, PE",
    desde: "2023",
    desc: "Reflorestamento de nascentes na Zona da Mata pernambucana.",
  },
  {
    nome: "Rádio Comunidade 91.5",
    sigla: "RC",
    tipo: "Empresa",
    area: "Cultura",
    place: "Petrolina, PE",
    desde: "2024",
    desc: "Divulga de graça as vaquinhas das bordas do São Francisco.",
  },
];

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

/* ---------- apoiadores recentes (página da vaquinha) ---------- */

export type Backer = { ini: string; nome: string; quando: string; valor: number };

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

export const BACKERS_SEED: Backer[] = [
  { ini: "TM", nome: "Tereza M.", quando: "há 2 horas", valor: 80 },
  { ini: "AN", nome: "Anônimo", quando: "há 5 horas", valor: 25 },
  { ini: "RA", nome: "Rafael & Ana", quando: "ontem", valor: 200 },
  { ini: "PJ", nome: "Padre Jonas", quando: "ontem", valor: 60 },
  { ini: "CA", nome: "Cida do Aconchego", quando: "há 2 dias", valor: 130 },
];
