import { json, optionsResponse } from '../_shared/cors.ts'
import { encryptSecret } from '../_shared/crypto.ts'
import { listVisibleConnectors } from '../_shared/resolveProvider.ts'
import { adminClient, userClient } from '../_shared/supabase.ts'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function domainFromUrl(raw: string): string {
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return raw
  }
}

function logoForDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
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
    const userId = userData.user.id

    const body = (await req.json()) as Record<string, unknown>
    const action = String(body.action || 'list')

    if (action === 'list') {
      const connectors = await listVisibleConnectors(userId)
      return json({ connectors })
    }

    if (action === 'create') {
      const productUrl = String(body.productUrl || '').trim()
      const name = String(body.name || '').trim()
      const authorizeUrl = String(body.authorizeUrl || '').trim()
      const tokenUrl = String(body.tokenUrl || '').trim()
      const clientId = String(body.clientId || '').trim()
      const clientSecret = String(body.clientSecret || '').trim()
      const scopes = String(body.scopes || '').trim()
      const userinfoUrl = String(body.userinfoUrl || '').trim()
      const tokenAuth = body.tokenAuth === 'basic' ? 'basic' : 'body'
      const category = String(body.category || 'productivite').trim() || 'productivite'
      const visibility = body.visibility === 'public' ? 'public' : 'private'

      if (!productUrl) return json({ error: 'Lien du logiciel requis' }, 400)
      if (!authorizeUrl || !tokenUrl) {
        return json(
          {
            error:
              'URLs OAuth requises (authorize + token). Trouvez-les dans la doc API de l’éditeur.',
          },
          400,
        )
      }
      if (!clientId || !clientSecret) {
        return json({ error: 'Client ID et Client Secret OAuth requis' }, 400)
      }

      const domain = domainFromUrl(productUrl)
      const baseSlug = slugify(String(body.slug || name || domain))
      if (!baseSlug) return json({ error: 'Impossible de dériver un identifiant' }, 400)
      const slug = baseSlug.startsWith('custom_') ? baseSlug : `custom_${baseSlug}`

      const displayName = name || domain
      const encSecret = await encryptSecret(clientSecret)
      if (!encSecret) return json({ error: 'Chiffrement secret impossible' }, 500)

      const callbackUrl = `${Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '')}/functions/v1/oauth-callback`

      const admin = adminClient()
      const { data, error } = await admin
        .from('connector_definitions')
        .upsert(
          {
            slug,
            owner_user_id: userId,
            name: displayName,
            product_url: productUrl.includes('://') ? productUrl : `https://${productUrl}`,
            logo_url: logoForDomain(domain),
            category,
            authorize_url: authorizeUrl,
            token_url: tokenUrl,
            client_id: clientId,
            client_secret_enc: encSecret,
            scopes,
            token_auth: tokenAuth,
            userinfo_url: userinfoUrl || null,
            visibility,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' },
        )
        .select(
          'slug, name, product_url, logo_url, category, scopes, visibility, owner_user_id',
        )
        .single()

      if (error) return json({ error: error.message }, 500)

      return json({
        ok: true,
        connector: { ...data, configured: true, authMode: 'oauth' },
        callbackUrl,
        note: `Ajoutez ce callback dans l’app OAuth de ${displayName} : ${callbackUrl}`,
      })
    }

    if (action === 'delete') {
      const slug = String(body.slug || '').trim()
      if (!slug) return json({ error: 'slug requis' }, 400)
      const admin = adminClient()
      const { error } = await admin
        .from('connector_definitions')
        .delete()
        .eq('slug', slug)
        .eq('owner_user_id', userId)
      if (error) return json({ error: error.message }, 500)
      await admin.from('user_connections').delete().eq('user_id', userId).eq('provider', slug)
      return json({ ok: true, slug })
    }

    // Desktop : connexion par session navigateur (pas de Client Secret)
    if (action === 'create_session') {
      const productUrl = String(body.productUrl || '').trim()
      const name = String(body.name || '').trim()
      if (!productUrl) return json({ error: 'Lien du logiciel requis' }, 400)

      const domain = domainFromUrl(productUrl)
      const baseSlug = slugify(String(body.slug || name || domain))
      if (!baseSlug) return json({ error: 'Impossible de dériver un identifiant' }, 400)
      const slug = baseSlug.startsWith('custom_') ? baseSlug : `custom_${baseSlug}`
      const displayName = name || domain
      const category = String(body.category || 'productivite').trim() || 'productivite'
      const accountLabel = String(body.accountLabel || displayName).trim()
      const cookieCount = Number(body.cookieCount || 0)
      const product =
        productUrl.includes('://') ? productUrl : `https://${productUrl}`

      const admin = adminClient()
      const { data, error } = await admin
        .from('connector_definitions')
        .upsert(
          {
            slug,
            owner_user_id: userId,
            name: displayName,
            product_url: product,
            logo_url: logoForDomain(domain),
            category,
            authorize_url: 'https://orion.local/session/authorize',
            token_url: 'https://orion.local/session/token',
            client_id: 'orion_desktop_session',
            client_secret_enc: await encryptSecret(`session_${slug}`),
            scopes: '__orion_session__',
            token_auth: 'body',
            userinfo_url: null,
            visibility: 'private',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' },
        )
        .select(
          'slug, name, product_url, logo_url, category, scopes, visibility, owner_user_id',
        )
        .single()

      if (error) return json({ error: error.message }, 500)

      const { error: connErr } = await admin.from('user_connections').upsert(
        {
          user_id: userId,
          provider: slug,
          account_label: accountLabel,
          status: 'connected',
          items_synced: cookieCount > 0 ? cookieCount : 1,
          last_sync: new Date().toISOString(),
          connected_at: new Date().toISOString(),
          meta: {
            auth_mode: 'session',
            desktop: true,
            product_url: product,
            cookie_count: cookieCount,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      )
      if (connErr) return json({ error: connErr.message }, 500)

      return json({
        ok: true,
        connector: { ...data, configured: true, authMode: 'session' },
        note: `${displayName} connecté sur ORION Desktop (session navigateur).`,
      })
    }

    // Catalogue sans secrets OAuth : demande d’activation (pas de redirect éditeur)
    if (action === 'request') {
      const provider = String(body.provider || '').trim().toLowerCase()
      const name = String(body.name || provider).trim()
      if (!provider) return json({ error: 'provider requis' }, 400)
      if (!/^[a-z0-9_]{2,48}$/.test(provider)) {
        return json({ error: 'Identifiant logiciel invalide' }, 400)
      }

      const admin = adminClient()
      const { error } = await admin.from('user_connections').upsert(
        {
          user_id: userId,
          provider,
          account_label: name,
          status: 'pending_sync',
          items_synced: 0,
          last_sync: new Date().toISOString(),
          meta: {
            requested: true,
            product_url: String(body.productUrl || '').trim() || null,
            note: 'Demande d’activation Orion — OAuth serveur pas encore branché',
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      )
      if (error) return json({ error: error.message }, 500)

      return json({
        ok: true,
        provider,
        status: 'pending_sync',
        note: `${name} ajouté à votre espace. Activation Orion en cours.`,
      })
    }

    return json({ error: `Action inconnue: ${action}` }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur registry' }, 500)
  }
})
