/** Détection rapide d’un logiciel à partir de son URL / domaine. */

export type CatalogHit = {
  id: string
  name: string
  domain: string
  match: RegExp
  blurb: string
}

export const SOFTWARE_CATALOG: CatalogHit[] = [
  { id: 'slack', name: 'Slack', domain: 'slack.com', match: /slack\.com/i, blurb: 'Messagerie équipe' },
  { id: 'notion', name: 'Notion', domain: 'notion.so', match: /notion\.(so|site|com)/i, blurb: 'Docs & bases' },
  { id: 'hubspot', name: 'HubSpot', domain: 'hubspot.com', match: /hubspot\.com/i, blurb: 'CRM & marketing' },
  { id: 'github', name: 'GitHub', domain: 'github.com', match: /github\.com/i, blurb: 'Code & PRs' },
  { id: 'dropbox', name: 'Dropbox', domain: 'dropbox.com', match: /dropbox\.com/i, blurb: 'Fichiers' },
  { id: 'asana', name: 'Asana', domain: 'asana.com', match: /asana\.com/i, blurb: 'Tâches' },
  { id: 'linear', name: 'Linear', domain: 'linear.app', match: /linear\.app/i, blurb: 'Issues produit' },
  { id: 'intercom', name: 'Intercom', domain: 'intercom.com', match: /intercom\.com/i, blurb: 'Support' },
  { id: 'salesforce', name: 'Salesforce', domain: 'salesforce.com', match: /salesforce\.com|force\.com/i, blurb: 'CRM' },
  { id: 'stripe', name: 'Stripe', domain: 'stripe.com', match: /stripe\.com/i, blurb: 'Paiements' },
  { id: 'zendesk', name: 'Zendesk', domain: 'zendesk.com', match: /zendesk\.com/i, blurb: 'Tickets' },
  { id: 'airtable', name: 'Airtable', domain: 'airtable.com', match: /airtable\.com/i, blurb: 'Bases' },
  { id: 'outlook', name: 'Outlook', domain: 'outlook.com', match: /outlook\.com|office\.com|microsoft\.com/i, blurb: 'Mail Microsoft' },
  { id: 'gmail', name: 'Gmail', domain: 'gmail.com', match: /gmail\.com|google\.com\/gmail|workspace\.google/i, blurb: 'Mail Google' },
  { id: 'drive', name: 'Google Drive', domain: 'drive.google.com', match: /drive\.google\.com/i, blurb: 'Fichiers Google' },
  { id: 'calendar', name: 'Google Calendar', domain: 'calendar.google.com', match: /calendar\.google\.com/i, blurb: 'Agenda Google' },
]

export function detectFromUrl(raw: string): CatalogHit | null {
  const v = raw.trim()
  if (!v) return null
  for (const hit of SOFTWARE_CATALOG) {
    if (hit.match.test(v)) return hit
  }
  return null
}

export function normalizeProductUrl(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  return t.includes('://') ? t : `https://${t}`
}

export function domainFromUrl(raw: string): string {
  try {
    return new URL(normalizeProductUrl(raw)).hostname.replace(/^www\./, '')
  } catch {
    return raw.trim()
  }
}

export function guessDisplayName(raw: string): string {
  const d = domainFromUrl(raw)
  const base = d.split('.')[0] || d
  if (!base) return ''
  return base.charAt(0).toUpperCase() + base.slice(1)
}

export function faviconFor(raw: string): string {
  const d = domainFromUrl(raw)
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`
}
