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
  window.dispatchEvent(new Event('orion-google-config'))
}

/** Client ID : .env prioritaire, sinon setup collé une fois dans Core. */
export function getGoogleClientId(): string {
  const fromEnv = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''
  if (fromEnv) return fromEnv
  if (typeof window === 'undefined') return ''
  return getStoredGoogleClientId()
}

/** @deprecated use getGoogleClientId() */
export const googleClientId =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

export type AuthMode = 'google' | 'oauth' | 'imap'

export const googleToolIds = new Set(['gmail', 'drive', 'calendar'])

/** OAuth via Edge Functions (secrets côté serveur). */
export const oauthToolIds = new Set([
  'outlook',
  'slack',
  'notion',
  'hubspot',
  'dropbox',
  'asana',
  'github',
  'airtable',
  'linear',
  'intercom',
  'salesforce',
  'zendesk',
  'stripe',
])

/** IMAP + mot de passe d’application (yahoo / icloud / imap générique). */
export const imapToolIds = new Set(['yahoo', 'icloud', 'imap'])

/** @deprecated alias — mails hors Gmail qui utilisaient le formulaire local */
export const altMailToolIds = imapToolIds

/** IDs OAuth dynamiques (connecteurs ajoutés via lien). */
let dynamicOauthIds = new Set<string>()

export function setDynamicOauthIds(ids: string[]) {
  dynamicOauthIds = new Set(ids)
}

export function authModeFor(toolId: string): AuthMode | null {
  if (googleToolIds.has(toolId)) return 'google'
  if (oauthToolIds.has(toolId) || dynamicOauthIds.has(toolId) || toolId.startsWith('custom_')) {
    return 'oauth'
  }
  if (imapToolIds.has(toolId)) return 'imap'
  return null
}

export function isGoogleConfigured() {
  return Boolean(getGoogleClientId())
}

/** Cache runtime des providers configurés côté Edge (rempli par connections-list). */
let edgeConfigured: Record<string, boolean> | null = null

export function setEdgeConfiguredMap(map: Record<string, boolean> | null) {
  edgeConfigured = map
}

export function isEdgeProviderConfigured(toolId: string): boolean {
  if (googleToolIds.has(toolId)) return isGoogleConfigured()
  if (imapToolIds.has(toolId)) return true
  if (toolId.startsWith('custom_') || dynamicOauthIds.has(toolId)) {
    if (!edgeConfigured) return true
    return edgeConfigured[toolId] !== false
  }
  if (!edgeConfigured) {
    return oauthToolIds.has(toolId)
  }
  return Boolean(edgeConfigured[toolId])
}

export function providerConfigured(toolId: string) {
  return isEdgeProviderConfigured(toolId)
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
