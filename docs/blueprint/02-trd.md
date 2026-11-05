# TRD — Documento de Requisitos Técnicos

## Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, instalado como PWA (service worker com `serwist`). Estado e cache com TanStack Query, persistido em IndexedDB para uso offline. Arrastar-e-soltar com `dnd-kit`.
- **Backend:** Route Handlers do Next.js (`/api/sync`, `/auth/callback`), rodando na Vercel. Sem servidor separado.
- **Banco de dados:** Supabase Postgres, projeto existente **`task-chat`** (ref `lbqmanwfgnhugjefluzy`, região `sa-east-1`), com RLS em todas as tabelas do Pautas.
- **Autenticação:** Supabase Auth com provedor Google.
- **Hospedagem:** Vercel, subdomínio `pautas-ivan.vercel.app`, deploy automático a partir do repositório `oivanfelipe/pautas_ivan`.

## Ferramentas e serviços externos
| Serviço | Para quê | Por que |
|---|---|---|
| Google OAuth 2.0 | Login do Ivan | Pedido do próprio usuário: entrar com a conta Google |
| Google Calendar API (`events.list`) | Ler a agenda da semana | Única fonte dos eventos; escopo somente leitura `calendar.readonly` |
| Supabase (Auth + Postgres) | Sessão e dados | Já conectado à conta do Ivan; RLS resolve segurança por usuário |
| Vercel | Hospedagem e deploy | Já conectada; preview por PR |
| Vercel Cron | Sync diário automático | Evita depender de abrir o app para ter a semana pronta |

## Restrições técnicas e decisões já tomadas
1. **Escopo Google:** `openid`, `email`, `profile` e `https://www.googleapis.com/auth/calendar.readonly`. O app nunca escreve na agenda.
2. **Conta Google: `ivan.felipe@v4company.com` (Google Workspace da V4).** O projeto no Google Cloud é criado nessa conta, dentro da organização da V4, e o app OAuth é do tipo **Interno**: sem aviso "app não verificado", sem publicação e sem expiração de 7 dias do refresh token. Dependência: o administrador do Workspace da V4 não pode bloquear apps internos nem o escopo `calendar.readonly`. **Plano B**, se for bloqueado: projeto na conta pessoal, tipo Externo e *In production*, com o aviso de app não verificado.
3. **Refresh token:** o Supabase Auth não o guarda. O login pede `access_type=offline` e `prompt=consent`, o callback captura `provider_refresh_token` e o grava criptografado em tabela própria. Só o servidor lê esse token, nunca o navegador.
4. **Sync sempre no servidor** (`/api/sync`), nunca no cliente. Recebe o intervalo de datas visível (dia, semana ou mês) e faz upsert das reuniões desse intervalo. O cron diário cobre de 7 dias atrás até 30 dias à frente e usa um segredo (`CRON_SECRET`) e a chave de serviço do Supabase. Períodos já sincronizados ficam em cache no cliente, então navegar para um mês já visto não exige rede.
5. **Projeto Supabase compartilhado com outros apps.** Já existem tabelas de outros projetos, inclusive `google_oauth_tokens` e `meeting_summaries`. Para não colidir:
   - Todas as tabelas do Pautas levam o prefixo **`pautas_`** (ex.: `pautas_meetings`) e ficam em `public`.
   - O Pautas **não reutiliza nem altera** nenhuma tabela existente.
   - Toda migração é aditiva, aplicada por arquivo em `supabase/migrations/`.
6. **Atenção, achado no projeto `task-chat`:** as tabelas `settings` e `daily_items` estão com **RLS desligado**, ou seja, abertas a qualquer pessoa com a chave anon. Não são do Pautas e eu não vou mexer nelas sem você pedir. Vale decidir se quer ativar RLS nelas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), porque ativar sem políticas bloqueia o acesso do app que as usa.
7. **Login compartilhado:** como o projeto já tem usuários de outro app, qualquer pessoa que fizer login Google no mesmo projeto vira um usuário. As políticas RLS do Pautas filtram por `user_id = auth.uid()`, então os dados não vazam entre usuários.
8. **Offline-first no cliente:** leitura e escrita da última semana funcionam sem rede; as edições entram numa fila e sobem ao reconectar. Em conflito, vale a edição mais recente (`updated_at`).
9. **Sem segredo no cliente:** o navegador só recebe a URL e a chave `anon` do Supabase. Chave de serviço, segredo do cliente Google e `CRON_SECRET` ficam apenas em variáveis de ambiente da Vercel.
10. **Criptografia do refresh token:** feita no servidor da aplicação (AES-256-GCM) com a chave `TOKEN_ENCRYPTION_KEY` guardada só na Vercel. O banco armazena apenas o texto cifrado e nunca tem acesso à chave.

## Ambientes
- **Local:** `next dev` no notebook, apontando para o mesmo projeto Supabase (não há banco de desenvolvimento separado).
- **Preview:** deploy da Vercel por Pull Request, para testar no celular antes do merge. Usa o mesmo Supabase, então testes devem usar a conta do próprio Ivan.
- **Produção:** `pautas-ivan.vercel.app`, branch `main`.
- **URLs de callback** a cadastrar no Google Cloud e no Supabase: `http://localhost:3000/auth/callback`, a URL de produção e o padrão de preview da Vercel.

## Variáveis de ambiente
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`.

## Pendências
- Ivan criar o cliente OAuth no Google Cloud com a conta da V4 (passo a passo na conversa) e informar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` pelo cofre da Vercel, não pelo chat.
- Decidir se quer corrigir o RLS desligado em `settings` e `daily_items` (fora do escopo do Pautas).
