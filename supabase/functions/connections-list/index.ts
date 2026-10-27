import { json, optionsResponse } from '../_shared/cors.ts'
import { isProviderConfigured, oauthProviders } from '../_shared/providers.ts'
import { listVisibleConnectors } from '../_shared/resolveProvider.ts'
import { adminClient, userClient } from '../_shared/supabase.ts'

const OAUTH_IDS = Object.keys(oauthProviders)
const IMAP_IDS = ['yahoo', 'icloud', 'imap']
const GOOGLE_IDS = ['gmail', 'drive', 'calendar']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'GET or POST' }, 405)
  }

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Non authentifié' }, 401)

    const sb = userClient(auth)
    const { data: userData, error: userErr } = await sb.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Session invalide' }, 401)

    // Service role : lecture filtrée après auth (évite les échecs GRANT/RLS PostgREST)
    const admin = adminClient()
    const { data, error } = await admin
      .from('user_connections')
      .select(
        'provider, account_label, status, items_synced, last_sync, connected_at, meta, scopes, expires_at',
      )
      .eq('user_id', userData.user.id)

    if (error) return json({ error: error.message }, 500)

    const custom = await listVisibleConnectors(userData.user.id)

    const configured: Record<string, boolean> = {}
    for (const id of OAUTH_IDS) configured[id] = isProviderConfigured(id)
    for (const id of IMAP_IDS) configured[id] = true
    for (const id of GOOGLE_IDS) configured[id] = true
    for (const c of custom) configured[c.slug] = true

    const oauthIds = [...OAUTH_IDS, ...custom.map((c) => c.slug)]

    return json({
      connections: data ?? [],
      configured,
      customConnectors: custom,
      authModes: {
        google: GOOGLE_IDS,
        oauth: oauthIds,
        imap: IMAP_IDS,
      },
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur list' }, 500)
  }
})
