const LS_GOOGLE_CLIENT = 'orion_google_client_id_v1'

export function getStoredGoogleClientId(): string {
  try {
    return (localStorage.getItem(LS_GOOGLE_CLIENT) || '').trim()
  } catch {
    return ''
  }
}

export function setStoredGoogleClientId(id: string) {
  const v = id.trim()
  if (!v) localStorage.removeItem(LS_GOOGLE_CLIENT)
  else localStorage.setItem(LS_GOOGLE_CLIENT, v)
  // Notifie l’app qu’il faut re-évaluer isGoogleConfigured
  window.dispatchEvent(new Event('orion-google-config'))
}

/** Client ID : .env prioritaire, sinon setup collé une fois dans Core. */
export function getGoogleClientId(): string {
  const fromEnv = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''
  if (fromEnv) return fromEnv
  if (typeof window === 'undefined') return ''
  return getStoredGoogleClientId()
}

/** @deprecated use getGoogleClientId() — gardé pour imports existants */
export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''

export const oauthClients = {
  get google() {
    return getGoogleClientId()
  },
  slack: (import.meta.env.VITE_SLACK_CLIENT_ID as string | undefined)?.trim() ?? '',
  notion: (import.meta.env.VITE_NOTION_CLIENT_ID as string | undefined)?.trim() ?? '',
  hubspot: (import.meta.env.VITE_HUBSPOT_CLIENT_ID as string | undefined)?.trim() ?? '',
  dropbox: (import.meta.env.VITE_DROPBOX_CLIENT_ID as string | undefined)?.trim() ?? '',
  asana: (import.meta.env.VITE_ASANA_CLIENT_ID as string | undefined)?.trim() ?? '',
  github: (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)?.trim() ?? '',
  airtable: (import.meta.env.VITE_AIRTABLE_CLIENT_ID as string | undefined)?.trim() ?? '',
}

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

export const googleToolIds = new Set(['gmail', 'drive', 'calendar'])

export function isGoogleConfigured() {
  return Boolean(getGoogleClientId())
}

/** Providers mail hors Gmail : connectables via formulaire (IMAP / Outlook). */
export const altMailToolIds = new Set(['outlook', 'yahoo', 'icloud', 'imap'])

export function providerConfigured(toolId: string) {
  if (googleToolIds.has(toolId)) return isGoogleConfigured()
  if (altMailToolIds.has(toolId)) return true
  if (toolId === 'slack') return Boolean(oauthClients.slack)
  if (toolId === 'notion') return Boolean(oauthClients.notion)
  if (toolId === 'hubspot') return Boolean(oauthClients.hubspot)
  if (toolId === 'dropbox') return Boolean(oauthClients.dropbox)
  if (toolId === 'asana') return Boolean(oauthClients.asana)
  if (toolId === 'github') return Boolean(oauthClients.github)
  if (toolId === 'airtable') return Boolean(oauthClients.airtable)
  return false
}

export const GOOGLE_SETUP_LINKS = {
  console: 'https://console.cloud.google.com/',
  newProject: 'https://console.cloud.google.com/projectcreate',
  enableGmail: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
  enableDrive: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
  enableCalendar: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
  consent: 'https://console.cloud.google.com/apis/credentials/consent',
  credentials: 'https://console.cloud.google.com/apis/credentials',
}
