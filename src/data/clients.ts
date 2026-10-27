export type Client = {
  id: string
  name: string
  domain: string
  industry: string
  owner: string
  status: 'actif' | 'prospect' | 'inactif'
  mrr?: string
  lastTouch: string
  sources: string[]
  tags: string[]
  summary: string
  contacts: { name: string; role: string; email: string }[]
  openDeals: number
  openTickets: number
}

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Nova Labs',
    domain: 'novalabs.io',
    industry: 'SaaS B2B',
    owner: 'Camille R.',
    status: 'actif',
    mrr: '8 400 €',
    lastTouch: 'Il y a 3 min',
    sources: ['hubspot', 'gmail', 'drive', 'intercom'],
    tags: ['Enterprise', 'Prioritaire'],
    summary:
      'Client stratégique. Devis Q2 en validation. Support calme. Contrat Drive indexé.',
    contacts: [
      { name: 'Camille Renard', role: 'COO', email: 'camille@novalabs.io' },
      { name: 'Marc Duval', role: 'CTO', email: 'marc@novalabs.io' },
    ],
    openDeals: 1,
    openTickets: 0,
  },
  {
    id: 'c2',
    name: 'Studio Aurora',
    domain: 'aurora.studio',
    industry: 'Agence créative',
    owner: 'Léa B.',
    status: 'actif',
    mrr: '3 200 €',
    lastTouch: 'Il y a 11 min',
    sources: ['hubspot', 'gmail', 'slack', 'calendar'],
    tags: ['Pro', 'Négociation'],
    summary: 'Deal en négociation 42 k€. Kickoff design prévu cette semaine.',
    contacts: [
      { name: 'Sophie Laurent', role: 'Directrice', email: 'sophie@aurora.studio' },
    ],
    openDeals: 1,
    openTickets: 1,
  },
  {
    id: 'c3',
    name: 'Atlas Industrie',
    domain: 'atlas-industrie.fr',
    industry: 'Industrie',
    owner: 'Thomas K.',
    status: 'prospect',
    lastTouch: 'Il y a 2 j',
    sources: ['hubspot', 'gmail'],
    tags: ['Outbound', 'Relance'],
    summary: 'Prospect chaud. Relance e-mail préparée par Mailer. Pas de ticket.',
    contacts: [
      { name: 'Paul Neri', role: 'Directeur ops', email: 'p.neri@atlas-industrie.fr' },
    ],
    openDeals: 1,
    openTickets: 0,
  },
  {
    id: 'c4',
    name: 'Pixel Co.',
    domain: 'pixelco.app',
    industry: 'Mobile',
    owner: 'Léa B.',
    status: 'actif',
    mrr: '1 900 €',
    lastTouch: 'Il y a 15 min',
    sources: ['hubspot', 'calendar', 'notion', 'slack'],
    tags: ['Kickoff'],
    summary: 'Kickoff dans 45 min. Brief Meeting Prep prêt.',
    contacts: [
      { name: 'Nina Park', role: 'Product', email: 'nina@pixelco.app' },
      { name: 'Owen Blake', role: 'CEO', email: 'owen@pixelco.app' },
    ],
    openDeals: 0,
    openTickets: 2,
  },
  {
    id: 'c5',
    name: 'Meridian',
    domain: 'meridian.co',
    industry: 'Fintech',
    owner: 'Thomas K.',
    status: 'prospect',
    lastTouch: 'Il y a 2 h',
    sources: ['hubspot'],
    tags: ['Inbound'],
    summary: 'Nouveau lead formulaire. Contact Julien Mertens à qualifier.',
    contacts: [
      { name: 'Julien Mertens', role: 'Head of Ops', email: 'julien@meridian.co' },
    ],
    openDeals: 1,
    openTickets: 0,
  },
  {
    id: 'c6',
    name: 'Horizon Retail',
    domain: 'horizon-retail.com',
    industry: 'Retail',
    owner: 'Camille R.',
    status: 'actif',
    mrr: '5 100 €',
    lastTouch: 'Hier',
    sources: ['hubspot', 'gmail', 'intercom', 'drive'],
    tags: ['Renewal'],
    summary: 'Renouvellement dans 40 jours. Usage Core + Intelligence élevé.',
    contacts: [
      { name: 'Emma Vos', role: 'IT Manager', email: 'emma@horizon-retail.com' },
    ],
    openDeals: 1,
    openTickets: 3,
  },
]
