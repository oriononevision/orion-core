import { tools as catalog, type ConnectedTool, type ToolStatus } from '../data/tools'
import type { RemoteConnection } from '../integrations/bridge'

const STORAGE_KEY = 'orion_core_connections_v1'

export type StoredConnection = {
  id: string
  status: ToolStatus
  accounts?: number
  lastSync?: string
  itemsSynced?: number
  connectedAt?: string
  accessToken?: string
  accountLabel?: string
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

/** Fusionne le catalogue avec l’état local (+ Google token). */
export function loadToolsWithConnections(): ConnectedTool[] {
  const stored = readStore()
  const googleTokenOk = hasGoogleToken()
  const googleIds = new Set(['gmail', 'drive', 'calendar'])

  return catalog.map((tool) => {
    const s = stored[tool.id]
    const base: ConnectedTool = {
      ...tool,
      status: 'available',
      accounts: undefined,
      lastSync: undefined,
      itemsSynced: undefined,
    }

    if (googleIds.has(tool.id)) {
      if (googleTokenOk && s?.status === 'connected') {
        return {
          ...base,
          status: 'connected',
          accounts: s.accounts ?? 1,
          lastSync: s.lastSync ?? 'À l’instant',
          itemsSynced: s.itemsSynced,
        }
      }
      if (s?.status === 'error') {
        return {
          ...base,
          status: 'error',
          lastSync: s.lastSync ?? 'Échec OAuth',
        }
      }
      if (googleTokenOk) {
        return {
          ...base,
          status: 'connected',
          accounts: 1,
          lastSync: s?.lastSync ?? 'À l’instant',
          itemsSynced: s?.itemsSynced,
        }
      }
      return base
    }

    if (!s) return base
    return {
      ...base,
      status: s.status,
      accounts: s.accounts,
      lastSync: s.lastSync,
      itemsSynced: s.itemsSynced,
    }
  })
}

/** Applique les lignes `user_connections` (sans tokens) sur le store local. */
export function applyRemoteConnections(rows: RemoteConnection[]): ConnectedTool[] {
  const map = readStore()
  const remoteIds = new Set(rows.map((r) => r.provider))

  for (const id of Object.keys(map)) {
    if (['gmail', 'drive', 'calendar'].includes(id)) continue
    if (!remoteIds.has(id)) delete map[id]
  }

  for (const row of rows) {
    const status: ToolStatus =
      row.status === 'connected' || row.status === 'pending_sync'
        ? row.status === 'pending_sync'
          ? 'syncing'
          : 'connected'
        : row.status === 'error'
          ? 'error'
          : 'available'

    map[row.provider] = {
      id: row.provider,
      status,
      accounts: 1,
      lastSync:
        status === 'syncing'
          ? 'Activation…'
          : row.last_sync
            ? formatRelative(row.last_sync)
            : status === 'connected'
              ? 'À l’instant'
              : undefined,
      itemsSynced: row.items_synced ?? 0,
      connectedAt: row.connected_at ?? undefined,
      accountLabel: row.account_label ?? undefined,
    }
  }

  writeStore(map)
  return loadToolsWithConnections()
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const diff = Date.now() - t
  if (diff < 60_000) return 'À l’instant'
  if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`
  return new Date(t).toLocaleString('fr-FR')
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

export async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

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
