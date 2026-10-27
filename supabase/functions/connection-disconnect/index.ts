import { json, optionsResponse } from '../_shared/cors.ts'
import { adminClient, userClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Non authentifié' }, 401)

    const sbUser = userClient(auth)
    const { data: userData, error: userErr } = await sbUser.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Session invalide' }, 401)

    const body = (await req.json()) as { provider?: string }
    const provider = body.provider?.trim()
    if (!provider) return json({ error: 'provider requis' }, 400)

    const admin = adminClient()
    const { error } = await admin
      .from('user_connections')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('provider', provider)

    if (error) return json({ error: error.message }, 500)
    return json({ ok: true, provider })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur disconnect' }, 500)
  }
})
