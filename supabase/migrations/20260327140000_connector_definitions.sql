-- Registry de connecteurs dynamiques (lien produit + OAuth)

create table if not exists public.connector_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  product_url text not null,
  logo_url text,
  category text not null default 'productivite',
  authorize_url text not null,
  token_url text not null,
  client_id text not null,
  client_secret_enc text not null,
  scopes text not null default '',
  token_auth text not null default 'body'
    check (token_auth in ('body', 'basic')),
  userinfo_url text,
  visibility text not null default 'private'
    check (visibility in ('private', 'org', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connector_definitions_owner_idx
  on public.connector_definitions (owner_user_id);

create index if not exists connector_definitions_visibility_idx
  on public.connector_definitions (visibility);

alter table public.connector_definitions enable row level security;

drop policy if exists "read own or public connectors" on public.connector_definitions;
create policy "read own or public connectors"
  on public.connector_definitions
  for select
  to authenticated
  using (
    visibility = 'public'
    or owner_user_id = auth.uid()
  );

drop policy if exists "insert own connectors" on public.connector_definitions;
create policy "insert own connectors"
  on public.connector_definitions
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "update own connectors" on public.connector_definitions;
create policy "update own connectors"
  on public.connector_definitions
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists "delete own connectors" on public.connector_definitions;
create policy "delete own connectors"
  on public.connector_definitions
  for delete
  to authenticated
  using (owner_user_id = auth.uid());

comment on table public.connector_definitions is
  'Connecteurs OAuth ajoutés via lien produit ; secret chiffré côté Edge.';
