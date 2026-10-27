export type MailFolder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archived'

export type MailMessage = {
  id: string
  toolId: 'gmail' | 'outlook'
  folder: MailFolder
  from: { name: string; email: string }
  to: { name: string; email: string }[]
  subject: string
  preview: string
  body: string
  time: string
  dateLabel: string
  unread: boolean
  starred: boolean
  labels: string[]
  clientId?: string
  hasAttachment?: boolean
}

export const seedMails: MailMessage[] = [
  {
    id: 'm1',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Camille Renard', email: 'camille@novalabs.io' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Validation du devis Q2 — Nova Labs',
    preview: 'Bonjour, nous avons relu le devis Core + Intelligence. Deux points à clarifier…',
    body: `Bonjour,

Nous avons relu le devis Q2 pour ORION Core + Intelligence.

Deux points à clarifier avant signature :
1. Volume de crédits inclus vs pack Scale
2. Délai de formation de l’équipe ops

Pouvez-vous nous renvoyer une version amendée d’ici jeudi ?

Cordialement,
Camille Renard
COO — Nova Labs`,
    time: '09:42',
    dateLabel: "Aujourd'hui",
    unread: true,
    starred: true,
    labels: ['Client', 'Commercial'],
    clientId: 'c1',
    hasAttachment: true,
  },
  {
    id: 'm2',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Sophie Laurent', email: 'sophie@aurora.studio' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Re: Proposition Studio Aurora — négociation',
    preview: 'On est d’accord sur 42 k€ si on peut démarrer le kickoff la semaine prochaine…',
    body: `Salut,

On est d’accord sur 42 k€ si on peut démarrer le kickoff la semaine prochaine.

Peux-tu confirmer la dispo de Léa et m’envoyer le planning d’onboarding ?

Merci,
Sophie`,
    time: '08:15',
    dateLabel: "Aujourd'hui",
    unread: true,
    starred: false,
    labels: ['Négociation'],
    clientId: 'c2',
  },
  {
    id: 'm3',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Paul Neri', email: 'p.neri@atlas-industrie.fr' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Suite à notre échange — Atlas Industrie',
    preview: 'Je n’ai pas eu de nouvelles depuis notre call. Toujours intéressés pour un POC…',
    body: `Bonjour,

Je n’ai pas eu de nouvelles depuis notre call de la semaine dernière.
Nous sommes toujours intéressés pour un POC ORION Core sur 3 semaines.

Quel serait le prochain créneau possible ?

Paul Neri
Directeur ops — Atlas Industrie`,
    time: 'Hier',
    dateLabel: 'Hier',
    unread: true,
    starred: false,
    labels: ['Relance', 'Prospect'],
    clientId: 'c3',
  },
  {
    id: 'm4',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Nina Park', email: 'nina@pixelco.app' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Kickoff Pixel Co. — ordre du jour',
    preview: 'Voici les points qu’on aimerait couvrir à 14:30 : connexions, agents, roles…',
    body: `Hello,

Voici les points qu’on aimerait couvrir à 14:30 :
— Connexions Gmail / Notion / HubSpot
— Rôles équipe
— Premiers agents utiles

Le brief Notion est à jour de mon côté.

À tout à l’heure,
Nina`,
    time: 'Hier',
    dateLabel: 'Hier',
    unread: false,
    starred: true,
    labels: ['Meeting'],
    clientId: 'c4',
  },
  {
    id: 'm5',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Emma Vos', email: 'emma@horizon-retail.com' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Renewal Horizon — usage Q3',
    preview: 'Le rapport d’usage montre une forte conso Intelligence. On discute volume…',
    body: `Bonjour,

Le rapport d’usage Q3 montre une forte consommation Intelligence.
On aimerait discuter d’un volume annuel avant le renewal.

Dispo jeudi ou vendredi ?

Emma Vos
IT Manager — Horizon Retail`,
    time: 'Lun.',
    dateLabel: 'Lundi',
    unread: false,
    starred: false,
    labels: ['Renewal'],
    clientId: 'c6',
    hasAttachment: true,
  },
  {
    id: 'm6',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Julien Mertens', email: 'julien@meridian.co' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Demande démo ORION — Meridian',
    preview: 'Suite au formulaire du site, je souhaiterais une démo orientée ops fintech…',
    body: `Bonjour,

Suite au formulaire du site, je souhaiterais une démo orientée ops fintech
(connexions CRM + support + crédits).

Créneaux possibles : mardi 10h–12h ou mercredi après-midi.

Julien Mertens
Head of Ops — Meridian`,
    time: 'Lun.',
    dateLabel: 'Lundi',
    unread: false,
    starred: false,
    labels: ['Inbound'],
    clientId: 'c5',
  },
  {
    id: 'm7',
    toolId: 'gmail',
    folder: 'inbox',
    from: { name: 'Google Drive', email: 'drive-shares-noreply@google.com' },
    to: [{ name: 'Vous', email: 'vous@orion.app' }],
    subject: 'Léa a partagé « Spec produit v3 »',
    preview: 'Un fichier a été partagé avec vous dans Google Drive…',
    body: `Léa B. a partagé un élément avec vous :

Spec produit v3
https://drive.google.com/file/d/demo

Cet e-mail est lié à votre connexion Drive dans ORION Core.`,
    time: '28 min',
    dateLabel: "Aujourd'hui",
    unread: true,
    starred: false,
    labels: ['Drive'],
  },
  {
    id: 'm8',
    toolId: 'gmail',
    folder: 'sent',
    from: { name: 'Vous', email: 'vous@orion.app' },
    to: [{ name: 'Camille Renard', email: 'camille@novalabs.io' }],
    subject: 'Re: Accusé réception devis Q2',
    preview: 'Merci Camille, je vous renvoie la version amendée demain matin…',
    body: `Merci Camille,

Je vous renvoie la version amendée demain matin avec le détail crédits + formation.

Bien à vous`,
    time: 'Lun.',
    dateLabel: 'Lundi',
    unread: false,
    starred: false,
    labels: ['Envoyé'],
    clientId: 'c1',
  },
  {
    id: 'm9',
    toolId: 'gmail',
    folder: 'drafts',
    from: { name: 'Vous', email: 'vous@orion.app' },
    to: [{ name: 'Paul Neri', email: 'p.neri@atlas-industrie.fr' }],
    subject: 'Relance POC Atlas Industrie',
    preview: 'Brouillon Mailer — Bonjour Paul, suite à notre échange…',
    body: `Bonjour Paul,

Suite à notre échange, je vous propose un POC ORION Core sur 3 semaines
avec connexion HubSpot + Gmail, et un point de suivi hebdomadaire.

Seriez-vous disponible mardi 11h ?

Cordialement`,
    time: 'Brouillon',
    dateLabel: "Aujourd'hui",
    unread: false,
    starred: false,
    labels: ['Agent Mailer'],
    clientId: 'c3',
  },
]

export const replySuggestions: Record<string, string> = {
  m1: `Bonjour Camille,

Merci pour votre retour. Voici ce que je propose :
1. Les crédits Scale sont ajoutés en option rechargeable sans changer de plan
2. La formation ops peut être planifiée sous 10 jours après signature

Je vous envoie la version amendée du devis d’ici demain 10h.

Bien cordialement`,
  m2: `Salut Sophie,

Parfait pour 42 k€. Léa est dispo pour un kickoff mardi ou jeudi.
Je t’envoie le planning d’onboarding cet après-midi.

À très vite`,
  m3: `Bonjour Paul,

Merci pour votre message — désolé pour le délai.
Je vous propose un POC de 3 semaines à partir de la semaine prochaine.
Créneaux : mardi 11h ou jeudi 15h.

Dites-moi ce qui vous arrange.`,
}
