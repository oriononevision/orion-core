import type { CustomConnector } from './bridge'
import { customConnectorToTool, getCustomTool, setCustomConnectors } from './customConnectors'
import { saveConnection } from '../lib/connectionStore'
import type { ConnectedTool } from '../data/tools'

const LS_KEY = 'orion_desktop_session_connectors_v1'

export type LocalSessionConnector = {
  slug: string
  name: string
  product_url: string
  logo_url?: string | null
  category?: string
  account_label?: string
  cookie_count?: number
  connected_at: string
}

function readLocal(): LocalSessionConnector[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalSessionConnector[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(list: LocalSessionConnector[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export function listLocalSessionConnectors(): LocalSessionConnector[] {
  return readLocal()
}

export function upsertLocalSessionConnector(row: LocalSessionConnector) {
  const list = readLocal().filter((c) => c.slug !== row.slug)
  list.push(row)
  writeLocal(list)
}

export function removeLocalSessionConnector(slug: string) {
  writeLocal(readLocal().filter((c) => c.slug !== slug))
}

export function localSessionAsCustom(row: LocalSessionConnector): CustomConnector {
  return {
    slug: row.slug,
    name: row.name,
    product_url: row.product_url,
    logo_url: row.logo_url ?? null,
    category: row.category || 'productivite',
    scopes: '__orion_session__',
    visibility: 'private',
    owner_user_id: null,
    configured: true,
    authMode: 'session',
  }
}

/** Fusionne les sessions Desktop locales dans le registre custom en mémoire. */
export function mergeLocalSessionsIntoCustoms(remote: CustomConnector[]): CustomConnector[] {
  const locals = readLocal().map(localSessionAsCustom)
  const bySlug = new Map<string, CustomConnector>()
  for (const c of remote) bySlug.set(c.slug, c)
  for (const c of locals) bySlug.set(c.slug, c)
  const merged = Array.from(bySlug.values())
  setCustomConnectors(merged)
  return merged
}

export function applyLocalSessionConnections(tools: ConnectedTool[]): ConnectedTool[] {
  const locals = readLocal()
  if (!locals.length) return tools
  const byId = new Map(tools.map((t) => [t.id, t]))
  for (const row of locals) {
    const asCustom = localSessionAsCustom(row)
    const base = customConnectorToTool(asCustom)
    const existing = byId.get(row.slug)
    byId.set(row.slug, {
      ...base,
      ...existing,
      name: row.name,
      status: 'connected',
      lastSync: 'Session Desktop',
      accounts: 1,
      itemsSynced: row.cookie_count || existing?.itemsSynced || 1,
      description: base.description,
      permissions: base.permissions,
      features: base.features,
      logo: base.logo,
      domain: base.domain,
    })
    saveConnection({
      id: row.slug,
      status: 'connected',
      accounts: 1,
      lastSync: 'Session Desktop',
      itemsSynced: row.cookie_count || 1,
      connectedAt: row.connected_at,
      accountLabel: row.account_label || row.name,
    })
  }
  return Array.from(byId.values())
}

export function isSessionTool(id: string): boolean {
  const local = readLocal().some((c) => c.slug === id)
  if (local) return true
  const custom = getCustomTool(id)
  return Boolean(custom?.permissions.includes('Session Desktop'))
}
