# ORION Core

Premier logiciel de l’écosystème ORION : hub qui connecte les outils du client, centralise leurs données et laisse des agents IA agir dessus.

## Lancer

```bash
cd orion-core
npm install
npm run dev
```

Ouvre l’URL Vite (souvent `http://localhost:5173`).

## Contenu (démo front)

- **Hub** — flux unifié, stats, projets, outils connectés
- **Connexions** — catalogue (Gmail, Slack, Notion, Drive, HubSpot, Calendar, Linear, Intercom, Stripe, Salesforce…) + connexion simulée
- **Agents IA** — Nexus, Mailer, CRM Pulse, Archiviste, Sentinel, Meeting Prep
- **Clients / Projets / Documents** — fiches alimentées par les sources sync
- **Activité** — journal multi-outils
- **Recherche** — `Ctrl/Cmd + K` sur tout l’espace

Les intégrations OAuth et l’exécution réelle des agents sont mockées côté front pour la démo produit.
