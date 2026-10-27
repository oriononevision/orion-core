/** Config OAuth résolue (statique env OU connecteur dynamique DB). */

export type ResolvedOAuth = {
  id: string
  authorizeUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  scopes: string
  /** body = client_id+secret dans le corps ; basic = Basic(id:secret) ; stripe = Basic(sk_:) */
  tokenAuth: 'body' | 'basic' | 'stripe'
  authorizeExtra?: Record<string, string>
  userinfoUrl?: string
}

export function buildAuthorizeUrlResolved(
  cfg: ResolvedOAuth,
  redirectUri: string,
  state: string,
): string {
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  if (cfg.scopes) url.searchParams.set('scope', cfg.scopes)
  for (const [k, v] of Object.entries(cfg.authorizeExtra ?? {})) {
    url.searchParams.set(k, v)
  }
  return url.toString()
}

export async function exchangeCodeResolved(
  cfg: ResolvedOAuth,
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  instance_url?: string
  [key: string]: unknown
}> {
  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', redirectUri)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (cfg.tokenAuth === 'stripe') {
    // Stripe Connect : Basic avec la secret key (sk_…) et mot de passe vide
    headers.Authorization = `Basic ${btoa(`${cfg.clientSecret}:`)}`
    body.set('client_id', cfg.clientId)
  } else if (cfg.tokenAuth === 'basic') {
    headers.Authorization = `Basic ${btoa(`${cfg.clientId}:${cfg.clientSecret}`)}`
  } else {
    body.set('client_id', cfg.clientId)
    body.set('client_secret', cfg.clientSecret)
  }

  const res = await fetch(cfg.tokenUrl, { method: 'POST', headers, body })
  const text = await res.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    data = Object.fromEntries(new URLSearchParams(text))
  }

  if (!res.ok || data.error) {
    throw new Error(String(data.error_description || data.error || text.slice(0, 200)))
  }

  const access =
    (data.access_token as string) ||
    ((data.authed_user as { access_token?: string } | undefined)?.access_token)
  if (!access) throw new Error(`Pas d’access_token pour ${cfg.id}`)

  return {
    ...data,
    access_token: access,
    refresh_token: (data.refresh_token as string | undefined) || undefined,
    expires_in: data.expires_in ? Number(data.expires_in) : undefined,
    scope: (data.scope as string | undefined) || cfg.scopes,
    instance_url: data.instance_url as string | undefined,
  }
}

export async function verifyAccessToken(
  cfg: ResolvedOAuth,
  accessToken: string,
  extraMeta?: Record<string, unknown>,
): Promise<{ accountLabel: string; itemsSynced?: number; meta?: Record<string, unknown> }> {
  // Prefer provider-specific verify from static registry when available
  const { getProviderConfig } = await import('./providers.ts')
  const staticCfg = getProviderConfig(cfg.id)
  if (staticCfg?.verify) {
    try {
      return await staticCfg.verify(accessToken, extraMeta)
    } catch {
      /* fall through to generic */
    }
  }

  if (cfg.userinfoUrl) {
    const res = await fetch(cfg.userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const text = await res.text()
    let body: Record<string, unknown> = {}
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {}
    } catch {
      body = {}
    }
    if (!res.ok) {
      return { accountLabel: cfg.id, itemsSynced: 0, meta: { verify: 'userinfo_failed' } }
    }
    const label = String(
      body.email ||
        body.login ||
        body.name ||
        body.user ||
        body.preferred_username ||
        body.id ||
        cfg.id,
    )
    return { accountLabel: label, itemsSynced: 0, meta: body }
  }

  return { accountLabel: cfg.id, itemsSynced: 0 }
}
