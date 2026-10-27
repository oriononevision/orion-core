import { decryptSecret } from './crypto.ts'
import type { ResolvedOAuth } from './oauthRuntime.ts'
import { getProviderConfig, isProviderConfigured } from './providers.ts'
import { adminClient } from './supabase.ts'

function env(name: string): string {
  return Deno.env.get(name)?.trim() ?? ''
}

/** Résout un provider : catalogue fixe (env) OU connecteur dynamique (DB). */
export async function resolveOAuthProvider(providerId: string): Promise<ResolvedOAuth | null> {
  const staticCfg = getProviderConfig(providerId)
  if (staticCfg && isProviderConfigured(providerId)) {
    return {
      id: staticCfg.id,
      authorizeUrl: staticCfg.authorizeUrl,
      tokenUrl: staticCfg.tokenUrl,
      clientId: env(staticCfg.clientIdEnv),
      clientSecret: env(staticCfg.clientSecretEnv),
      scopes: staticCfg.scopes,
      tokenAuth: staticCfg.tokenAuth ?? 'body',
      authorizeExtra: staticCfg.authorizeExtra,
    }
  }

  // Dynamique
  const admin = adminClient()
  const { data, error } = await admin
    .from('connector_definitions')
    .select('*')
    .eq('slug', providerId)
    .maybeSingle()

  if (error || !data) return null

  const secret = await decryptSecret(data.client_secret_enc as string)
  if (!secret) return null

  return {
    id: data.slug as string,
    authorizeUrl: data.authorize_url as string,
    tokenUrl: data.token_url as string,
    clientId: data.client_id as string,
    clientSecret: secret,
    scopes: (data.scopes as string) || '',
    tokenAuth: ((data.token_auth as string) || 'body') as 'body' | 'basic' | 'stripe',
    userinfoUrl: (data.userinfo_url as string) || undefined,
  }
}

export async function isOAuthResolvable(providerId: string): Promise<boolean> {
  if (providerId === 'stripe' && Deno.env.get('STRIPE_SECRET_KEY')?.trim()) return true
  if (isProviderConfigured(providerId)) return true
  const admin = adminClient()
  const { data } = await admin
    .from('connector_definitions')
    .select('slug')
    .eq('slug', providerId)
    .maybeSingle()
  return Boolean(data)
}

export type ConnectorPublic = {
  slug: string
  name: string
  product_url: string
  logo_url: string | null
  category: string
  scopes: string
  visibility: string
  owner_user_id: string | null
  configured: true
  authMode: 'oauth' | 'session'
}

export async function listVisibleConnectors(userId: string): Promise<ConnectorPublic[]> {
  const admin = adminClient()
  const { data, error } = await admin
    .from('connector_definitions')
    .select(
      'slug, name, product_url, logo_url, category, scopes, visibility, owner_user_id',
    )
    .or(`visibility.eq.public,owner_user_id.eq.${userId}`)

  if (error || !data) return []

  return data.map((row) => {
    const scopes = (row.scopes as string) || ''
    return {
      slug: row.slug as string,
      name: row.name as string,
      product_url: row.product_url as string,
      logo_url: (row.logo_url as string | null) ?? null,
      category: (row.category as string) || 'productivite',
      scopes,
      visibility: row.visibility as string,
      owner_user_id: (row.owner_user_id as string | null) ?? null,
      configured: true as const,
      authMode: (scopes === '__orion_session__' ? 'session' : 'oauth') as
        | 'oauth'
        | 'session',
    }
  })
}
