/** Registry OAuth — un seul callback pour tous les providers. */

export type OAuthProviderConfig = {
  id: string
  authorizeUrl: string
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
  scopes: string
  /** Extra query params on authorize */
  authorizeExtra?: Record<string, string>
  /** token exchange style — stripe = Basic(sk_:) comme documenté par Connect */
  tokenAuth?: 'body' | 'basic' | 'stripe'
  verify: (accessToken: string, meta?: Record<string, unknown>) => Promise<{
    accountLabel: string
    itemsSynced?: number
    meta?: Record<string, unknown>
  }>
}

function env(name: string): string {
  return Deno.env.get(name)?.trim() ?? ''
}

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    throw new Error(
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}: ${text.slice(0, 200)}`,
    )
  }
  return body as Record<string, unknown>
}

export const oauthProviders: Record<string, OAuthProviderConfig> = {
  outlook: {
    id: 'outlook',
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientIdEnv: 'MS_CLIENT_ID',
    clientSecretEnv: 'MS_CLIENT_SECRET',
    scopes: 'openid offline_access User.Read Mail.Read Calendars.Read',
    authorizeExtra: { response_mode: 'query' },
    verify: async (token) => {
      const me = await jsonFetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return {
        accountLabel: String(me.mail || me.userPrincipalName || me.displayName || 'Outlook'),
        itemsSynced: 0,
        meta: { name: me.displayName },
      }
    },
  },
  slack: {
    id: 'slack',
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
    scopes: 'channels:read,chat:write,users:read,files:read',
    verify: async (token) => {
      const res = await jsonFetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (!res.ok) throw new Error(String(res.error || 'Slack auth.test failed'))
      return {
        accountLabel: String(res.user || res.team || 'Slack'),
        itemsSynced: 0,
        meta: { team: res.team, user_id: res.user_id },
      }
    },
  },
  notion: {
    id: 'notion',
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    clientIdEnv: 'NOTION_CLIENT_ID',
    clientSecretEnv: 'NOTION_CLIENT_SECRET',
    scopes: '',
    authorizeExtra: { owner: 'user' },
    tokenAuth: 'basic',
    verify: async (token) => {
      const me = await jsonFetch('https://api.notion.com/v1/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
        },
      })
      const name =
        (me as { name?: string; bot?: { owner?: { user?: { name?: string } } } }).name ||
        (me as { bot?: { owner?: { user?: { name?: string } } } }).bot?.owner?.user?.name ||
        'Notion'
      return { accountLabel: String(name), itemsSynced: 0 }
    },
  },
  hubspot: {
    id: 'hubspot',
    authorizeUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    clientIdEnv: 'HUBSPOT_CLIENT_ID',
    clientSecretEnv: 'HUBSPOT_CLIENT_SECRET',
    scopes: 'crm.objects.contacts.read crm.objects.deals.read oauth',
    verify: async (token) => {
      const info = await jsonFetch(`https://api.hubapi.com/oauth/v1/access-tokens/${token}`)
      return {
        accountLabel: String(info.user || info.hub_domain || 'HubSpot'),
        itemsSynced: 0,
        meta: { hub_id: info.hub_id },
      }
    },
  },
  dropbox: {
    id: 'dropbox',
    authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    clientIdEnv: 'DROPBOX_CLIENT_ID',
    clientSecretEnv: 'DROPBOX_CLIENT_SECRET',
    scopes: '',
    authorizeExtra: { token_access_type: 'offline' },
    verify: async (token) => {
      const me = await jsonFetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: 'null',
      })
      return {
        accountLabel: String(
          (me as { email?: string; name?: { display_name?: string } }).email ||
            (me as { name?: { display_name?: string } }).name?.display_name ||
            'Dropbox',
        ),
        itemsSynced: 0,
      }
    },
  },
  asana: {
    id: 'asana',
    authorizeUrl: 'https://app.asana.com/-/oauth_authorize',
    tokenUrl: 'https://app.asana.com/-/oauth_token',
    clientIdEnv: 'ASANA_CLIENT_ID',
    clientSecretEnv: 'ASANA_CLIENT_SECRET',
    scopes: 'default',
    verify: async (token) => {
      const me = await jsonFetch('https://app.asana.com/api/1.0/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (me as { data?: { email?: string; name?: string } }).data
      return { accountLabel: String(data?.email || data?.name || 'Asana'), itemsSynced: 0 }
    },
  },
  github: {
    id: 'github',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    scopes: 'repo read:user',
    verify: async (token) => {
      const me = await jsonFetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ORION-Core',
        },
      })
      return {
        accountLabel: String(me.login || me.name || 'GitHub'),
        itemsSynced: Number(me.public_repos ?? 0),
      }
    },
  },
  airtable: {
    id: 'airtable',
    authorizeUrl: 'https://airtable.com/oauth2/v1/authorize',
    tokenUrl: 'https://airtable.com/oauth2/v1/token',
    clientIdEnv: 'AIRTABLE_CLIENT_ID',
    clientSecretEnv: 'AIRTABLE_CLIENT_SECRET',
    scopes: 'data.records:read schema.bases:read',
    tokenAuth: 'basic',
    verify: async (token) => {
      const me = await jsonFetch('https://api.airtable.com/v0/meta/whoami', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { accountLabel: String(me.id || 'Airtable'), itemsSynced: 0 }
    },
  },
  linear: {
    id: 'linear',
    authorizeUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    clientIdEnv: 'LINEAR_CLIENT_ID',
    clientSecretEnv: 'LINEAR_CLIENT_SECRET',
    scopes: 'read write',
    verify: async (token) => {
      const res = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ viewer { id name email } }' }),
      })
      const body = (await res.json()) as {
        data?: { viewer?: { name?: string; email?: string } }
        errors?: unknown
      }
      if (!res.ok || body.errors) throw new Error('Linear viewer failed')
      return {
        accountLabel: String(body.data?.viewer?.email || body.data?.viewer?.name || 'Linear'),
        itemsSynced: 0,
      }
    },
  },
  intercom: {
    id: 'intercom',
    authorizeUrl: 'https://app.intercom.com/oauth',
    tokenUrl: 'https://api.intercom.io/auth/eagle/token',
    clientIdEnv: 'INTERCOM_CLIENT_ID',
    clientSecretEnv: 'INTERCOM_CLIENT_SECRET',
    scopes: '',
    verify: async (token) => {
      const me = await jsonFetch('https://api.intercom.io/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Intercom-Version': '2.11',
        },
      })
      return {
        accountLabel: String(
          (me as { email?: string; name?: string; app?: { name?: string } }).email ||
            (me as { app?: { name?: string } }).app?.name ||
            'Intercom',
        ),
        itemsSynced: 0,
      }
    },
  },
  salesforce: {
    id: 'salesforce',
    authorizeUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    clientIdEnv: 'SALESFORCE_CLIENT_ID',
    clientSecretEnv: 'SALESFORCE_CLIENT_SECRET',
    scopes: 'api refresh_token',
    verify: async (token, meta) => {
      const instance = String(meta?.instance_url || '')
      if (!instance) {
        return { accountLabel: 'Salesforce', itemsSynced: 0 }
      }
      const me = await jsonFetch(`${instance}/services/oauth2/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return {
        accountLabel: String(me.email || me.preferred_username || 'Salesforce'),
        itemsSynced: 0,
        meta: { instance_url: instance },
      }
    },
  },
  zendesk: {
    id: 'zendesk',
    authorizeUrl: '', // filled dynamically with subdomain
    tokenUrl: '',
    clientIdEnv: 'ZENDESK_CLIENT_ID',
    clientSecretEnv: 'ZENDESK_CLIENT_SECRET',
    scopes: 'read write',
    verify: async (token, meta) => {
      const subdomain = String(meta?.subdomain || env('ZENDESK_SUBDOMAIN') || '')
      if (!subdomain) return { accountLabel: 'Zendesk', itemsSynced: 0 }
      const me = await jsonFetch(`https://${subdomain}.zendesk.com/api/v2/users/me.json`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const user = (me as { user?: { email?: string; name?: string } }).user
      return { accountLabel: String(user?.email || user?.name || 'Zendesk'), itemsSynced: 0 }
    },
  },
  stripe: {
    id: 'stripe',
    authorizeUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    clientIdEnv: 'STRIPE_CLIENT_ID',
    clientSecretEnv: 'STRIPE_SECRET_KEY',
    scopes: 'read_write',
    tokenAuth: 'stripe',
    authorizeExtra: { response_type: 'code' },
    verify: async (token) => {
      // Token Connect = accès au compte connecté
      const me = await jsonFetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const biz = me.business_profile as { name?: string } | undefined
      return {
        accountLabel: String(me.email || biz?.name || me.id || 'Stripe'),
        itemsSynced: 0,
        meta: { stripe_user_id: me.id },
      }
    },
  },
}

export function getProviderConfig(id: string): OAuthProviderConfig | null {
  if (id === 'zendesk') {
    const subdomain = env('ZENDESK_SUBDOMAIN')
    const base = oauthProviders.zendesk
    if (!subdomain) return { ...base, authorizeUrl: '', tokenUrl: '' }
    return {
      ...base,
      authorizeUrl: `https://${subdomain}.zendesk.com/oauth/authorizations/new`,
      tokenUrl: `https://${subdomain}.zendesk.com/oauth/tokens`,
    }
  }
  return oauthProviders[id] ?? null
}

export function isProviderConfigured(id: string): boolean {
  // Stripe : secret key seule suffit (Account Links). OAuth ca_ optionnel.
  if (id === 'stripe') {
    return Boolean(env('STRIPE_SECRET_KEY'))
  }
  const cfg = getProviderConfig(id)
  if (!cfg) return false
  if (!cfg.authorizeUrl || !cfg.tokenUrl) return false
  return Boolean(env(cfg.clientIdEnv) && env(cfg.clientSecretEnv))
}

export function buildAuthorizeUrl(
  cfg: OAuthProviderConfig,
  redirectUri: string,
  state: string,
): string {
  const clientId = env(cfg.clientIdEnv)
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  if (cfg.scopes) url.searchParams.set('scope', cfg.scopes)
  for (const [k, v] of Object.entries(cfg.authorizeExtra ?? {})) {
    url.searchParams.set(k, v)
  }
  // Notion requires encoded redirect
  if (cfg.id === 'notion') {
    url.searchParams.set('redirect_uri', redirectUri)
  }
  return url.toString()
}

export async function exchangeCode(
  cfg: OAuthProviderConfig,
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
  const clientId = env(cfg.clientIdEnv)
  const clientSecret = env(cfg.clientSecretEnv)
  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', redirectUri)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (cfg.tokenAuth === 'stripe') {
    headers.Authorization = `Basic ${btoa(`${clientSecret}:`)}`
    body.set('client_id', clientId)
  } else if (cfg.tokenAuth === 'basic') {
    headers.Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`
  } else {
    body.set('client_id', clientId)
    body.set('client_secret', clientSecret)
  }

  // Slack uses different param names sometimes — still works with standard
  const res = await fetch(cfg.tokenUrl, { method: 'POST', headers, body })
  const text = await res.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    // GitHub may return form-encoded if Accept missing — we set Accept
    data = Object.fromEntries(new URLSearchParams(text))
  }

  if (!res.ok || data.error) {
    throw new Error(String(data.error_description || data.error || text.slice(0, 200)))
  }

  // Slack oauth.v2.access nests token
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

export const IMAP_PRESETS: Record<
  string,
  { host: string; port: number; label: string }
> = {
  yahoo: { host: 'imap.mail.yahoo.com', port: 993, label: 'Yahoo Mail' },
  icloud: { host: 'imap.mail.me.com', port: 993, label: 'iCloud Mail' },
  imap: { host: '', port: 993, label: 'IMAP' },
  outlook: { host: 'outlook.office365.com', port: 993, label: 'Outlook IMAP' },
}
