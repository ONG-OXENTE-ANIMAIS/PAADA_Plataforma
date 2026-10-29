# PAADA Plataforma

Plataforma de vaquinhas/campanhas de arrecadacao com backend completo (Next.js 15 + Supabase + Efi/Pix).

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind v4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Storage + Auth)
- **Pagamentos**: Efi / Banco Efí (Pix via Cobrança Imediata) com confirmação por webhook (validacao servidor-a-servidor na API do Efi).
- **Admin**: Painel próprio (`/admin`) com login, dashboard, CRUD de campanhas/doações/parceiros/contato/usuários

## Estrutura

```
app/
  api/                    # 23 rotas REST (doações, campanhas, usuários, parceiros, contato, pagamentos, auth)
  admin/                  # Painel administrativo (Server + Client Components)
  vaquinha/[slug]/        # Página pública da campanha
components/
  vaquinha/               # CampaignDetail, DonateModal
  admin/                  # Componentes do painel
  ui/, shared/, fx/, layout/, home/
services/                 # Regras de negócio (5 services)
repositories/             # Acesso a dados (5 repos, Supabase admin client)
lib/
  payments/efi.ts # Criacao cobranca Pix + consulta + confirmacao via webhook
  auth/session.ts         # Cookies assinadas (iron-session)
  api/                    # Helpers: response, request, rate-limit, pagination
supabase/migrations/      # 13 migrations (schema + functions + adaptação)
types/database.types.ts   # Tipos TypeScript do schema
```

## Fluxo de Doação

```
1. Usuário clica "Doar" no CampaignDetail
2. DonateModal POST /api/doacoes → doacoesService.create()
   - Valida campanha ATIVA, visível, não encerrada
   - Cria doação PENDENTE + txid único
   - Cria cobrança Pix no Efi → checkout_url (QR code / copia e cola)
3. Pagar o QR code Pix (ambiente Efi) ou voltar para a campanha
4. Webhook POST /api/pagamentos/efi/webhook
   - Consulta cobrança no Efi (servidor-a-servidor, sem confiar na notificação)
   - Se CONCLUIDA → doacoesService.confirm() → RPC confirmar_doacao()
     - Idempotente: ignora se já PAGA com mesmo payment_id
     - Atualiza campanha.valor_arrecadado atomicamente
5. Usuário retorna para /vaquinha/[slug]?doacao=ID&token=TOKEN
   - Frontend consulta status via doacoesService.getPublic()
   - Exibe toast de confirmação
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (admin/server) |
| `SUPABASE_STORAGE_BUCKET` | Bucket para imagens (default: `campanhas`) |
| `EFI_CLIENT_ID` | Client ID OAuth da aplicação Efi |
| `EFI_CLIENT_SECRET` | Client Secret OAuth da aplicação Efi |
| `EFI_PIX_KEY` | Chave Pix cadastrada na Efi (CNPJ, CPF, e-mail, telefone ou aleatória) |
| `EFI_SANDBOX` | `true` (sandbox) ou `false` (produção), default `true` |
| `NEXT_PUBLIC_APP_URL` | URL base (dev: `http://localhost:3000`) |
| `AUTH_SECRET` | Secret para cookies (gere: `openssl rand -base64 32`) |

## Setup Local

```bash
# 1. Dependências
npm install

# 2. Variáveis
cp .env.example .env
# edite .env

# 3. Supabase (opção A: CLI)
supabase link --project-ref SEU_REF
supabase db push

#    (opção B: SQL Editor no Dashboard)
#    Rode migrations em supabase/migrations/ na ordem: 0001 → 0013

# 4. Bucket Storage
# SQL Editor: INSERT INTO storage.buckets (id, name, public) VALUES ('campanhas', 'campanhas', true);

# 5. Dev
npm run dev
```

## Próximos Passos (Produção)

### ✅ Já Feito
- [x] Schema completo (9 tabelas + 2 enums)
- [x] Functions financeiras idempotentes (`confirmar_doacao`, `definir_status_doacao`)
- [x] Rate limit no banco (`consumir_rate_limit`)
- [x] Migrations adaptadas para schema existente (0003)
- [x] API routes + services + repositories
- [x] Frontend público (CampaignDetail, DonateModal)
- [x] Admin panel (login, dashboard, CRUDs)
- [x] Webhook Efi com confirmação via API (servidor-a-servidor)
- [x] `.env.example`

### 🔧 Pendentes para Deploy

#### 1. Supabase Production
- [ ] Aplicar migrations no projeto de produção (`supabase db push` ou SQL Editor)
- [ ] Criar bucket `campanhas` (público)
- [ ] Configurar RLS policies se necessário (atualmente usa service_role no server)

#### 2. Efi (Pix)

- [ ] Criar aplicação no portal de desenvolvedor Efi e obter `EFI_CLIENT_ID` / `EFI_CLIENT_SECRET`
- [ ] Cadastrar a `EFI_PIX_KEY` da ONG na Efi
- [ ] Definir `EFI_SANDBOX=false` para produção
- [ ] Configurar webhook: `https://SEU_DOMINIO.com/api/pagamentos/efi/webhook`
- [ ] Eventos de cobrança imediata (status `CONCLUIDA`)

#### 3. Deploy (Vercel recomendado)
- [ ] Conectar repo na Vercel
- [ ] Adicionar todas as variáveis de `.env` no painel Vercel (Environment Variables)
- [ ] `NEXT_PUBLIC_APP_URL` = URL de produção
- [ ] Deploy

#### 4. Pós-Deploy
- [ ] Testar doação ponta-a-ponta (Pix teste)
- [ ] Verificar webhook recebido (logs Vercel + MP)
- [ ] Confirmar atualização de `valor_arrecadado` na campanha
- [ ] Testar admin panel (login, listar/editar campanhas, doações, parceiros)

#### 5. Opcionais / Melhorias
- [ ] Emails transacionais (Resend/SendGrid) para comprovantes
- [ ] Logs estruturados (Sentry, Logtail)
- [ ] Testes E2E (Playwright) fluxo doação
- [ ] Cache ISR para páginas públicas de campanha
- [ ] SEO: sitemap.xml, robots.txt
- [ ] LGPD: termo de uso, política privacidade, exportação/deleção dados

## Scripts Úteis

```bash
npm run dev          # Desenvolvimento (Turbopack)
npm run build        # Build produção
npm run start        # Servidor produção
npm run lint         # ESLint
npm run test         # Vitest (unit/integration)
```

## Licença

MIT