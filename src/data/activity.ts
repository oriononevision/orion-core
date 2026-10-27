export type ActivityItem = {
  id: string
  type: 'sync' | 'agent' | 'email' | 'crm' | 'file' | 'meeting' | 'alert'
  title: string
  detail: string
  toolIds: string[]
  time: string
  unread?: boolean
}

export const activity: ActivityItem[] = [
  {
    id: 'a1',
    type: 'email',
    title: 'Nouveau fil — Camille R. (Nova Labs)',
    detail: 'Objet : Validation du devis Q2 — 2 pièces jointes',
    toolIds: ['gmail'],
    time: 'Il y a 3 min',
    unread: true,
  },
  {
    id: 'a2',
    type: 'agent',
    title: 'Mailer a préparé 3 brouillons de relance',
    detail: 'Atlas, Horizon et Pixel Co. — en attente de validation',
    toolIds: ['gmail', 'hubspot'],
    time: 'Il y a 4 min',
    unread: true,
  },
  {
    id: 'a3',
    type: 'crm',
    title: 'Deal HubSpot mis à jour — Studio Aurora',
    detail: 'Étape : Proposition → Négociation · 42 000 €',
    toolIds: ['hubspot'],
    time: 'Il y a 11 min',
  },
  {
    id: 'a4',
    type: 'meeting',
    title: 'Réunion dans 45 min — Kickoff Pixel Co.',
    detail: 'Brief Meeting Prep disponible',
    toolIds: ['calendar', 'notion'],
    time: 'Il y a 15 min',
    unread: true,
  },
  {
    id: 'a5',
    type: 'file',
    title: 'Document Drive partagé — Spec produit v3',
    detail: 'Ajouté par Léa · lié au projet Orion Build',
    toolIds: ['drive'],
    time: 'Il y a 28 min',
  },
  {
    id: 'a6',
    type: 'sync',
    title: 'Sync Linear en cours',
    detail: '1 204 issues · première connexion',
    toolIds: ['linear'],
    time: 'Il y a 35 min',
  },
  {
    id: 'a7',
    type: 'alert',
    title: 'GitHub — reconnexion requise',
    detail: 'Token OAuth expiré. Actions agents bloquées.',
    toolIds: ['github'],
    time: 'Il y a 1 h',
    unread: true,
  },
  {
    id: 'a8',
    type: 'agent',
    title: 'Sentinel a trié la file Intercom',
    detail: '0 ticket critique · 2 drafts prêts',
    toolIds: ['intercom'],
    time: 'Il y a 1 h',
  },
  {
    id: 'a9',
    type: 'crm',
    title: 'Nouveau contact HubSpot — Julien Mertens',
    detail: 'Source : formulaire site · entreprise Meridian',
    toolIds: ['hubspot'],
    time: 'Il y a 2 h',
  },
  {
    id: 'a10',
    type: 'file',
    title: 'Page Notion mise à jour — Runbook onboarding',
    detail: 'Archiviste a extrait 4 checklists',
    toolIds: ['notion'],
    time: 'Il y a 3 h',
  },
]
