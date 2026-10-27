# Connecteurs OAuth — ORION Core

Un seul callback pour tous les providers :

```
https://<PROJECT_REF>.supabase.co/functions/v1/oauth-callback
```

URL app Core (retour utilisateur) : `https://orion-core-app.vercel.app/connexions`

## Déployer

1. Appliquer la migration SQL  
   `supabase/migrations/20260327120000_user_connections.sql`  
   (SQL Editor Supabase ou `supabase db push`)

2. Secrets Edge (Dashboard → Edge Functions → Secrets) :

| Secret | Usage |
|---|---|
| `CONNECTIONS_ENCRYPTION_KEY` | Phrase ou base64 32 octets pour AES-GCM |
| `CORE_APP_URL` | `https://orion-core-app.vercel.app` |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | auto sur hosted |
| `MS_CLIENT_ID` / `MS_CLIENT_SECRET` | Outlook (Microsoft Graph) |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | Slack |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` | Notion |
| `HUBSPOT_CLIENT_ID` / `HUBSPOT_CLIENT_SECRET` | HubSpot |
| `DROPBOX_CLIENT_ID` / `DROPBOX_CLIENT_SECRET` | Dropbox |
| `ASANA_CLIENT_ID` / `ASANA_CLIENT_SECRET` | Asana |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub |
| `AIRTABLE_CLIENT_ID` / `AIRTABLE_CLIENT_SECRET` | Airtable |
| `LINEAR_CLIENT_ID` / `LINEAR_CLIENT_SECRET` | Linear |
| `INTERCOM_CLIENT_ID` / `INTERCOM_CLIENT_SECRET` | Intercom |
| `SALESFORCE_CLIENT_ID` / `SALESFORCE_CLIENT_SECRET` | Salesforce |
| `ZENDESK_CLIENT_ID` / `ZENDESK_CLIENT_SECRET` / `ZENDESK_SUBDOMAIN` | Zendesk |
| `STRIPE_CLIENT_ID` / `STRIPE_SECRET_KEY` | Stripe Connect |

3. Déployer les functions :

```bash
supabase functions deploy oauth-start
supabase functions deploy oauth-callback
supabase functions deploy imap-connect
supabase functions deploy connection-disconnect
supabase functions deploy connections-list
```

## Consoles & scopes

| Provider | Console | Scopes (indicatif) |
|---|---|---|
| Google (Gmail/Drive/Calendar) | [Google Cloud](https://console.cloud.google.com/apis/credentials) — Client ID **front** `VITE_GOOGLE_CLIENT_ID` | déjà géré GIS |
| Outlook | [Entra / Azure](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps) | `User.Read Mail.Read Calendars.Read offline_access` |
| Slack | [api.slack.com/apps](https://api.slack.com/apps) | `channels:read,chat:write,users:read,files:read` |
| Notion | [notion.so/my-integrations](https://www.notion.so/my-integrations) | OAuth public integration |
| HubSpot | [developers.hubspot.com](https://developers.hubspot.com/) | contacts + deals read |
| Dropbox | [dropbox.com/developers](https://www.dropbox.com/developers) | offline access |
| Asana | [developers.asana.com](https://developers.asana.com/) | `default` |
| GitHub | [GitHub OAuth Apps](https://github.com/settings/developers) | `repo read:user` |
| Airtable | [airtable.com/create/oauth](https://airtable.com/create/oauth) | `data.records:read schema.bases:read` |
| Linear | [linear.app/settings/api](https://linear.app/settings/api) | `read write` |
| Intercom | [developers.intercom.com](https://developers.intercom.com/) | OAuth |
| Salesforce | [Setup → App Manager](https://login.salesforce.com) | `api refresh_token` |
| Zendesk | Admin → API → OAuth Clients | + `ZENDESK_SUBDOMAIN` |
| Stripe | [Connect → OAuth](https://dashboard.stripe.com/test/settings/connect/onboarding-options/oauth) | `read_write` |

### Stripe Connect (détail)

Deux modes (choisis automatiquement par `oauth-start`) :

| Secrets | Mode | Comportement |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` seule | **Account Links** | Crée un compte Connect v2 (recipient) + onboarding Stripe hébergé |
| `STRIPE_CLIENT_ID` (`ca_…`) + `STRIPE_SECRET_KEY` | **OAuth Connect** | L’utilisateur autorise son compte Stripe existant |

**Account Links (défaut actuel)** — plateforme FR : création via `POST /v2/core/accounts` (config `recipient`), puis `POST /v1/account_links`.  
Config `merchant` côté FR exige des account tokens (Stripe.js) ; non utilisé pour l’instant.

**OAuth Connect (optionnel)** :

1. Dashboard Stripe → Connect → Onboarding options → **OAuth** (mode Test).
2. Copier le **client_id** (`ca_…`).
3. Redirect URI :
   `https://mebudscarxhtwfihtopl.supabase.co/functions/v1/oauth-callback`
4. Enregistrer les deux secrets :

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_…"
# Minimum (Account Links) :
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_…" --project-ref mebudscarxhtwfihtopl
# OAuth (connecter un compte Stripe existant) :
.\scripts\set-stripe-oauth.ps1 -ClientId "ca_…" -SecretKey "sk_test_…"
```

Échange OAuth : auth Basic Stripe (`sk_:` + `client_id`).

## IMAP (Yahoo / iCloud / générique)

Pas d’OAuth : l’utilisateur fournit e-mail + **mot de passe d’application**.  
L’Edge `imap-connect` tente un `LOGIN` TLS puis stocke le secret chiffré.

- Yahoo : [App passwords](https://login.yahoo.com/account/security)
- iCloud : [appleid.apple.com](https://appleid.apple.com) → Mot de passe d’app
- IMAP custom : host + port 993

## Modes d’auth dans Core

| Mode | Tools |
|---|---|
| `google` | gmail, drive, calendar |
| `oauth` | outlook, slack, notion, hubspot, dropbox, asana, github, airtable, linear, intercom, salesforce, zendesk, stripe |
| `imap` | yahoo, icloud, imap |

Sans secret Edge, le bouton OAuth renvoie une erreur claire (« Provider non configuré ») — plus de faux token démo.
