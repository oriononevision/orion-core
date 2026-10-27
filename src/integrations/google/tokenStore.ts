const KEY = 'orion_google_token_v1'

export type GoogleTokenState = {
  accessToken: string
  obtainedAt: number
  email?: string
  name?: string
  picture?: string
}

export function saveGoogleToken(state: GoogleTokenState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function readGoogleToken(): GoogleTokenState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as GoogleTokenState
  } catch {
    return null
  }
}

export function clearGoogleToken() {
  localStorage.removeItem(KEY)
}

export function getGoogleAccessToken(): string | null {
  return readGoogleToken()?.accessToken ?? null
}
