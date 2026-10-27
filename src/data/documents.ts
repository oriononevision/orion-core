export type DocItem = {
  id: string
  name: string
  kind: 'pdf' | 'doc' | 'sheet' | 'notion' | 'image' | 'other'
  toolId: string
  clientId?: string
  updated: string
  size?: string
  summary: string
  tags: string[]
}

export const documents: DocItem[] = [
  {
    id: 'd1',
    name: 'Contrat_NovaLabs_2026.pdf',
    kind: 'pdf',
    toolId: 'drive',
    clientId: 'c1',
    updated: 'Hier',
    size: '2,4 Mo',
    summary: 'Contrat cadre · clauses SLA et crédits volume extraites.',
    tags: ['Contrat', 'Legal'],
  },
  {
    id: 'd2',
    name: 'Devis Q2 — Nova Labs',
    kind: 'sheet',
    toolId: 'drive',
    clientId: 'c1',
    updated: 'Il y a 3 h',
    size: '180 Ko',
    summary: 'Lignes Core + Intelligence + pack Scale.',
    tags: ['Commercial'],
  },
  {
    id: 'd3',
    name: 'Spec produit v3',
    kind: 'doc',
    toolId: 'drive',
    updated: 'Il y a 28 min',
    size: '640 Ko',
    summary: 'Spécification produit Orion Build — partagée par Léa.',
    tags: ['Produit'],
  },
  {
    id: 'd4',
    name: 'Runbook onboarding',
    kind: 'notion',
    toolId: 'notion',
    updated: 'Il y a 3 h',
    summary: '4 checklists extraites par Archiviste.',
    tags: ['Interne', 'Onboarding'],
  },
  {
    id: 'd5',
    name: 'Proposition Aurora — deck',
    kind: 'pdf',
    toolId: 'drive',
    clientId: 'c2',
    updated: 'Il y a 2 j',
    size: '8,1 Mo',
    summary: 'Deck commercial en négociation.',
    tags: ['Commercial', 'Design'],
  },
  {
    id: 'd6',
    name: 'Brief kickoff Pixel Co.',
    kind: 'notion',
    toolId: 'notion',
    clientId: 'c4',
    updated: "Aujourd'hui",
    summary: 'Généré par Meeting Prep à partir calendrier + CRM.',
    tags: ['Brief', 'Meeting'],
  },
  {
    id: 'd7',
    name: 'Usage Horizon Retail — Q3',
    kind: 'sheet',
    toolId: 'drive',
    clientId: 'c6',
    updated: 'Il y a 5 j',
    size: '320 Ko',
    summary: 'Consommation crédits et modules actifs.',
    tags: ['Renewal', 'Analytics'],
  },
  {
    id: 'd8',
    name: 'Thread Slack — sync Linear',
    kind: 'other',
    toolId: 'slack',
    updated: 'Il y a 40 min',
    summary: 'Discussion technique première sync Linear.',
    tags: ['Tech'],
  },
]
