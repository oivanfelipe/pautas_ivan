# Esquema de Backend

> Banco: Supabase Postgres, projeto `task-chat` (compartilhado com outros apps). Todas as tabelas do Pautas usam o prefixo `pautas_` e não tocam nas tabelas existentes. Este documento é a especificação; a migração só é aplicada na Fase 0.

## Fluxo de autenticação
1. O Ivan toca em "Entrar com Google". O app chama o Supabase Auth com o provedor Google, escopos `openid email profile https://www.googleapis.com/auth/calendar.readonly`, `access_type=offline` e `prompt=consent`.
2. O Google devolve ao `/auth/callback`. O servidor troca o código por sessão Supabase e captura o `provider_refresh_token`.
3. O servidor **criptografa o refresh token no próprio servidor** (AES-256-GCM, chave `TOKEN_ENCRYPTION_KEY` guardada só na Vercel) e grava em `pautas_google_accounts`. O banco nunca vê a chave.
4. O `/api/sync` usa o refresh token para obter um access token do Google a cada execução (nada de access token guardado).
5. Se o Google responder `invalid_grant` (acesso revogado), o servidor marca `needs_reconnect = true` e a Agenda mostra "Reconecte sua conta Google".
6. Há um único perfil de usuário (o Ivan). Como o projeto Supabase é compartilhado, outras contas podem existir; o isolamento é feito pelo RLS.

## Tabelas

### pautas_google_accounts
Credenciais do Google. **Sem acesso pelo cliente**: só o servidor (chave de serviço) lê e escreve.
| Coluna | Tipo | Descrição |
|---|---|---|
| user_id | uuid, PK, FK → auth.users, on delete cascade | Dono |
| refresh_token_enc | text, not null | Refresh token criptografado pelo servidor |
| scopes | text | Escopos concedidos |
| needs_reconnect | boolean, default false | Acesso revogado ou token inválido |
| last_sync_at | timestamptz | Última sincronização concluída |
| updated_at | timestamptz, default now() | |

### pautas_meetings
Uma linha por reunião (por ocorrência, no caso de recorrentes).
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid, PK, default gen_random_uuid() | |
| user_id | uuid, not null, FK → auth.users, on delete cascade | Dono |
| google_event_id | text, not null | Id da ocorrência na API do Google (`singleEvents=true`) |
| recurring_event_id | text, null | Id da série no Google, se for recorrente |
| title | text, not null, default '(sem título)' | Título do evento |
| title_key | text, generated always as (lower(btrim(title))) stored | Chave que liga reuniões do mesmo título (modelo e pendências) |
| starts_at | timestamptz, not null | |
| ends_at | timestamptz, not null | |
| meet_url | text, null | Link de videochamada |
| attendees_count | int, not null, default 0 | Participantes além do Ivan |
| status | text, not null, default 'confirmed' | `confirmed` ou `cancelled` |
| notes | text, not null, default '' | Anotações livres da Pauta (inclui as notas rápidas do Modo Reunião) |
| notes_updated_at | timestamptz, not null, default now() | Para resolver conflito offline |
| synced_at | timestamptz | Última vez que o evento veio do Google |
| created_at | timestamptz, default now() | |

Restrições e índices: `unique (user_id, google_event_id)`; índice em `(user_id, starts_at)`; índice em `(user_id, title_key, starts_at)`.

### pautas_checklist_items
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid, PK | **Gerado no cliente**, para criar itens sem rede |
| meeting_id | uuid, not null, FK → pautas_meetings, on delete cascade | |
| user_id | uuid, not null, FK → auth.users, on delete cascade | Dono |
| text | text, not null | Texto do item |
| done | boolean, not null, default false | Marcado |
| position | numeric, not null | Ordem; valor fracionário entre vizinhos para reordenar sem reescrever a lista |
| updated_at | timestamptz, not null, default now() | Resolve conflito offline |

Índice em `(meeting_id, position)`.

### pautas_template_items
Modelo de itens fixos. Vale para toda reunião com o mesmo `title_key` do usuário (decisão do Ivan: vale também para reuniões diferentes com o mesmo título).
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid, PK | Gerado no cliente |
| user_id | uuid, not null, FK → auth.users, on delete cascade | Dono |
| title_key | text, not null | Mesmo valor de `pautas_meetings.title_key` |
| text | text, not null | Texto do item fixo |
| position | numeric, not null | Ordem |
| updated_at | timestamptz, not null, default now() | |

Índice em `(user_id, title_key, position)`.

## Relacionamentos
- `auth.users` 1—1 `pautas_google_accounts`.
- `auth.users` 1—N `pautas_meetings`; `pautas_meetings` 1—N `pautas_checklist_items`.
- `auth.users` 1—N `pautas_template_items`.
- Reuniões e modelo se ligam por **`title_key`**, não por chave estrangeira: assim o modelo continua valendo mesmo sem nenhuma reunião cadastrada e para eventos distintos com o mesmo título.
- "Reunião anterior" = a reunião de maior `starts_at` menor que a atual, do mesmo usuário e mesmo `title_key`.

## Regras de negócio no banco e no servidor
1. **Sync (servidor):** faz upsert por `(user_id, google_event_id)` atualizando **só** os campos vindos do Google (`title`, `starts_at`, `ends_at`, `meet_url`, `attendees_count`, `status`, `recurring_event_id`, `synced_at`). `notes` e itens do checklist nunca são tocados.
2. **Filtro do sync:** só entram eventos com pelo menos 1 outro participante, com horário (não de dia inteiro) e que o Ivan não recusou.
3. **Evento removido/cancelado no Google:** vira `status = 'cancelled'`. Nenhuma linha é apagada; o histórico é guardado sem prazo (decisão do Ivan).
4. **Pauta nova a partir do modelo:** quando uma reunião é criada pelo sync e existem `pautas_template_items` com o mesmo `title_key`, o servidor copia esses itens para `pautas_checklist_items` (uma vez, no momento da criação). Mudar o modelo depois não altera pautas já criadas.
5. **Trazer pendências da anterior:** ação do usuário; copia os itens `done = false` da reunião anterior que ainda não existam (mesmo `text`) na atual.
6. **Conflito offline:** vale a edição mais recente. Escritas usam `insert ... on conflict (id) do update ... where excluded.updated_at > tabela.updated_at`. Para `notes`, vale `notes_updated_at`.
7. **Exclusão de item:** exclusão definitiva (`delete`); a fila offline reenvia a exclusão se necessário.

## Regras de acesso aos dados (RLS)
RLS **ativado em todas as tabelas `pautas_*`**.

| Tabela | Cliente (usuário logado) | Servidor (chave de serviço) |
|---|---|---|
| pautas_google_accounts | **Nenhum acesso** (RLS ligado, sem política) | Ler e escrever |
| pautas_meetings | `select` e `update` apenas de `notes` e `notes_updated_at`, onde `user_id = auth.uid()`. Sem `insert` nem `delete` | Tudo (sync) |
| pautas_checklist_items | `select`, `insert`, `update`, `delete` onde `user_id = auth.uid()` e a reunião pertence ao mesmo usuário | Tudo |
| pautas_template_items | `select`, `insert`, `update`, `delete` onde `user_id = auth.uid()` | Tudo |

Detalhes:
- Políticas `using (user_id = auth.uid())` e `with check (user_id = auth.uid())`.
- Em `pautas_checklist_items`, o `with check` também exige `exists (select 1 from pautas_meetings m where m.id = meeting_id and m.user_id = auth.uid())`, para que ninguém anexe itens à reunião de outro usuário.
- O cliente nunca cria nem apaga reuniões: elas só nascem do sync, que roda no servidor.
- A chave de serviço nunca vai para o navegador.

## Pendências
- Nenhuma. Duas decisões foram minhas: criptografar o token no servidor em vez de no banco (mais seguro, e nenhum acesso ao Vault) e guardar as notas dentro de `pautas_meetings` em vez de numa tabela à parte (menos junções, sync offline mais simples).
- A interpretação de "vale" na pergunta do modelo foi: vale também para reuniões diferentes com o mesmo título. Se for só por evento recorrente, basta trocar `title_key` por `recurring_event_id`.
