import type { HubLayout, HubWindowConfig } from './types'

export const HUB_LAYOUT_KEY = 'orion.hub.layout.v1'

export function createId(prefix = 'win'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/** Layout vide — état initial avant / sans onboarding */
export function emptyHubLayout(): HubLayout {
  return { version: 1, windows: [] }
}

/** Template « équilibré » (réinitialisation manuelle) */
export function defaultHubLayout(): HubLayout {
  const windows: HubWindowConfig[] = [
    {
      id: 'win_stats',
      type: 'stats',
      w: 12,
      h: 'sm',
      connectorIds: [],
    },
    {
      id: 'win_mail',
      type: 'mail_priorities',
      w: 8,
      h: 'lg',
      connectorIds: ['gmail'],
    },
    {
      id: 'win_agents',
      type: 'agents',
      w: 4,
      h: 'md',
      connectorIds: [],
    },
    {
      id: 'win_tools',
      type: 'tools',
      w: 4,
      h: 'md',
      connectorIds: [],
    },
    {
      id: 'win_projects',
      type: 'projects',
      w: 12,
      h: 'md',
      connectorIds: [],
    },
  ]
  return { version: 1, windows }
}

export function loadHubLayout(): HubLayout {
  if (typeof window === 'undefined') return emptyHubLayout()
  try {
    const raw = localStorage.getItem(HUB_LAYOUT_KEY)
    if (!raw) return emptyHubLayout()
    const parsed = JSON.parse(raw) as HubLayout
    if (parsed?.version !== 1 || !Array.isArray(parsed.windows)) {
      return emptyHubLayout()
    }
    return {
      version: 1,
      windows: parsed.windows.filter(
        (w): w is HubWindowConfig =>
          Boolean(w?.id && w?.type && w?.w && w?.h && Array.isArray(w.connectorIds)),
      ),
    }
  } catch {
    return emptyHubLayout()
  }
}

export function saveHubLayout(layout: HubLayout): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(HUB_LAYOUT_KEY, JSON.stringify(layout))
}
