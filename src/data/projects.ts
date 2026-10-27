export type Project = {
  id: string
  name: string
  clientId?: string
  status: 'en_cours' | 'bloque' | 'termine' | 'planifie'
  progress: number
  owner: string
  due: string
  sources: string[]
  summary: string
  tasksDone: number
  tasksTotal: number
}

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Déploiement ORION Core — Nova Labs',
    clientId: 'c1',
    status: 'en_cours',
    progress: 72,
    owner: 'Camille R.',
    due: '12 nov.',
    sources: ['notion', 'linear', 'drive', 'slack'],
    summary: 'Connexions HubSpot + Drive OK. Formation équipe prévue.',
    tasksDone: 18,
    tasksTotal: 25,
  },
  {
    id: 'p2',
    name: 'Proposition Studio Aurora',
    clientId: 'c2',
    status: 'en_cours',
    progress: 55,
    owner: 'Léa B.',
    due: '4 nov.',
    sources: ['hubspot', 'gmail', 'notion'],
    summary: 'Négociation commerciale. Spec créative en revue.',
    tasksDone: 11,
    tasksTotal: 20,
  },
  {
    id: 'p3',
    name: 'Kickoff Pixel Co.',
    clientId: 'c4',
    status: 'planifie',
    progress: 20,
    owner: 'Léa B.',
    due: "Aujourd'hui",
    sources: ['calendar', 'notion', 'slack'],
    summary: 'Réunion kickoff dans 45 min. Brief prêt.',
    tasksDone: 3,
    tasksTotal: 15,
  },
  {
    id: 'p4',
    name: 'Renewal Horizon Retail',
    clientId: 'c6',
    status: 'en_cours',
    progress: 40,
    owner: 'Camille R.',
    due: '28 nov.',
    sources: ['hubspot', 'intercom', 'gmail'],
    summary: 'Analyse usage + proposition crédits volume.',
    tasksDone: 6,
    tasksTotal: 14,
  },
  {
    id: 'p5',
    name: 'Outbound Atlas Industrie',
    clientId: 'c3',
    status: 'bloque',
    progress: 30,
    owner: 'Thomas K.',
    due: '8 nov.',
    sources: ['hubspot', 'gmail'],
    summary: 'En attente validation du brouillon de relance.',
    tasksDone: 4,
    tasksTotal: 12,
  },
  {
    id: 'p6',
    name: 'Runbook onboarding interne',
    status: 'en_cours',
    progress: 85,
    owner: 'Léa B.',
    due: '31 oct.',
    sources: ['notion', 'drive'],
    summary: 'Archiviste a extrait les checklists. Revue finale.',
    tasksDone: 17,
    tasksTotal: 20,
  },
]
