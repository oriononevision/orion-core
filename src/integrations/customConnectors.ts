import type { ConnectedTool, ToolCategory } from '../data/tools'
import type { CustomConnector } from './bridge'

let customById: Record<string, ConnectedTool> = {}

export function setCustomConnectors(list: CustomConnector[]) {
  const next: Record<string, ConnectedTool> = {}
  for (const c of list) {
    next[c.slug] = customConnectorToTool(c)
  }
  customById = next
}

export function getCustomTool(id: string): ConnectedTool | undefined {
  return customById[id]
}

export function listCustomTools(): ConnectedTool[] {
  return Object.values(customById)
}

export function customConnectorToTool(c: CustomConnector): ConnectedTool {
  let domain = c.product_url
  try {
    domain = new URL(
      c.product_url.includes('://') ? c.product_url : `https://${c.product_url}`,
    ).hostname.replace(/^www\./, '')
  } catch {
    /* keep raw */
  }

  const category = (c.category as ToolCategory) || 'productivite'
  const pending = c.scopes === '__orion_pending__'
  const session = c.scopes === '__orion_session__' || c.authMode === 'session'

  return {
    id: c.slug,
    name: c.name,
    category,
    status: pending ? 'syncing' : session ? 'connected' : 'available',
    description: pending
      ? `Demande reçue · activation Orion en cours (${domain})`
      : session
        ? `Connecté sur Desktop · session ${domain}`
        : `Connecteur ajouté via lien · ${domain}`,
    color: '#5eb8ff',
    initial: c.name.slice(0, 2).toUpperCase(),
    logo:
      c.logo_url ||
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    domain,
    permissions: pending
      ? ['En activation']
      : session
        ? ['Session Desktop']
        : ['OAuth'],
    features: pending
      ? ['En attente']
      : session
        ? ['Connexion navigateur']
        : ['Connexion dynamique'],
    lastSync: pending ? 'Activation…' : session ? 'Session active' : undefined,
  }
}
