import type { HubColSpan, HubHeight, HubWindowCatalogItem, HubWindowType } from './types'

export const hubWindowCatalog: HubWindowCatalogItem[] = [
  {
    type: 'stats',
    label: 'Indicateurs',
    description: 'Compteurs clés : outils, agents, clients, sync.',
    defaultW: 12,
    defaultH: 'sm',
    maxInstances: 1,
  },
  {
    type: 'mail_priorities',
    label: 'Priorités & mails',
    description: 'Importants, relances IA et fil d’inbox.',
    defaultW: 8,
    defaultH: 'lg',
    suggestedConnectors: ['gmail', 'outlook', 'yahoo', 'icloud'],
  },
  {
    type: 'agents',
    label: 'Agents',
    description: 'Derniers runs et accès rapide aux agents.',
    defaultW: 4,
    defaultH: 'md',
  },
  {
    type: 'tools',
    label: 'Outils connectés',
    description: 'Aperçu des connecteurs actifs.',
    defaultW: 4,
    defaultH: 'md',
  },
  {
    type: 'projects',
    label: 'Projets',
    description: 'Projets en cours et planifiés.',
    defaultW: 12,
    defaultH: 'md',
  },
  {
    type: 'activity',
    label: 'Activité',
    description: 'Fil d’événements récents (sync, mails, CRM…).',
    defaultW: 6,
    defaultH: 'md',
  },
  {
    type: 'notes',
    label: 'Notes',
    description: 'Bloc texte libre sur le Hub.',
    defaultW: 4,
    defaultH: 'md',
    comingSoon: true,
  },
  {
    type: 'chart_placeholder',
    label: 'Graphique',
    description: 'Visualisation de données (à venir).',
    defaultW: 6,
    defaultH: 'md',
    comingSoon: true,
  },
  {
    type: 'widget_placeholder',
    label: 'Widget',
    description: 'Widget personnalisé (à venir).',
    defaultW: 4,
    defaultH: 'md',
    comingSoon: true,
  },
]

export const colSpanOptions: { value: HubColSpan; label: string }[] = [
  { value: 3, label: '¼ — étroit' },
  { value: 4, label: '⅓' },
  { value: 6, label: '½' },
  { value: 8, label: '⅔' },
  { value: 12, label: 'Pleine largeur' },
]

export const heightOptions: { value: HubHeight; label: string }[] = [
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Moyen' },
  { value: 'lg', label: 'Grand' },
  { value: 'xl', label: 'Très grand' },
]

const catalogByType = Object.fromEntries(
  hubWindowCatalog.map((item) => [item.type, item]),
) as Record<HubWindowType, HubWindowCatalogItem>

export function getCatalogItem(type: HubWindowType): HubWindowCatalogItem {
  return catalogByType[type]
}

export function windowLabel(type: HubWindowType, customTitle?: string): string {
  if (customTitle?.trim()) return customTitle.trim()
  return catalogByType[type]?.label ?? type
}
