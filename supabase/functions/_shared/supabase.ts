import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants')
  return createClient(url, key, { auth: { persistSession: false } })
}

export function userClient(authHeader: string) {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
}

export function coreAppUrl(): string {
  return (
    Deno.env.get('CORE_APP_URL')?.replace(/\/$/, '') ||
    'https://orion-core-app.vercel.app'
  )
}

export function coreConnectionsUrl(): string {
  return `${coreAppUrl()}/connexions`
}

export function oauthCallbackUrl(): string {
  const base = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '') ?? ''
  return `${base}/functions/v1/oauth-callback`
}
