import type { OnboardingGoal } from './types'

export const onboardingGoals: OnboardingGoal[] = [
  {
    id: 'mail',
    label: 'Mails & relances',
    description: 'Prioriser l’inbox, détecter l’important et préparer les relances.',
  },
  {
    id: 'projects',
    label: 'Projets & clients',
    description: 'Suivre l’avancement, les deals et le contexte client au même endroit.',
  },
  {
    id: 'tools',
    label: 'Centraliser mes outils',
    description: 'Une vue unique sur Slack, Drive, CRM, calendrier et le reste.',
  },
  {
    id: 'agents',
    label: 'Automatiser avec l’IA',
    description: 'Laisser des agents préparer drafts, briefs et actions répétitives.',
  },
  {
    id: 'kpi',
    label: 'Piloter avec des indicateurs',
    description: 'Garder sous les yeux sync, activité et métriques clés.',
  },
]
