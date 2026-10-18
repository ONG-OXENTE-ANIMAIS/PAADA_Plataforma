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
  days: number; // dias restantes (campanha única)
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
    cat: "Adoção",
    place: "Recife, PE",
    raised: 42380,
    goal: 60000,
    backers: 312,
    days: 23,
    img: "https://picsum.photos/seed/oxente-patas/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-patas/1600/740.jpg",
    featured: true,
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
      {
        tag: "Repasse",
        iso: "2025-05-28",
        data: "28 de maio de 2025",
        titulo: "R$ 18.940 viraram microchips e soro",
        texto:
          "O primeiro repasse do Mercado Pago foi investido em microchips, soro e material de sutura. Os comprovantes já foram publicados para os apoiadores da campanha.",
      },
    ],
  }),
  mk({
    title: "Resgate do aterro: 60 cães de Jaboatão",
    sub: "Do lixo pra casa: captura humanizada, tratamento veterinário e adoção responsável para os 60 cães que sobreviviam do aterro.",
    cat: "Resgate",
    place: "Jaboatão, PE",
    raised: 18940,
    goal: 45000,
    backers: 148,
    days: 41,
    img: "https://picsum.photos/seed/oxente-resgate/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-resgate/1600/740.jpg",
    story: [
      "No aterro da Imbiribeira, sessenta cães comiam do lixo e dormiam entre carcaças de carro. Vizinhos avisaram, a vigilância sanitária autorizou e a Oxente entrou com a captura humanizada: isco, muita paciência e nenhuma corda.",
      "Quarenta já estão em lar temporário; vinte seguem em tratamento de sarna, verminose e desnutrição num canil cedido em Jaboatão. Falta pagar o veterinário da quarta semana, a ração dos últimos quarenta dias e o transporte pra castração de todos — é pra isso que esta vaquinha corre.",
      "A adoção é responsável, com termo de guarda e visita: quem quiser conhecer os vinte que já estão prontos, o mutirão acontece no último domingo de cada mês.",
    ],
    usos: [
      { label: "Tratamento veterinário dos 60 (sarna, verminose, consultas)", valor: 21500 },
      { label: "Castração dos 60 animais", valor: 12000 },
      { label: "Ração e insumos por 40 dias", valor: 7300 },
      { label: "Captura humanizada e transporte", valor: 4200 },
    ],
    updates: [
      {
        tag: "Marco",
        iso: "2025-06-20",
        data: "20 de junho de 2025",
        titulo: "Quarenta cães em lar temporário",
        texto:
          "A primeira leva atravessou a ponte: quarenta cachorros dormindo em telhado, com comida no prato e nome novo. As fotos estão no grupo dos apoiadores.",
      },
      {
        tag: "Repasse",
        iso: "2025-06-02",
        data: "2 de junho de 2025",
        titulo: "R$ 12.400 em medicamento e consulta",
        texto:
          "O repasse pagou o primeiro mês do veterinário do canil e os medicamentos da leva mais frágil. Notas fiscais publicadas.",
      },
    ],
  }),
  mk({
    title: "Telhado novo para o Abrigo do Arraial",
    sub: "Noventa gatos resgatados estão com o telhado cedendo: goteira na baia dos filhotes, frio e umidade. A vaquinha paga a obra antes da próxima chuva.",
    cat: "Abrigo",
    place: "Recife, PE",
    raised: 9120,
    goal: 12000,
    backers: 96,
    days: 9,
    img: "https://picsum.photos/seed/oxente-abrigo/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-abrigo/1600/740.jpg",
    story: [
      "O Abrigo do Arraial cuida de noventa gatos resgatados de denúncias de maus-tratos e colônias desmontadas. Com as chuvas deste ano, o telhado cedeu: goteira na baia dos filhotes, umidade nas paredes e pneumonia passando de gato pra gato.",
      "Telha nova, manta térmica e pintura antifúngica já estão orçadas, e a obra pode sair num fim de semana de mutirão — falta o material. São nove dias de prazo e uma meta pequena pra um problema grande: é pra isso que esta vaquinha corre.",
    ],
    usos: [
      { label: "Telha colonial e manta térmica", valor: 6800 },
      { label: "Pintura antifúngica e impermeabilizante", valor: 2900 },
      { label: "40 caminhas e cobertores", valor: 2300 },
    ],
    updates: [
      {
        tag: "Marco",
        iso: "2025-06-14",
        data: "14 de junho de 2025",
        titulo: "Pneumonia controlada na baia dos filhotes",
        texto:
          "Com o antibiótico pago pela campanha, nenhum filhote precisou de internação esta semana. O veterinário volta na segunda para reavaliar.",
      },
      {
        tag: "Repasse",
        iso: "2025-06-05",
        data: "5 de junho de 2025",
        titulo: "R$ 3.100 em medicamento e areia",
        texto:
          "O primeiro repasse comprou antibióticos, antifúngicos e areia sanitária para um mês. Notas fiscais já publicadas.",
      },
    ],
  }),
  mk({
    title: "Mutirão de castração da Casa Amarela: 300 cirurgias",
    sub: "Trezentas castrações gratuitas para cães e gatos de famílias cadastradas do bairro — com microchip e acompanhamento pós-operatório.",
    cat: "Castração",
    place: "Recife, PE",
    raised: 6480,
    goal: 15000,
    backers: 122,
    days: 30,
    img: "https://picsum.photos/seed/oxente-castracao/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-castracao/1600/740.jpg",
    story: [
      "Na Casa Amarela, uma gata sem castração vira doze filhotes por ano. É matemática simples: em duas estações, uma rua inteira transborda de bichanos que ninguém pode criar.",
      "Com a Clínica Bicho de Estimação e o centro comunitário do bairro, a Oxente vai fazer trezentas castrações gratuitas para animais de famílias cadastradas — com microchip, alta monitorada e orientação de pós-operatório em casa. Falta o material cirúrgico e o aluguel das gaiolas: é pra isso que esta vaquinha corre.",
    ],
    usos: [
      { label: "Material cirúrgico e anestesia (300 cirurgias)", valor: 9600 },
      { label: "Aluguel de gaiolas de transporte (2 meses)", valor: 3200 },
      { label: "Microchips e caderneta de acompanhamento", valor: 2200 },
    ],
    updates: [
      {
        tag: "Marco",
        iso: "2025-06-10",
        data: "10 de junho de 2025",
        titulo: "Cadastramento das famílias começou",
        texto:
          "O centro comunitário já cadastrou 180 famílias para o mutirão de julho. As inscrições seguem até a véspera, enquanto durarem as vagas.",
      },
      {
        tag: "Repasse",
        iso: "2025-05-30",
        data: "30 de maio de 2025",
        titulo: "R$ 4.200 em material cirúrgico",
        texto:
          "Fios de sutura, anestésico e seringas comprados com o primeiro repasse. Notas fiscais publicadas para os apoiadores.",
      },
    ],
  }),
  mk({
    title: "Veterinário de campo: 20 cavalos de carroça",
    sub: "Casqueamento, desdentação, vermifugação e um mês de descanso com feno e ração para os cavalos de carroça da zona norte do Recife.",
    cat: "Veterinário",
    place: "Recife, PE",
    raised: 27300,
    goal: 30000,
    backers: 410,
    days: 5,
    img: "https://picsum.photos/seed/oxente-equinos/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-equinos/1600/740.jpg",
    story: [
      "Os vinte cavalos de carroça da zona norte trabalham a semana inteira e dormem onde dá. Casco rachado, dente comprido demais e verminose: o relatório da última visita veterinária não deixou dúvida.",
      "A vaquinha paga quatro rodadas de atendimento em campo: casqueamento correto, desdentação, vermifugação e um mês de descanso com feno e ração pra cada cavalo. A associação dos carroceiros já garantiu o terreiro de descanso — falta o dinheiro do veterinário: é pra isso que esta vaquinha corre.",
    ],
    usos: [
      { label: "Casqueamento e desdentação dos 20", valor: 12000 },
      { label: "Vermifugação e vacinas", valor: 4800 },
      { label: "Feno e ração por 30 dias", valor: 11700 },
      { label: "Suplemento mineral para 3 meses", valor: 1500 },
    ],
    updates: [
      {
        tag: "Marco",
        iso: "2025-06-11",
        data: "11 de junho de 2025",
        titulo: "Primeira rodada de casqueamento feita",
        texto:
          "Oito cavalos já estão com o casco tratado e ferradura nova. O ferrador volta na quinta para a segunda metade da tropa.",
      },
      {
        tag: "Repasse",
        iso: "2025-06-01",
        data: "1 de junho de 2025",
        titulo: "R$ 8.900 em feno e vermífugo",
        texto:
          "O primeiro repasse comprou dois reboques de feno e vermífugo para toda a tropa. Notas fiscais publicadas.",
      },
    ],
  }),
  mk({
    title: "Feira de adoção de Olinda: kit do adotante",
    sub: "Caixa de transporte, ração e veterinário de plantão para as quarenta adoções responsáveis do próximo trimestre no Alto da Sé.",
    cat: "Adoção",
    place: "Olinda, PE",
    raised: 3850,
    goal: 8000,
    backers: 61,
    days: 17,
    img: "https://picsum.photos/seed/oxente-adocao/640/420.jpg",
    full: "https://picsum.photos/seed/oxente-adocao/1600/740.jpg",
    story: [
      "Todo segundo sábado acontece a feira de adoção do Alto da Sé — chuva ou sol. O que falta não é gente querendo adotar: são caixas de transporte, ração pra primeira quinzena e um veterinário de plantão pra liberar cada adoção com a saúde checada.",
      "A vaquinha paga o kit de quarenta adotantes do próximo trimestre — caixa de transporte, ração, areia e pratinho — além do plantão veterinário das feiras. É pra isso que esta vaquinha corre.",
    ],
    usos: [
      { label: "40 caixas de transporte", valor: 3600 },
      { label: "Ração e areia para o primeiro mês", valor: 3200 },
      { label: "Plantão veterinário das feiras (3 meses)", valor: 1200 },
    ],
    updates: [
      {
        tag: "Marco",
        iso: "2025-06-08",
        data: "8 de junho de 2025",
        titulo: "Junho terminou com 12 adoções",
        texto:
          "A feira do segundo sábado terminou com doze famílias indo pra casa com um novo membro de quatro patas. As fotos estão no Instagram da Oxente.",
      },
      {
        tag: "Repasse",
        iso: "2025-05-25",
        data: "25 de maio de 2025",
        titulo: "R$ 1.800 em caixas de transporte",
        texto:
          "Vinte caixas novas compradas com o primeiro repasse, já emprestadas para as adoções de junho. Notas fiscais publicadas.",
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
