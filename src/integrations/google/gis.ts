import { GOOGLE_SCOPES, getGoogleClientId } from '../config'

let scriptPromise: Promise<void> | null = null

export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('GIS load failed')))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.gis = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Impossible de charger Google Identity Services'))
    document.head.appendChild(s)
  })

  return scriptPromise
}

export async function requestGoogleAccessToken(options?: {
  prompt?: '' | 'consent'
  /** Adresse e-mail saisie par l’utilisateur — Google pré-sélectionne ce compte. */
  emailHint?: string
}): Promise<string> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error(
      'Setup Google manquant. Allez dans Réglages → Setup Google et collez le Client ID.',
    )
  }

  await loadGoogleIdentity()
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services indisponible')
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      hint: options?.emailHint?.trim() || undefined,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'Autorisation Google refusée'))
          return
        }
        resolve(resp.access_token)
      },
      error_callback: (err) => {
        reject(new Error(err.message || err.type || 'Erreur OAuth Google'))
      },
    })

    client.requestAccessToken({ prompt: options?.prompt ?? 'consent' })
  })
}

export function revokeGoogleToken(token: string) {
  return new Promise<void>((resolve) => {
    if (!window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    window.google.accounts.oauth2.revoke(token, () => resolve())
  })
}
