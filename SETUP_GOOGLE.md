# Setup Google OAuth (une fois pour le projet)

Le **Client ID** est unique pour ORION Core. Chaque utilisateur connecte ensuite **son** Gmail (e-mail + confirmation + popup Google).

## Dans l’app (recommandé)

1. Ouvrez **http://localhost:5174/setup-google**
2. Suivez les liens (APIs + consentement + Client ID Web)
3. Origin autorisée : `http://localhost:5174`
4. Collez le Client ID → **Enregistrer**
5. Allez dans **Connexions** → Gmail

## Via `.env` (optionnel)

```env
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

Puis redémarrez `npm run dev`.

## Checklist Google Cloud

1. Projet Google Cloud
2. Activer **Gmail API**, **Drive API**, **Google Calendar API**
3. Écran de consentement OAuth (External) + test user si besoin
4. Identifiants → **OAuth client ID** → **Application Web**
5. Origines JavaScript : `http://localhost:5174`
