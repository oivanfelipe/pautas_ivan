-- Pautas: migração inicial (aditiva).
-- Projeto Supabase compartilhado (task-chat): só cria objetos com prefixo pautas_.
-- Nenhuma tabela existente é lida, alterada ou removida.
-- Especificação: docs/blueprint/05-backend-schema.md

begin;

-- 1. Credenciais do Google (acesso só pelo servidor, com a chave de serviço) ---------------
create table public.pautas_google_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_enc text not null,
  scopes text,
  needs_reconnect boolean not null default false,
  last_sync_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 2. Reuniões (uma linha por ocorrência) ---------------------------------------------------
create table public.pautas_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  google_event_id text not null,
  recurring_event_id text,
  title text not null default '(sem título)',
  title_key text generated always as (lower(btrim(title))) stored,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meet_url text,
  attendees_count int not null default 0,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  notes text not null default '',
  notes_updated_at timestamptz not null default now(),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, google_event_id)
);

create index pautas_meetings_user_starts_idx
  on public.pautas_meetings (user_id, starts_at);
create index pautas_meetings_user_title_idx
  on public.pautas_meetings (user_id, title_key, starts_at);

-- 3. Itens do checklist ---------------------------------------------------------------------
create table public.pautas_checklist_items (
  id uuid primary key,  -- gerado no cliente, para criar itens sem rede
  meeting_id uuid not null references public.pautas_meetings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position numeric not null,
  updated_at timestamptz not null default now()
);

create index pautas_checklist_items_meeting_idx
  on public.pautas_checklist_items (meeting_id, position);

-- 4. Modelo de itens fixos (vale para toda reunião com o mesmo title_key) --------------------
create table public.pautas_template_items (
  id uuid primary key,  -- gerado no cliente
  user_id uuid not null references auth.users (id) on delete cascade,
  title_key text not null,
  text text not null,
  position numeric not null,
  updated_at timestamptz not null default now()
);

create index pautas_template_items_user_title_idx
  on public.pautas_template_items (user_id, title_key, position);

-- 5. RLS ---------------------------------------------------------------------------------------
alter table public.pautas_google_accounts enable row level security;
alter table public.pautas_meetings enable row level security;
alter table public.pautas_checklist_items enable row level security;
alter table public.pautas_template_items enable row level security;

-- google_accounts: nenhuma política = nenhum acesso pelo cliente.

create policy pautas_meetings_select on public.pautas_meetings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy pautas_meetings_update on public.pautas_meetings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy pautas_checklist_select on public.pautas_checklist_items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy pautas_checklist_insert on public.pautas_checklist_items
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.pautas_meetings m
      where m.id = meeting_id and m.user_id = (select auth.uid())
    )
  );

create policy pautas_checklist_update on public.pautas_checklist_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.pautas_meetings m
      where m.id = meeting_id and m.user_id = (select auth.uid())
    )
  );

create policy pautas_checklist_delete on public.pautas_checklist_items
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy pautas_template_select on public.pautas_template_items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy pautas_template_insert on public.pautas_template_items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy pautas_template_update on public.pautas_template_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy pautas_template_delete on public.pautas_template_items
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- 6. Privilégios -------------------------------------------------------------------------------
-- Parte do zero: nada para anon; o cliente logado recebe só o necessário.
revoke all on public.pautas_google_accounts from anon, authenticated;
revoke all on public.pautas_meetings from anon, authenticated;
revoke all on public.pautas_checklist_items from anon, authenticated;
revoke all on public.pautas_template_items from anon, authenticated;

-- Reuniões: o cliente lê tudo e só edita as anotações (reuniões nascem no sync, no servidor).
grant select on public.pautas_meetings to authenticated;
grant update (notes, notes_updated_at) on public.pautas_meetings to authenticated;

grant select, insert, update, delete on public.pautas_checklist_items to authenticated;
grant select, insert, update, delete on public.pautas_template_items to authenticated;

-- O servidor (chave de serviço) ignora RLS, mas precisa de privilégios nas tabelas.
grant all on public.pautas_google_accounts to service_role;
grant all on public.pautas_meetings to service_role;
grant all on public.pautas_checklist_items to service_role;
grant all on public.pautas_template_items to service_role;

commit;
