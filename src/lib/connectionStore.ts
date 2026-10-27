import { tools as catalog, type ConnectedTool, type ToolStatus } from '../data/tools'

const STORAGE_KEY = 'orion_core_connections_v1'
const SEED_KEY = 'orion_core_connections_seed_v2'

export type StoredConnection = {
  id: string
  status: ToolStatus
  accounts?: number
  lastSync?: string
  itemsSynced?: number
  connectedAt?: string
  accessToken?: string
}

function readStore(): Record<string, StoredConnection> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, StoredConnection>
  } catch {
    return {}
  }
}

function writeStore(map: Record<string, StoredConnection>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function hasGoogleToken() {
  try {
    const raw = localStorage.getItem('orion_google_token_v1')
    return Boolean(raw && JSON.parse(raw)?.accessToken)
  } catch {
    return false
  }
}

/** Une fois : enregistre les outils déjà « connected » du catalogue (Slack, Notion…). */
export function seedCatalogConnections() {
  try {
    if (localStorage.getItem(SEED_KEY)) return
  } catch {
    return
  }

  const map = readStore()
  const now = new Date().toISOString()
  for (const tool of catalog) {
    if (tool.status !== 'connected' && tool.status !== 'syncing') continue
    if (map[tool.id]?.status === 'error') continue
    map[tool.id] = {
      id: tool.id,
      status: tool.status,
      accounts: tool.accounts ?? 1,
      lastSync: tool.lastSync ?? 'À l’instant',
      itemsSynced: tool.itemsSynced ?? syncTargetFor(tool.id),
      connectedAt: now,
    }
  }
  writeStore(map)
  localStorage.setItem(SEED_KEY, '1')
}

/** Fusionne le catalogue avec l’état persisté des connexions. */
export function loadToolsWithConnections(): ConnectedTool[] {
  seedCatalogConnections()
  const stored = readStore()
  const googleTokenOk = hasGoogleToken()
  const googleIds = new Set(['gmail', 'drive', 'calendar'])

  return catalog.map((tool) => {
    const s = stored[tool.id]

    if (googleIds.has(tool.id) && !googleTokenOk) {
      // Garde l’échec OAuth Gmail visible ; sinon privilégie le catalogue (ex. Drive connecté démo).
      if (s?.status === 'error') {
        return {
          ...tool,
          status: 'error' as ToolStatus,
          lastSync: s.lastSync ?? 'Échec OAuth',
          itemsSynced: s.itemsSynced,
          accounts: s.accounts,
        }
      }
      if (!s) return { ...tool }
      return {
        ...tool,
        status: s.status === 'available' ? tool.status : s.status,
        accounts: s.accounts ?? tool.accounts,
        lastSync: s.lastSync ?? tool.lastSync,
        itemsSynced: s.itemsSynced ?? tool.itemsSynced,
      }
    }

    if (!s) return { ...tool }
    return {
      ...tool,
      status: s.status,
      accounts: s.accounts,
      lastSync: s.lastSync,
      itemsSynced: s.itemsSynced,
    }
  })
}

export function saveConnection(conn: StoredConnection) {
  const map = readStore()
  map[conn.id] = conn
  writeStore(map)
}

export function removeConnection(id: string) {
  const map = readStore()
  delete map[id]
  writeStore(map)
}

export function createAccessToken(toolId: string) {
  const rand = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return `orion_${toolId}_${rand}`
}

export async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Volumes de sync réalistes par outil après connexion. */
export function syncTargetFor(toolId: string) {
  const targets: Record<string, number> = {
    gmail: 12840,
    slack: 45200,
    notion: 892,
    drive: 3402,
    hubspot: 2140,
    calendar: 486,
    linear: 1204,
    intercom: 980,
    stripe: 640,
    salesforce: 3100,
    dropbox: 1800,
    asana: 754,
    outlook: 9200,
    yahoo: 4100,
    icloud: 2800,
    imap: 1500,
    github: 2100,
    zendesk: 430,
    airtable: 1120,
  }
  return targets[toolId] ?? 500
}
