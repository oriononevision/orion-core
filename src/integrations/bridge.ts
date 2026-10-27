import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Connectez-vous à ORION pour lier un outil.')
  return `Bearer ${token}`
}

async function messageFromFunctionsError(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json()
      if (payload && typeof payload === 'object' && 'error' in payload) {
        const err = (payload as { error: unknown }).error
        if (typeof err === 'string' && err.trim()) return err
      }
      if (typeof payload === 'string' && payload.trim()) return payload
    } catch {
      try {
        const text = await error.context.text()
        if (text.trim()) return text.trim()
      } catch {
        /* ignore */
      }
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

async function invoke<T>(name: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: await authHeader(),
  }
  const { data, error } = await supabase.functions.invoke(name, {
    body: body ?? {},
    headers,
  })
  if (error) {
    throw new Error(await messageFromFunctionsError(error, `Erreur ${name}`))
  }
  if (data && typeof data === 'object' && 'error' in data && (data as { error: unknown }).error) {
    throw new Error(String((data as { error: unknown }).error))
  }
  return data as T
}

export type RemoteConnection = {
  provider: string
  account_label: string | null
  status: string
  items_synced: number | null
  last_sync: string | null
  connected_at: string | null
  meta: Record<string, unknown> | null
  scopes: string | null
  expires_at: string | null
}

export type CustomConnector = {
  slug: string
  name: string
  product_url: string
  logo_url: string | null
  category: string
  scopes: string
  visibility: string
  owner_user_id: string | null
  configured: boolean
  authMode: 'oauth' | 'session'
}

export async function listRemoteConnections() {
  return invoke<{
    connections: RemoteConnection[]
    configured: Record<string, boolean>
    customConnectors?: CustomConnector[]
    authModes: { google: string[]; oauth: string[]; imap: string[] }
  }>('connections-list', {})
}

export async function listCustomConnectors() {
  return invoke<{ connectors: CustomConnector[] }>('connector-registry', {
    action: 'list',
  })
}

export async function createCustomConnector(input: {
  productUrl: string
  name?: string
  authorizeUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  scopes?: string
  userinfoUrl?: string
  tokenAuth?: 'body' | 'basic'
  category?: string
  visibility?: 'private' | 'public'
}) {
  return invoke<{
    ok: boolean
    connector: CustomConnector
    callbackUrl: string
    note: string
  }>('connector-registry', { action: 'create', ...input })
}

export async function deleteCustomConnector(slug: string) {
  return invoke<{ ok: boolean; slug: string }>('connector-registry', {
    action: 'delete',
    slug,
  })
}

/** Desktop : logiciel lié via session navigateur (cookies isolés), sans OAuth. */
export async function createSessionConnector(input: {
  productUrl: string
  name?: string
  slug?: string
  category?: string
  accountLabel?: string
  cookieCount?: number
}) {
  return invoke<{
    ok: boolean
    connector: CustomConnector
    note: string
  }>('connector-registry', { action: 'create_session', ...input })
}

/** Logiciel catalogue sans secrets OAuth → demande d’activation (pending). */
export async function requestCatalogConnector(input: {
  provider: string
  name?: string
  productUrl?: string
}) {
  return invoke<{
    ok: boolean
    provider: string
    status: string
    note: string
  }>('connector-registry', { action: 'request', ...input })
}


export async function startOAuth(provider: string, redirectTo?: string) {
  return invoke<{ authorizeUrl: string; provider: string; configured: boolean }>(
    'oauth-start',
    { provider, redirectTo },
  )
}

export async function connectImap(input: {
  provider: string
  email: string
  password: string
  imapHost?: string
  imapPort?: number
}) {
  return invoke<{
    ok: boolean
    provider: string
    accountLabel: string
    status: string
    note: string
    itemsSynced: number
  }>('imap-connect', input)
}

export async function disconnectRemote(provider: string) {
  return invoke<{ ok: boolean; provider: string }>('connection-disconnect', { provider })
}
