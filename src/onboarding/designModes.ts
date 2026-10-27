import { createId } from '../hub/layoutStore'
import type { HubLayout, HubWindowConfig } from '../hub/types'
import type { DesignMode, DesignModeId } from './types'

export const designModes: DesignMode[] = [
  {
    id: 'balanced',
    label: 'Équilibré',
    tagline: 'Le Hub complet',
    description: 'Indicateurs, mails, agents, outils et projets — vue polyvalente.',
    preview: [
      { w: 4, h: 1, tone: 'stats' },
      { w: 3, h: 2, tone: 'mail' },
      { w: 1, h: 1, tone: 'agents' },
      { w: 1, h: 1, tone: 'tools' },
      { w: 4, h: 1, tone: 'projects' },
    ],
  },
  {
    id: 'mail_focus',
    label: 'Focus messagerie',
    tagline: 'Inbox d’abord',
    description: 'Grande fenêtre priorités & mails, avec outils et agents en soutien.',
    preview: [
      { w: 4, h: 1, tone: 'stats' },
      { w: 3, h: 2, tone: 'mail' },
      { w: 1, h: 2, tone: 'agents' },
      { w: 4, h: 1, tone: 'tools' },
    ],
  },
  {
    id: 'ops',
    label: 'Opérations',
    tagline: 'Pilotage quotidien',
    description: 'Stats, activité, projets et connecteurs pour suivre le terrain.',
    preview: [
      { w: 4, h: 1, tone: 'stats' },
      { w: 2, h: 2, tone: 'activity' },
      { w: 2, h: 2, tone: 'projects' },
      { w: 4, h: 1, tone: 'tools' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents IA',
    tagline: 'Automatisation au centre',
    description: 'Agents et runs mis en avant, mails et activité à côté.',
    preview: [
      { w: 4, h: 1, tone: 'stats' },
      { w: 2, h: 2, tone: 'agents' },
      { w: 2, h: 1, tone: 'mail' },
      { w: 2, h: 1, tone: 'activity' },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    tagline: 'Clients & pipeline',
    description: 'Projets, activité CRM et mails pour les équipes sales.',
    preview: [
      { w: 4, h: 1, tone: 'stats' },
      { w: 2, h: 2, tone: 'projects' },
      { w: 2, h: 1, tone: 'mail' },
      { w: 2, h: 1, tone: 'activity' },
      { w: 4, h: 1, tone: 'tools' },
    ],
  },
  {
    id: 'minimal',
    label: 'Minimal',
    tagline: 'Épuré',
    description: 'Peu de fenêtres pour démarrer léger — vous enrichirez ensuite.',
    preview: [
      { w: 4, h: 1, tone: 'stats' },
      { w: 4, h: 2, tone: 'mail' },
    ],
  },
]

function win(
  type: HubWindowConfig['type'],
  w: HubWindowConfig['w'],
  h: HubWindowConfig['h'],
  connectorIds: string[] = [],
): HubWindowConfig {
  return { id: createId('win'), type, w, h, connectorIds }
}

function mailConnectors(toolIds: string[]): string[] {
  const mail = toolIds.filter((id) =>
    ['gmail', 'outlook', 'yahoo', 'icloud'].includes(id),
  )
  return mail.length > 0 ? mail : toolIds.includes('gmail') ? ['gmail'] : []
}

export function buildLayoutFromDesign(
  mode: DesignModeId,
  toolIds: string[],
): HubLayout {
  const mail = mailConnectors(toolIds)
  const connectors = toolIds

  switch (mode) {
    case 'mail_focus':
      return {
        version: 1,
        windows: [
          win('stats', 12, 'sm'),
          win('mail_priorities', 8, 'xl', mail),
          win('agents', 4, 'lg'),
          win('tools', 12, 'sm', connectors),
        ],
      }
    case 'ops':
      return {
        version: 1,
        windows: [
          win('stats', 12, 'sm'),
          win('activity', 6, 'lg', connectors),
          win('projects', 6, 'lg'),
          win('tools', 12, 'md', connectors),
        ],
      }
    case 'agents':
      return {
        version: 1,
        windows: [
          win('stats', 12, 'sm'),
          win('agents', 6, 'lg'),
          win('mail_priorities', 6, 'md', mail),
          win('activity', 6, 'md', connectors),
          win('tools', 6, 'md', connectors),
        ],
      }
    case 'commercial':
      return {
        version: 1,
        windows: [
          win('stats', 12, 'sm'),
          win('projects', 6, 'lg'),
          win('mail_priorities', 6, 'md', mail),
          win('activity', 6, 'md', connectors),
          win('tools', 12, 'sm', connectors),
        ],
      }
    case 'minimal':
      return {
        version: 1,
        windows: [
          win('stats', 12, 'sm'),
          win('mail_priorities', 12, 'lg', mail),
        ],
      }
    case 'balanced':
    default:
      return {
        version: 1,
        windows: [
          win('stats', 12, 'sm'),
          win('mail_priorities', 8, 'lg', mail),
          win('agents', 4, 'md'),
          win('tools', 4, 'md', connectors),
          win('projects', 12, 'md'),
        ],
      }
  }
}

/** Suggest a design from selected goals */
export function suggestDesignMode(goals: string[]): DesignModeId {
  if (goals.includes('agents')) return 'agents'
  if (goals.includes('mail') && !goals.includes('projects')) return 'mail_focus'
  if (goals.includes('kpi') || goals.includes('tools')) return 'ops'
  if (goals.includes('projects')) return 'commercial'
  if (goals.length <= 1) return 'minimal'
  return 'balanced'
}
