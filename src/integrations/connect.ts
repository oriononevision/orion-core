import {
  altMailToolIds,
  googleToolIds,
  isGoogleConfigured,
  oauthClients,
  providerConfigured,
} from './config'
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
import { connectImapStyleAccount, type MailProviderId } from './mail/accounts'
import { createAccessToken, syncTargetFor, wait } from '../lib/connectionStore'

export type ConnectResult = {
  itemsSynced: number
  accountLabel?: string
  accessToken?: string
  note?: string
}

export function toolNeedsRealOAuth(toolId: string) {
  return providerConfigured(toolId) || googleToolIds.has(toolId)
}

export function toolCanConnectForReal(toolId: string) {
  // Tous les outils sont connectables : OAuth live si configuré, sinon flux démo (comme Gmail).
  void toolId
  return true
}

export async function connectToolLive(
  toolId: string,
  options?: { emailHint?: string; imapHost?: string; imapPort?: number },
): Promise<ConnectResult> {
  if (altMailToolIds.has(toolId)) {
    const email = options?.emailHint?.trim()
    if (!email) throw new Error('Indiquez l’adresse e-mail à connecter.')
    const account = connectImapStyleAccount({
      provider: toolId as Exclude<MailProviderId, 'gmail'>,
      email,
      imapHost: options?.imapHost,
      imapPort: options?.imapPort,
    })
    return {
      itemsSynced: 0,
      accountLabel: account.email,
      note: account.note,
    }
  }

  if (googleToolIds.has(toolId)) {
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
  }

  // Autres providers : ouverture OAuth réelle si client id présent
  if (toolId === 'github' && oauthClients.github) {
    const redirect = `${window.location.origin}/oauth/github`
    const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(oauthClients.github)}&scope=${encodeURIComponent('repo read:user')}&redirect_uri=${encodeURIComponent(redirect)}`
    window.open(url, '_blank', 'noopener,width=520,height=720')
    throw new Error(
      'Autorisez GitHub dans la fenêtre ouverte. Un backend est requis pour échanger le code OAuth (à brancher).',
    )
  }

  // Prototype : même parcours que Gmail (autorisation → sync → connecté) sans clé OAuth.
  if (!providerConfigured(toolId)) {
    await wait(450)
    return {
      itemsSynced: syncTargetFor(toolId),
      accountLabel: toolId,
      accessToken: createAccessToken(toolId),
      note: 'Connexion démo ORION Core. Branchez la clé OAuth du provider dans .env pour le live.',
    }
  }

  throw new Error(
    `Connexion réelle non configurée pour « ${toolId} ». Ajoutez la clé OAuth dans .env (voir .env.example).`,
  )
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
