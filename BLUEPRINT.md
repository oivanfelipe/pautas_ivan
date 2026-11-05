# Blueprint: Pautas (app de anotações para reuniões)

> Uso pessoal, mobile-first. Next.js + Supabase + Vercel, instalado como PWA.
> Status: planejamento. Nenhum código escrito ainda.

## 1. Objetivo e princípio de design

**Problema:** chego nas reuniões sem ter anotado o que preciso falar.

**Solução:** o app lê minha agenda Google da semana e cria uma **pauta vazia** para cada reunião. Eu só preencho: anotações e checklist. Na reunião, marco os itens.

**Regra de ouro:** abrir o app, tocar na reunião e já estar digitando. Menos de 2 toques até o cursor no campo.

**Fora de escopo:** criar ou editar eventos na agenda, IA gerando pauta, multiusuário/times, notificações.

## 2. Fluxos principais

| # | Fluxo | Resultado |
|---|-------|-----------|
| 1 | Login com Google (autoriza Agenda somente leitura) | Sessão + refresh token guardado |
| 2 | Abrir app → tela **Semana** | Reuniões agrupadas por dia, com selo de "pauta vazia / com itens (3/5)" |
| 3 | Tocar numa reunião → **Pauta** | Campo de anotações + checklist, auto-save |
| 4 | **Modo Reunião** (botão na pauta ou na reunião em andamento) | Tela limpa: título, checklist grande, check com 1 toque |
| 5 | Sincronizar | Puxa a semana de novo (ao abrir, pull-to-refresh, e diário automático) |

## 3. Telas (mobile primeiro)

1. **Semana**: lista por dia (hoje no topo e destacado). Cartão: horário, título, selo de progresso. Reunião em andamento ganha destaque e atalho para o Modo Reunião.
2. **Pauta da reunião**: cabeçalho (título, horário, link Meet), checklist (adicionar com Enter, arrastar para reordenar), anotações livres abaixo.
3. **Modo Reunião**: só checklist grande + notas rápidas, tela sempre ligada (Wake Lock), itens concluídos vão para o fim.
4. **Config**: conta, sincronizar agora, janela de dias (padrão 7), sair.

Desktop (fase 2): layout em duas colunas (lista à esquerda, pauta à direita), mesmo código.

## 4. Arquitetura

```
PWA (Next.js App Router, Tailwind)
   │  Supabase JS (sessão + dados, com RLS)
   ▼
Supabase: Auth (Google) · Postgres · Edge/Route Handlers
   │  refresh token do Google (criptografado)
   ▼
Google Calendar API (events.list, calendar.readonly)

Deploy: Vercel (Next.js)  ·  Banco/Auth: Supabase
```

- **Sync roda no servidor** (Route Handler `/api/sync`), nunca no cliente, para usar o refresh token com segurança.
- **Offline:** o app guarda a última semana em cache (service worker + IndexedDB). Edições offline entram numa fila e sobem ao reconectar. Para uso em reunião, isso é obrigatório (sinal ruim).

## 5. Modelo de dados (Postgres)

```sql
-- 1 linha por usuário: credenciais Google
google_accounts (
  user_id uuid pk references auth.users,
  refresh_token_enc text not null,      -- criptografado (Supabase Vault / pgcrypto)
  scopes text, updated_at timestamptz
)

meetings (
  id uuid pk default gen_random_uuid(),
  user_id uuid not null references auth.users,
  google_event_id text not null,        -- id da INSTÂNCIA (singleEvents=true)
  title text, starts_at timestamptz, ends_at timestamptz,
  meet_url text, status text,           -- confirmed | cancelled
  synced_at timestamptz,
  unique (user_id, google_event_id)
)

notes (
  meeting_id uuid pk references meetings on delete cascade,
  user_id uuid not null, body text default '', updated_at timestamptz
)

checklist_items (
  id uuid pk default gen_random_uuid(),
  meeting_id uuid references meetings on delete cascade,
  user_id uuid not null,
  text text not null, done boolean default false,
  position int not null, updated_at timestamptz
)
```

- **RLS em todas as tabelas:** `user_id = auth.uid()`.
- **Sync é upsert por `(user_id, google_event_id)`:** nunca apaga pauta. Evento cancelado ou removido vira `status = cancelled` e continua visível, para eu não perder o que escrevi.
- **Reuniões recorrentes** (ex.: Daily): usar `singleEvents=true`, então cada dia é uma instância com pauta própria. Opcional na fase 2: "copiar itens pendentes da última ocorrência".

## 6. Integração Google (pontos que costumam dar errado)

1. **Escopo:** `https://www.googleapis.com/auth/calendar.readonly` (+ openid/email/profile).
2. **Refresh token:** o Supabase Auth não guarda o refresh token do Google. Pedir `access_type=offline` e `prompt=consent` no login, capturar `provider_refresh_token` no callback e salvar (criptografado) em `google_accounts`.
3. **Tela de consentimento OAuth:** em modo *Testing*, o refresh token **expira em 7 dias**. Para uso pessoal, publicar o app como *In production* (aparece o aviso "app não verificado", mas funciona sem passar por verificação do Google para uso próprio). Decisão a tomar antes do build.
4. **Chamada:** `events.list` com `timeMin = início da semana`, `timeMax = +7 dias`, `singleEvents=true`, `orderBy=startTime`. Ignorar eventos de dia inteiro sem horário e os que recusei (`responseStatus = declined`).
5. **Calendários:** começar só com o principal. Seleção de múltiplas agendas fica para a fase 2.

## 7. Stack e estrutura de pastas

- Next.js (App Router) + TypeScript + Tailwind, `@supabase/ssr`, `serwist` ou `next-pwa` para PWA.
- Estado/cache: TanStack Query + persistência em IndexedDB.

```
/app
  /(auth)/login
  /(app)/semana          # tela Semana
  /(app)/reuniao/[id]    # Pauta
  /(app)/reuniao/[id]/ao-vivo   # Modo Reunião
  /api/sync              # puxa Google → upsert no Supabase
  /auth/callback         # captura provider_refresh_token
/components  /lib/supabase  /lib/google  /supabase/migrations
```

## 8. Fases de entrega

| Fase | Entrega | Pronto quando |
|------|---------|---------------|
| **0. Fundação** | Repo, projeto Supabase, Google Cloud OAuth, deploy na Vercel, PWA instalável | "Hello" instalado no meu celular com login Google funcionando |
| **1. MVP (mobile)** | Sync da semana, tela Semana, Pauta com notas + checklist, auto-save, RLS | Uso numa semana real de reuniões |
| **2. Modo Reunião + offline** | Tela de reunião ao vivo, Wake Lock, cache offline e fila de edição | Funciona em avião sem perder dado |
| **3. Desktop** | Layout em duas colunas, atalhos de teclado | Uso no notebook confortável |
| **4. Sobreposição** | Document Picture-in-Picture (Chrome desktop) com o checklist flutuante | Checklist visível sobre o Meet |
| **5. Extras** | Copiar pendências da ocorrência anterior, múltiplas agendas, widget/notificação "reunião em 10 min" | Conforme necessidade |

**Sobre a sobreposição:** no desktop (Chrome) dá com a Document Picture-in-Picture API. No celular, PWA não consegue desenhar por cima de outros apps, então o equivalente é o Modo Reunião em tela cheia, e no iOS/Android com Meet aberto o jeito é alternar de app ou usar tela dividida. Por isso ficou na fase 4.

## 9. Riscos e decisões em aberto

| Item | Risco | Proposta |
|------|-------|----------|
| Refresh token expirando | Sync para de funcionar depois de 7 dias | Publicar OAuth em produção (seção 6.3) |
| Segurança do token | Vazamento dá leitura da agenda | Criptografar, só acessar server-side, escopo read-only |
| Sinal ruim em reunião | Perder anotação | Offline-first na fase 2 (considerar antecipar) |
| Metodologia "vibecoding blue" | Não encontrei o documento | **Pendente:** ajustar este blueprint ao seu padrão assim que eu tiver o texto |

## 10. Próximo passo

Aprovando este blueprint, executo a **Fase 0** e entrego o PWA vazio instalado, com login Google. Para isso preciso que você crie ou me confirme:
1. Projeto Supabase (posso criar um novo na sua conta já conectada).
2. Credencial OAuth no Google Cloud (eu te passo o passo a passo e as URLs de callback).
3. Nome do app/domínio na Vercel.
