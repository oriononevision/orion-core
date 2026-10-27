# Déployer le pont OAuth / IMAP

## 1. Migration SQL

Dans le SQL Editor Supabase du projet `mebudscarxhtwfihtopl`, coller et exécuter :

`supabase/migrations/20260327120000_user_connections.sql`

## 2. Login CLI + link

```bash
npx supabase login
npx supabase link --project-ref mebudscarxhtwfihtopl
```

## 3. Secrets

```bash
npx supabase secrets set CONNECTIONS_ENCRYPTION_KEY="change-me-to-a-long-random-string"
npx supabase secrets set CORE_APP_URL="https://orion-core-app.vercel.app"
# Puis chaque paire CLIENT_ID / CLIENT_SECRET (voir docs/oauth-providers.md)
```

## 4. Functions

```bash
npx supabase functions deploy oauth-start
npx supabase functions deploy oauth-callback
npx supabase functions deploy imap-connect
npx supabase functions deploy connection-disconnect
npx supabase functions deploy connections-list
```

Callback unique à enregistrer chez chaque éditeur OAuth :

`https://mebudscarxhtwfihtopl.supabase.co/functions/v1/oauth-callback`
