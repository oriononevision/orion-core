-- Privileges API (authenticated / service_role) — sans ça PostgREST renvoie
-- "permission denied for table …" et les Edge Functions répondent 500.

grant usage on schema public to anon, authenticated, service_role;

grant select, delete on table public.user_connections to authenticated;
grant all on table public.user_connections to service_role;

grant select, insert, update, delete on table public.connector_definitions to authenticated;
grant all on table public.connector_definitions to service_role;

grant all on table public.oauth_states to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;
