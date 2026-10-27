-- Connexions OAuth / IMAP par utilisateur (tokens chiffrés côté Edge avant insert)

create table if not exists public.user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  account_label text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'connected'
    check (status in ('connected', 'pending_sync', 'error', 'revoked')),
  items_synced integer default 0,
  last_sync timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists user_connections_user_id_idx
  on public.user_connections (user_id);

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  redirect_to text,
  created_at timestamptz not null default now()
);

create index if not exists oauth_states_created_at_idx
  on public.oauth_states (created_at);

alter table public.user_connections enable row level security;
alter table public.oauth_states enable row level security;

drop policy if exists "users read own connections" on public.user_connections;
create policy "users read own connections"
  on public.user_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users delete own connections" on public.user_connections;
create policy "users delete own connections"
  on public.user_connections
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Insert/update réservés au service role (Edge Functions)
-- Pas de policy insert/update pour authenticated

drop policy if exists "users manage own oauth states" on public.oauth_states;
-- oauth_states : uniquement service role (Edge)

comment on table public.user_connections is
  'Tokens OAuth/IMAP chiffrés (AES-GCM) par l’Edge ; le client lit status/meta sans secrets.';
