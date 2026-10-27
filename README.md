# ORION Core

Premier logiciel de l’écosystème ORION : hub qui connecte les outils du client, centralise leurs données et laisse des agents IA agir dessus.

## Lancer

```bash
cd orion-core
npm install
cp .env.example .env   # renseigner Supabase + Google Client ID
npm run dev
```

## Connexions

| Mode | Apps |
|---|---|
| Google GIS (navigateur) | Gmail, Drive, Calendar |
| OAuth Edge (Supabase) | Outlook, Slack, Notion, HubSpot, Dropbox, Asana, GitHub, Airtable, Linear, Intercom, Salesforce, Zendesk, Stripe |
| IMAP Edge | Yahoo, iCloud, IMAP générique |

Guide secrets & callback : [`docs/oauth-providers.md`](docs/oauth-providers.md)  
Déploiement bridge : [`scripts/deploy-connectors.md`](scripts/deploy-connectors.md)

Sans secrets Edge, les boutons OAuth renvoient une erreur claire (plus de connexion démo).
