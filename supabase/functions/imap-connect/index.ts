import { json, optionsResponse } from '../_shared/cors.ts'
import { encryptSecret } from '../_shared/crypto.ts'
import { IMAP_PRESETS } from '../_shared/providers.ts'
import { adminClient, userClient } from '../_shared/supabase.ts'

/** Minimal IMAP LOGIN over TLS to verify credentials. */
async function verifyImapLogin(opts: {
  host: string
  port: number
  email: string
  password: string
}): Promise<{ ok: boolean; note: string }> {
  const { host, port, email, password } = opts
  if (!host) return { ok: false, note: 'Hôte IMAP manquant' }

  try {
    const conn = await Deno.connectTls({ hostname: host, port })
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    async function readChunk(): Promise<string> {
      const buf = new Uint8Array(2048)
      const n = await conn.read(buf)
      if (n === null) return ''
      return decoder.decode(buf.subarray(0, n))
    }

    async function writeLine(line: string) {
      await conn.write(encoder.encode(line + '\r\n'))
    }

    // Greeting
    await readChunk()

    const tag = 'A1'
    // Escape quotes in password
    const user = email.replace(/["\\]/g, '\\$&')
    const pass = password.replace(/["\\]/g, '\\$&')
    await writeLine(`${tag} LOGIN "${user}" "${pass}"`)

    let response = ''
    const deadline = Date.now() + 8000
    while (Date.now() < deadline) {
      response += await readChunk()
      if (response.includes(`${tag} OK`) || response.includes(`${tag} NO`) || response.includes(`${tag} BAD`)) {
        break
      }
    }

    try {
      await writeLine('A2 LOGOUT')
    } catch {
      /* ignore */
    }
    try {
      conn.close()
    } catch {
      /* ignore */
    }

    if (response.includes(`${tag} OK`)) {
      return { ok: true, note: 'IMAP LOGIN OK' }
    }
    if (response.includes(`${tag} NO`) || response.includes(`${tag} BAD`)) {
      return { ok: false, note: 'Identifiants IMAP refusés' }
    }
    // TLS reached but ambiguous response — accept as pending_sync
    return { ok: true, note: 'Hôte joignable ; login non confirmé (pending_sync)' }
  } catch (e) {
    return {
      ok: false,
      note: e instanceof Error ? e.message : 'Connexion TLS IMAP impossible',
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Non authentifié' }, 401)

    const sbUser = userClient(auth)
    const { data: userData, error: userErr } = await sbUser.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Session invalide' }, 401)

    const body = (await req.json()) as {
      provider?: string
      email?: string
      password?: string
      imapHost?: string
      imapPort?: number
    }

    const provider = body.provider?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password?.trim()

    if (!provider || !['yahoo', 'icloud', 'imap'].includes(provider)) {
      return json({ error: 'provider doit être yahoo | icloud | imap' }, 400)
    }
    if (!email || !password) {
      return json({ error: 'email et mot de passe d’application requis' }, 400)
    }

    const preset = IMAP_PRESETS[provider]
    const host = body.imapHost?.trim() || preset.host
    const port = body.imapPort || preset.port
    if (!host) return json({ error: 'Serveur IMAP requis' }, 400)

    const verify = await verifyImapLogin({ host, port, email, password })

    const encPass = await encryptSecret(password)
    const status = verify.ok
      ? verify.note.includes('pending')
        ? 'pending_sync'
        : 'connected'
      : 'error'

    if (!verify.ok) {
      return json({ error: verify.note, configured: true }, 400)
    }

    const admin = adminClient()
    const { error: upsertErr } = await admin.from('user_connections').upsert(
      {
        user_id: userData.user.id,
        provider,
        account_label: email,
        access_token: encPass,
        refresh_token: null,
        expires_at: null,
        scopes: 'imap',
        meta: {
          imap_host: host,
          imap_port: port,
          email,
          note: verify.note,
        },
        status,
        items_synced: 0,
        last_sync: new Date().toISOString(),
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

    if (upsertErr) return json({ error: upsertErr.message }, 500)

    return json({
      ok: true,
      provider,
      accountLabel: email,
      status,
      note: verify.note,
      itemsSynced: 0,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur imap-connect' }, 500)
  }
})
