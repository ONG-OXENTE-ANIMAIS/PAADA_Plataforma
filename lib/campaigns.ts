/* Dados e utilidades da Oxente — extraídos do protótipo original */

export type Freq = "unica" | "mes";
export type TipoCampanha = "unica" | "recorrente";
export type Modelo = "full" | "split" | "center" | "solid";

export type Uso = { label: string; valor: number };
export type Atualizacao = {
  tag: string;
  iso: string;
  data: string;
  titulo: string;
  texto: string;
};

export type Campaign = {
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
  img: string; // imagem da listagem
  full: string; // imagem grande da página
  featured?: boolean;
  flash?: boolean; // recém-publicada no construtor
  customImg?: string | null; // imagem enviada no construtor (dataURL)
  story?: string[]; // parágrafos "Sobre esta vaquinha"
  usos?: Uso[]; // para onde o dinheiro vai
  updates?: Atualizacao[]; // atualizações publicadas
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
    title: "Patas do Mercadão: castração e adoção",
    sub: "Cem castrações, microchips e um mutirão de adoção responsável para os gatos e cães do Mercadão da Madalena.",
    cat: "Recorrente",
    place: "Petrolina, PE",
    raised: 42380,
    goal: 60000,
    backers: 312,
    img: "https://picsum.photos/seed/oxente-patas/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-patas/1600/740.jpg",
    featured: true,
    recurring: true,
    story: [
      "O Mercadão da Madalena sempre teve uma colônia de gatos e uma matilha de cães que vive do carinho dos feirantes. Em 2023, com a Clínica Bicho de Estimação, a Oxente fez o primeiro mutirão: quarenta castrações num sábado só. Fila na porta, caixa de transporte emprestada, café pra quem esperou.",
      "Agora a meta é maior: cem castrações com microchip, vacina múltipla e um mutirão de adoção responsável — com visita prévia, termo de guarda e kit de ração pra quem levar um bichano pra casa. Faltam os insumos da última etapa e o aluguel das gaiolas: é pra isso que esta vaquinha corre.",
      "Quem não pode adotar pode ser lar temporário por um fim de semana — é o respiro que um animal acostumado à rua precisa pra aprender que sofá também é dele.",
    ],
    usos: [
      { label: "100 castrações com microchip", valor: 28000 },
      { label: "Vacinas, vermífugos e testes", valor: 8400 },
      { label: "Aluguel de 30 gaiolas de transporte (3 meses)", valor: 7200 },
      { label: "Kit adoção com ração e areia para 60 famílias", valor: 16400 },
    ],
    updates: [
      {
        tag: "Marco",
        iso: "2025-06-12",
        data: "12 de junho de 2025",
        titulo: "Primeiras 40 castrações feitas",
        texto:
          "O mutirão de sábado saiu do papel: quarenta animais castrados, dois adotados na hora e nenhum imprevisto. As notas do material cirúrgico já estão publicadas.",
      },
    ],
  }),
];

export const CATEGORIAS = ["Resgate", "Castração", "Abrigo", "Adoção", "Veterinário"];

export const DESTAQUE = SEED_CAMPAIGNS.find((c) => c.featured)!;
export const LISTA_SEED = SEED_CAMPAIGNS.filter((c) => !c.featured);

/* ---------- ticker da home ---------- */

export const DOACOES_TICKER: TickerItem[] = [
  ["Tereza M. doou", "R$ 80", "Patas do Mercadão"],
  ["Anônimo doou", "R$ 25", "Resgate de Jaboatão"],
  ["Rafael & Ana doaram", "R$ 200", "Abrigo do Arraial"],
  ["Padre Jonas doou", "R$ 60", "Castração da Casa Amarela"],
  ["Grupo Zé de Lula doou", "R$ 310", "Cavalos de carroça"],
  ["Anônimo doou", "R$ 120", "Feira de Adoção de Olinda"],
  ["Cida do Aconchego doou", "R$ 130", "Patas do Mercadão"],
  ["Donana doou", "R$ 45", "Abrigo do Arraial"],
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
    nome: "Clínica Bicho de Estimação",
    sigla: "BE",
    tipo: "Empresa",
    area: "Veterinário",
    place: "Jaboatão, PE",
    desde: "2022",
    desc: "Castrações e vacinas a preço de custo nos mutirões de adoção.",
  },
  {
    nome: "Coletivo Gatos do Recife",
    sigla: "GR",
    tipo: "Coletivo",
    area: "Abrigo",
    place: "Recife, PE",
    desde: "2021",
    desc: "Cuida das colônias de gatos do centro e cede as gaiolas dos mutirões.",
  },
  {
    nome: "Petshop Boa Pata",
    sigla: "BP",
    tipo: "Empresa",
    area: "Alimentação",
    place: "Recife, PE",
    desde: "2023",
    desc: "Doa 400 kg de ração por mês para os abrigos e lares temporários.",
  },
  {
    nome: "Lar Temporário Recife",
    sigla: "LT",
    tipo: "ONG",
    area: "Resgate",
    place: "Olinda, PE",
    desde: "2022",
    desc: "Rede de casas de passagem que acolhe cães resgatados até a adoção.",
  },
  {
    nome: "Associação dos Carroceiros",
    sigla: "AC",
    tipo: "Coletivo",
    area: "Veterinário",
    place: "Recife, PE",
    desde: "2023",
    desc: "Cede o terreiro de descanso e cuida da escala dos vinte cavalos.",
  },
  {
    nome: "Mercado da Madalena",
    sigla: "MM",
    tipo: "Empresa",
    area: "Comunidade",
    place: "Recife, PE",
    desde: "2021",
    desc: "Cede o galpão dos mutirões de castração e das feiras de adoção.",
  },
  {
    nome: "Escola João Redondo",
    sigla: "JR",
    tipo: "Escola",
    area: "Educação",
    place: "Natal, RN",
    desde: "2024",
    desc: "Mantém o projeto Guardiões dos Animais e uma vaquinha recorrente do abrigo.",
  },
  {
    nome: "Rádio Comunidade 91.5",
    sigla: "RC",
    tipo: "Empresa",
    area: "Comunicação",
    place: "Petrolina, PE",
    desde: "2024",
    desc: "Divulga de graça os mutirões de adoção e as vaquinhas de resgate.",
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
