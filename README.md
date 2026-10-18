# Oxente — Plataforma de Vaquinhas do PAADA

Plataforma de vaquinhas onde cada causa tem sua página: o doador escolhe o valor, paga por Pix, cartão ou boleto e acompanha cada real virando história, com atualizações publicadas pelos organizadores.

> Protótipo funcional: os dados das campanhas são **seed em memória** (sem backend/banco ainda) e as doações são simuladas no cliente.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- CSS próprio (`app/globals.css`) — sem Tailwind
- [Phosphor Icons](https://phosphoricons.com) (`@phosphor-icons/web`)
- Fontes: Bricolage Grotesque, Fraunces e Instrument Sans (Google Fonts)

## Rodando localmente

Requisitos: Node.js 20.9+ e npm.

```bash
npm install
npm run dev      # servidor de desenvolvimento em http://localhost:3000
```

Outros scripts:

```bash
npm run build    # build de produção
npm run start    # serve o build de produção
npm run lint     # ESLint
```

## Páginas

| Rota | Descrição |
| --- | --- |
| `/` | Home: hero, ticker de doações, lista de vaquinhas, como funciona e parceiros |
| `/vaquinha/[slug]` | Página da campanha: história, para onde vai o dinheiro, atualizações e modal de doação |
| `/como-ajudar` | Formas de apoiar além da doação |
| `/parcerias` | Empresas e parceiros |
| `/sugestoes` | Canal de sugestões |
| `/sobre` | Sobre o PAADA e o projeto |
| `/admin` | Construtor de campanhas (modelos Imersiva, Lado a lado, Centralizada e Sólida) com preview |

## Estrutura

```
app/                  # rotas (App Router) e layout raiz
components/
  home/               # seções da home (Hero, Ticker, VaquinhaSection…)
  vaquinha/           # CampaignDetail e DonateModal
  admin/              # Builder e BuilderPreview de campanhas
  layout/             # Navbar, Footer, AdminBar e efeitos de scroll
  fx/                 # ToastProvider
  shared/ ui/         # componentes reutilizáveis
lib/
  campaigns.ts        # tipos, utilidades (BRL, slug, pct) e seed de campanhas
  CampaignsProvider.tsx  # contexto global: lista campanhas, doação e criação
```

## Estado atual

- Campanhas vêm de `SEED_CAMPAIGNS` (`lib/campaigns.ts`) e vivem em memória via `CampaignsProvider` — nada persiste entre reloads.
- Doação incrementa `raised`/`backers` no cliente (sem pagamento real).
- Campanhas criadas no `/admin` entram na lista em tempo de execução.

## Próximos passos sugeridos

- Backend + banco para campanhas, doações e atualizações
- Integração de pagamento (Pix, cartão, boleto)
- Autenticação para o painel `/admin`
