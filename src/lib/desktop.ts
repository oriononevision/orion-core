export type OrionDesktopApi = {
  isDesktop: true
  platform: string
  versions: { electron?: string; chrome?: string; node?: string }
  openSessionLogin: (input: {
    slug: string
    url: string
    name?: string
  }) => Promise<{ ok: boolean; slug: string; reused?: boolean; url?: string }>
  openSessionApp: (input: {
    slug: string
    url: string
    name?: string
  }) => Promise<{ ok: boolean; slug: string }>
  inspectSession: (input: {
    slug: string
    url?: string
  }) => Promise<{
    ok: boolean
    slug: string
    host: string
    cookieCount: number
    likelySignedIn: boolean
  }>
  clearSession: (input: { slug: string }) => Promise<{ ok: boolean; slug: string }>
  openOAuthWindow: (input: {
    authorizeUrl: string
    redirectPrefix: string
  }) => Promise<{ ok: boolean; url: string }>
}

declare global {
  interface Window {
    orionDesktop?: OrionDesktopApi
  }
}

export function isOrionDesktop(): boolean {
  return Boolean(typeof window !== 'undefined' && window.orionDesktop?.isDesktop)
}

export function desktopApi(): OrionDesktopApi | null {
  return typeof window !== 'undefined' ? window.orionDesktop ?? null : null
}

/** Slug stable pour un connecteur session (desktop). */
export function sessionSlugFromUrl(productUrl: string, name?: string): string {
  let host = ''
  try {
    host = new URL(
      productUrl.includes('://') ? productUrl : `https://${productUrl}`,
    ).hostname.replace(/^www\./, '')
  } catch {
    host = productUrl
  }
  const base = (name || host || 'app')
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  const slug = base.startsWith('custom_') ? base : `custom_${base || 'app'}`
  return slug
}
