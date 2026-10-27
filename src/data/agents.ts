export type AgentStatus = 'idle' | 'running' | 'waiting' | 'done'

export type Agent = {
  id: string
  name: string
  role: string
  description: string
  tools: string[]
  status: AgentStatus
  lastAction: string
  runsToday: number
  successRate: number
  capabilities: string[]
}

export type AgentRun = {
  id: string
  agentId: string
  title: string
  detail: string
  tools: string[]
  time: string
  status: 'success' | 'running' | 'needs_input'
}

export const agents: Agent[] = [
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Orchestrateur',
    description:
      'Coordonne les autres agents, route les demandes et consolide les réponses multi-outils.',
    tools: ['gmail', 'slack', 'notion', 'hubspot', 'drive'],
    status: 'idle',
    lastAction: 'Brief quotidien généré à 08:12',
    runsToday: 14,
    successRate: 97,
    capabilities: ['Routage', 'Synthèse', 'Priorisation'],
  },
  {
    id: 'mailer',
    name: 'Mailer',
    role: 'E-mail & relances',
    description:
      'Lit Gmail/Outlook, propose des réponses, détecte les relances urgentes et prépare des brouillons.',
    tools: ['gmail', 'hubspot', 'calendar'],
    status: 'running',
    lastAction: '3 brouillons de relance en cours…',
    runsToday: 28,
    successRate: 94,
    capabilities: ['Résumés', 'Drafts', 'Relances', 'Tri inbox'],
  },
  {
    id: 'crm-pulse',
    name: 'CRM Pulse',
    role: 'Commercial',
    description:
      'Suit les deals HubSpot/Salesforce, alerte sur les opportunités froides et prépare les next steps.',
    tools: ['hubspot', 'gmail', 'slack', 'calendar'],
    status: 'waiting',
    lastAction: 'En attente validation deal Acme',
    runsToday: 9,
    successRate: 91,
    capabilities: ['Pipeline', 'Score deals', 'Prep call'],
  },
  {
    id: 'archiviste',
    name: 'Archiviste',
    role: 'Documents',
    description:
      'Indexe Drive/Notion/Dropbox, relie les fichiers aux clients et extrait les infos clés.',
    tools: ['drive', 'notion', 'dropbox'],
    status: 'idle',
    lastAction: '12 docs liés à Nova Labs',
    runsToday: 6,
    successRate: 98,
    capabilities: ['Index', 'Extraction', 'Liaison client'],
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Support',
    description:
      'Surveille Intercom/Zendesk, priorise les tickets et propose des réponses contextualisées.',
    tools: ['intercom', 'notion', 'hubspot'],
    status: 'done',
    lastAction: 'File support triée — 0 critique',
    runsToday: 11,
    successRate: 93,
    capabilities: ['Priorité SLA', 'Drafts', 'Escalade'],
  },
  {
    id: 'meeting',
    name: 'Meeting Prep',
    role: 'Calendrier',
    description:
      'Prépare les briefs de réunion à partir du calendrier, e-mails et CRM liés.',
    tools: ['calendar', 'gmail', 'hubspot', 'notion'],
    status: 'idle',
    lastAction: 'Brief prêt pour 14:30 — Studio Aurora',
    runsToday: 4,
    successRate: 96,
    capabilities: ['Briefs', 'Agenda', 'Participants'],
  },
]

export const recentRuns: AgentRun[] = [
  {
    id: 'r1',
    agentId: 'mailer',
    title: 'Relance client Atlas',
    detail: 'Brouillon créé depuis le dernier e-mail + deal HubSpot.',
    tools: ['gmail', 'hubspot'],
    time: 'Il y a 4 min',
    status: 'running',
  },
  {
    id: 'r2',
    agentId: 'meeting',
    title: 'Brief réunion Studio Aurora',
    detail: 'Participants, historique e-mails et notes Notion assemblés.',
    tools: ['calendar', 'gmail', 'notion'],
    time: 'Il y a 18 min',
    status: 'success',
  },
  {
    id: 'r3',
    agentId: 'crm-pulse',
    title: 'Deal Acme à risque',
    detail: 'Aucune activité depuis 12 jours — validation next step requise.',
    tools: ['hubspot', 'slack'],
    time: 'Il y a 32 min',
    status: 'needs_input',
  },
  {
    id: 'r4',
    agentId: 'sentinel',
    title: 'Tickets Intercom triés',
    detail: '7 conversations priorisées, 2 drafts prêts.',
    tools: ['intercom'],
    time: 'Il y a 1 h',
    status: 'success',
  },
  {
    id: 'r5',
    agentId: 'archiviste',
    title: 'Contrat Nova Labs indexé',
    detail: 'PDF Drive relié à la fiche client + extrait clauses.',
    tools: ['drive', 'hubspot'],
    time: 'Il y a 2 h',
    status: 'success',
  },
]
