import {
  authModeFor,
  googleToolIds,
  imapToolIds,
  isEdgeProviderConfigured,
  isGoogleConfigured,
  oauthToolIds,
} from './config'
import {
  connectImap,
  disconnectRemote,
  requestCatalogConnector,
  startOAuth,
} from './bridge'
import { getCustomTool } from './customConnectors'
import { requestGoogleAccessToken, revokeGoogleToken } from './google/gis'
import {
  clearGoogleToken,
  getGoogleAccessToken,
  readGoogleToken,
  saveGoogleToken,
} from './google/tokenStore'
import { fetchGoogleProfile } from './google/userinfo'
import { getProfileEmailCount } from './google/gmail'
import { listDriveFiles } from './google/drive'
import { listUpcomingEvents } from './google/calendar'

export type ConnectResult = {
  itemsSynced: number
  accountLabel?: string
  accessToken?: string
  note?: string
  /** OAuth redirect en cours — le statut final arrive au retour callback. */
  pendingRedirect?: boolean
  /** Logiciel ajouté sans OAuth (activation Orion). */
  pendingActivation?: boolean
}

export function toolCanConnectForReal(toolId: string) {
  const mode = authModeFor(toolId)
  if (!mode) return false
  if (mode === 'google') return isGoogleConfigured()
  if (mode === 'imap') return true
  return isEdgeProviderConfigured(toolId)
}

export async function connectToolLive(
  toolId: string,
  options?: {
    emailHint?: string
    imapHost?: string
    imapPort?: number
    password?: string
    displayName?: string
    productUrl?: string
  },
): Promise<ConnectResult> {
  const mode = authModeFor(toolId)
  if (!mode) {
    throw new Error(`Outil inconnu : ${toolId}`)
  }

  if (mode === 'imap') {
    const email = options?.emailHint?.trim()
    const password = options?.password?.trim()
    if (!email) throw new Error('Indiquez l’adresse e-mail à connecter.')
    if (!password) {
      throw new Error(
        'Indiquez le mot de passe d’application (Yahoo / iCloud / IMAP).',
      )
    }
    const result = await connectImap({
      provider: toolId,
      email,
      password,
      imapHost: options?.imapHost,
      imapPort: options?.imapPort,
    })
    return {
      itemsSynced: result.itemsSynced,
      accountLabel: result.accountLabel,
      note: result.note,
    }
  }

  if (mode === 'oauth') {
    const custom = getCustomTool(toolId)
    if (custom?.permissions.includes('Session Desktop')) {
      const desk = window.orionDesktop
      if (!desk?.openSessionApp) {
        throw new Error(
          'Ce logiciel est lié en session Desktop. Ouvrez ORION Core Desktop pour l’utiliser.',
        )
      }
      const url = custom.domain
        ? `https://${custom.domain}`
        : options?.productUrl || 'https://example.com'
      await desk.openSessionApp({
        slug: toolId,
        url,
        name: custom.name,
      })
      return {
        itemsSynced: 1,
        accountLabel: custom.name,
        note: 'Session Desktop ouverte',
      }
    }

    // Pas de secrets serveur → demande d’activation (évite l’erreur Edge non-2xx)
    if (!isEdgeProviderConfigured(toolId)) {
      const res = await requestCatalogConnector({
        provider: toolId,
        name: options?.displayName || toolId,
        productUrl:
          options?.productUrl ||
          `https://${toolId === 'github' ? 'github.com' : `${toolId}.com`}`,
      })
      return {
        itemsSynced: 0,
        note: res.note,
        pendingActivation: true,
      }
    }
    const redirectTo = `${window.location.origin}/connexions`
    const { authorizeUrl } = await startOAuth(toolId, redirectTo)
    const desktop = window.orionDesktop
    if (desktop?.openOAuthWindow) {
      const result = await desktop.openOAuthWindow({
        authorizeUrl,
        redirectPrefix: window.location.origin,
      })
      if (result?.url) {
        window.location.assign(result.url)
      }
      return {
        itemsSynced: 0,
        pendingRedirect: true,
        note: 'OAuth Desktop…',
      }
    }
    window.location.assign(authorizeUrl)
    return {
      itemsSynced: 0,
      pendingRedirect: true,
      note: 'Redirection OAuth…',
    }
  }

  // Google GIS
  if (!isGoogleConfigured()) {
    throw new Error(
      'Setup Google manquant. Allez dans Setup Google (/setup-google) et collez le Client ID.',
    )
  }

  const hint = options?.emailHint?.trim()
  const accessToken = await requestGoogleAccessToken({
    prompt: 'consent',
    emailHint: hint,
  })
  const profile = await fetchGoogleProfile(accessToken)

  if (hint) {
    const wanted = hint.toLowerCase()
    const got = profile.email.toLowerCase()
    if (wanted !== got) {
      throw new Error(
        `Vous avez confirmé ${hint}, mais Google a connecté ${profile.email}. Recommencez avec le bon compte.`,
      )
    }
  }

  saveGoogleToken({
    accessToken,
    obtainedAt: Date.now(),
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  })

  if (toolId === 'gmail') {
    const profileMail = await getProfileEmailCount(accessToken)
    return {
      itemsSynced: profileMail.messagesTotal ?? 0,
      accountLabel: profileMail.emailAddress || profile.email,
      accessToken,
    }
  }

  if (toolId === 'drive') {
    const files = await listDriveFiles(accessToken, 50)
    return {
      itemsSynced: files.length,
      accountLabel: profile.email,
      accessToken,
    }
  }

  if (toolId === 'calendar') {
    const events = await listUpcomingEvents(accessToken, 40)
    return {
      itemsSynced: events.length,
      accountLabel: profile.email,
      accessToken,
    }
  }

  throw new Error(`Connexion Google non gérée pour « ${toolId} ».`)
}

export async function disconnectToolLive(toolId: string) {
  if (googleToolIds.has(toolId)) {
    await disconnectGoogleTools()
    return
  }
  if (
    imapToolIds.has(toolId) ||
    oauthToolIds.has(toolId) ||
    toolId.startsWith('custom_')
  ) {
    try {
      await disconnectRemote(toolId)
    } catch {
      /* local cleanup anyway */
    }
  }
  const desktop = window.orionDesktop
  if (desktop?.clearSession && toolId.startsWith('custom_')) {
    try {
      await desktop.clearSession({ slug: toolId })
    } catch {
      /* ignore */
    }
  }
}

export async function disconnectGoogleTools() {
  const token = getGoogleAccessToken()
  if (token) {
    try {
      await revokeGoogleToken(token)
    } catch {
      /* ignore */
    }
  }
  clearGoogleToken()
}

export function googleSession() {
  return readGoogleToken()
}
