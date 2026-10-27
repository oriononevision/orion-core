export type ToolCategory =
  | 'communication'
  | 'productivite'
  | 'crm'
  | 'fichiers'
  | 'calendrier'
  | 'dev'
  | 'finance'
  | 'support'

export type ToolStatus = 'connected' | 'syncing' | 'error' | 'available'

export type ConnectedTool = {
  id: string
  name: string
  category: ToolCategory
  status: ToolStatus
  description: string
  color: string
  initial: string
  logo: string
  domain: string
  accounts?: number
  lastSync?: string
  itemsSynced?: number
  permissions: string[]
  features: string[]
}

export const categoryLabels: Record<ToolCategory, string> = {
  communication: 'Communication',
  productivite: 'Productivité',
  crm: 'CRM & Sales',
  fichiers: 'Fichiers',
  calendrier: 'Calendrier',
  dev: 'Développement',
  finance: 'Finance',
  support: 'Support',
}

export const tools: ConnectedTool[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'communication',
    status: 'available',
    description: 'E-mails, fils et pièces jointes synchronisés dans le hub.',
    color: '#ea4335',
    initial: 'Gm',
    logo: '/logos/gmail.svg',
    domain: 'gmail.com',
    accounts: 2,
    lastSync: 'Il y a 2 min',
    itemsSynced: 12840,
    permissions: ['Lecture e-mails', 'Envoi assisté', 'Labels'],
    features: ['Inbox unifiée', 'Résumés IA', 'Relances'],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    status: 'available',
    description: 'Canaux, messages directs et fichiers d’équipe.',
    color: '#4a154b',
    initial: 'Sl',
    logo: '/logos/slack.svg',
    domain: 'slack.com',
    accounts: 1,
    lastSync: 'Il y a 5 min',
    itemsSynced: 45200,
    permissions: ['Canaux', 'DM', 'Fichiers'],
    features: ['Mentions', 'Résumés de threads', 'Actions'],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivite',
    status: 'available',
    description: 'Pages, bases et wikis comme source de vérité projet.',
    color: '#ffffff',
    initial: 'No',
    logo: '/logos/notion.svg',
    domain: 'notion.so',
    accounts: 1,
    lastSync: 'Il y a 12 min',
    itemsSynced: 892,
    permissions: ['Lecture pages', 'Bases de données', 'Commentaires'],
    features: ['Recherche', 'Extraction', 'Briefs'],
  },
  {
    id: 'drive',
    name: 'Google Drive',
    category: 'fichiers',
    status: 'available',
    description: 'Docs, sheets et dossiers partagés de l’équipe.',
    color: '#34a853',
    initial: 'Dr',
    logo: '/logos/drive.svg',
    domain: 'drive.google.com',
    accounts: 1,
    lastSync: 'Il y a 8 min',
    itemsSynced: 3402,
    permissions: ['Lecture fichiers', 'Métadonnées', 'Partage'],
    features: ['Indexation', 'Résumés docs', 'Liens clients'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    status: 'available',
    description: 'Contacts, deals et pipelines commerciaux.',
    color: '#ff7a59',
    initial: 'Hs',
    logo: '/logos/hubspot.svg',
    domain: 'hubspot.com',
    accounts: 1,
    lastSync: 'Il y a 15 min',
    itemsSynced: 2140,
    permissions: ['Contacts', 'Deals', 'Notes'],
    features: ['Fiches client', 'Pipeline', 'Relances'],
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    category: 'calendrier',
    status: 'available',
    description: 'Réunions, disponibilités et contextes rendez-vous.',
    color: '#4285f4',
    initial: 'Ca',
    logo: '/logos/calendar.svg',
    domain: 'calendar.google.com',
    accounts: 2,
    lastSync: 'Il y a 3 min',
    itemsSynced: 486,
    permissions: ['Événements', 'Invités', 'Création'],
    features: ['Brief meeting', 'Conflits', 'Prep IA'],
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'dev',
    status: 'available',
    description: 'Issues, projets et cycles produit.',
    color: '#5e6ad2',
    initial: 'Li',
    logo: '/logos/linear.svg',
    domain: 'linear.app',
    accounts: 1,
    lastSync: 'Il y a 6 min',
    itemsSynced: 1204,
    permissions: ['Issues', 'Projets', 'Commentaires'],
    features: ['Statuts', 'Priorités', 'Agents'],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'support',
    status: 'available',
    description: 'Conversations support et tickets clients.',
    color: '#1f8ded',
    initial: 'In',
    logo: '/logos/intercom.svg',
    domain: 'intercom.com',
    accounts: 1,
    lastSync: 'Il y a 20 min',
    itemsSynced: 980,
    permissions: ['Conversations', 'Utilisateurs', 'Tags'],
    features: ['Priorisation', 'Réponses draft', 'SLA'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'finance',
    status: 'available',
    description: 'Paiements, abonnements et clients facturés.',
    color: '#635bff',
    initial: 'St',
    logo: '/logos/stripe.svg',
    domain: 'stripe.com',
    permissions: ['Clients', 'Abonnements', 'Factures'],
    features: ['MRR', 'Alertes churn', 'Fiches'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    status: 'available',
    description: 'CRM entreprise, opportunités et comptes.',
    color: '#00a1e0',
    initial: 'Sf',
    logo: '/logos/salesforce.svg',
    domain: 'salesforce.com',
    permissions: ['Accounts', 'Opportunities', 'Activities'],
    features: ['Pipeline', 'Forecast', 'Sync'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'fichiers',
    status: 'available',
    description: 'Stockage fichiers et dossiers partagés.',
    color: '#0061ff',
    initial: 'Db',
    logo: '/logos/dropbox.svg',
    domain: 'dropbox.com',
    permissions: ['Fichiers', 'Partage'],
    features: ['Index', 'Aperçus'],
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'productivite',
    status: 'available',
    description: 'Tâches, projets et échéances équipe.',
    color: '#f06a6a',
    initial: 'As',
    logo: '/logos/asana.svg',
    domain: 'asana.com',
    permissions: ['Tâches', 'Projets'],
    features: ['Assignations', 'Deadlines'],
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'communication',
    status: 'available',
    description: 'Outlook.com / Microsoft 365 — mail + calendrier.',
    color: '#0078d4',
    initial: 'Ou',
    logo: '/logos/outlook.svg',
    domain: 'outlook.com',
    permissions: ['Mail', 'Calendrier'],
    features: ['Inbox unifiée', 'Relances IA', 'Meetings'],
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    category: 'communication',
    status: 'available',
    description: 'Boîte Yahoo via IMAP sécurisé.',
    color: '#6001d2',
    initial: 'Ya',
    logo: '/logos/yahoo.svg',
    domain: 'yahoo.com',
    permissions: ['Lecture', 'Envoi'],
    features: ['Inbox unifiée', 'Relances IA'],
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    category: 'communication',
    status: 'available',
    description: 'Mail Apple iCloud (@icloud.com) via IMAP.',
    color: '#3693f3',
    initial: 'iC',
    logo: '/logos/icloud.svg',
    domain: 'icloud.com',
    permissions: ['Lecture', 'Envoi'],
    features: ['Inbox unifiée', 'Relances IA'],
  },
  {
    id: 'imap',
    name: 'IMAP / autre mail',
    category: 'communication',
    status: 'available',
    description: 'N’importe quelle boîte : OVH, Proton Bridge, entreprise, custom…',
    color: '#7dd3fc',
    initial: 'IM',
    logo: '/logos/imap.svg',
    domain: 'imap',
    permissions: ['Lecture', 'Envoi'],
    features: ['Inbox unifiée', 'Agents IA', 'Relances'],
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'dev',
    status: 'available',
    description: 'Repos, PRs et discussions techniques.',
    color: '#f0f6fc',
    initial: 'Gh',
    logo: '/logos/github.svg',
    domain: 'github.com',
    accounts: 1,
    lastSync: 'Erreur OAuth',
    itemsSynced: 0,
    permissions: ['Repos', 'PRs', 'Issues'],
    features: ['Revue', 'Statuts CI'],
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'support',
    status: 'available',
    description: 'Tickets support et base de connaissance.',
    color: '#03363d',
    initial: 'Zd',
    logo: '/logos/zendesk.svg',
    domain: 'zendesk.com',
    permissions: ['Tickets', 'Users'],
    features: ['Priorité', 'Macros'],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    category: 'productivite',
    status: 'available',
    description: 'Bases structurées et vues métier.',
    color: '#18bfff',
    initial: 'Ai',
    logo: '/logos/airtable.svg',
    domain: 'airtable.com',
    permissions: ['Bases', 'Records'],
    features: ['Sync tables', 'Filtres'],
  },
]

export function connectedTools() {
  return tools.filter((t) => t.status === 'connected' || t.status === 'syncing' || t.status === 'error')
}

export function availableTools() {
  return tools.filter((t) => t.status === 'available')
}

export function getTool(id: string) {
  return tools.find((t) => t.id === id)
}
