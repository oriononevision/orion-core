import { json, optionsResponse } from '../_shared/cors.ts'
import { buildAuthorizeUrlResolved } from '../_shared/oauthRuntime.ts'
import { isOAuthResolvable, resolveOAuthProvider } from '../_shared/resolveProvider.ts'
import {
  isStripeConnectReady,
  isStripeOAuthReady,
  startStripeAccountLink,
} from '../_shared/stripeConnect.ts'
import { adminClient, oauthCallbackUrl, userClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return json({ error: 'Non authentifié' }, 401)

    const body = (await req.json()) as { provider?: string; redirectTo?: string }
    const provider = body.provider?.trim()
    if (!provider) return json({ error: 'provider requis' }, 400)

    const sbUser = userClient(auth)
    const { data: userData, error: userErr } = await sbUser.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Session invalide' }, 401)

    const redirectTo =
      body.redirectTo?.trim() ||
      `${Deno.env.get('CORE_APP_URL')?.replace(/\/$/, '') || 'https://orion-core-app.vercel.app'}/connexions`

    const admin = adminClient()
    const state = crypto.randomUUID()
    const callbackBase = oauthCallbackUrl()

    // Stripe : Account Links (recommandé) si pas de ca_ OAuth, sinon OAuth classique
    if (provider === 'stripe') {
      if (!isStripeConnectReady()) {
        return json(
          {
            error:
              'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY (et optionnellement STRIPE_CLIENT_ID) dans les secrets Supabase.',
            configured: false,
          },
          400,
        )
      }

      if (isStripeOAuthReady()) {
        const cfg = await resolveOAuthProvider('stripe')
        if (!cfg) {
          return json({ error: 'Impossible de résoudre Stripe OAuth', configured: false }, 400)
        }
        const { error: stateErr } = await admin.from('oauth_states').insert({
          state,
          user_id: userData.user.id,
          provider: 'stripe',
          redirect_to: redirectTo,
        })
        if (stateErr) return json({ error: stateErr.message }, 500)
        const authorizeUrl = buildAuthorizeUrlResolved(cfg, callbackBase, state)
        return json({ authorizeUrl, provider: 'stripe', configured: true, mode: 'oauth' })
      }

      // Récupère un compte Express déjà créé pour cet utilisateur s’il existe
      const { data: existing } = await admin
        .from('user_connections')
        .select('meta')
        .eq('user_id', userData.user.id)
        .eq('provider', 'stripe')
        .maybeSingle()
      const prevAcct =
        existing?.meta && typeof existing.meta === 'object'
          ? String((existing.meta as { stripe_account_id?: string }).stripe_account_id || '')
          : ''

      const returnUrl = `${callbackBase}?state=${encodeURIComponent(state)}&stripe_return=1`
      const refreshUrl = `${callbackBase}?state=${encodeURIComponent(state)}&stripe_refresh=1`

      const link = await startStripeAccountLink({
        userId: userData.user.id,
        email: userData.user.email,
        existingAccountId: prevAcct || null,
        returnUrl,
        refreshUrl,
      })

      const { error: stateErr } = await admin.from('oauth_states').insert({
        state,
        user_id: userData.user.id,
        provider: 'stripe',
        redirect_to: redirectTo,
      })
      if (stateErr) return json({ error: stateErr.message }, 500)

      // Mémorise l’account id en pending avant le retour Stripe
      await admin.from('user_connections').upsert(
        {
          user_id: userData.user.id,
          provider: 'stripe',
          account_label: 'Stripe (onboarding…)',
          status: 'pending_sync',
          meta: { stripe_account_id: link.stripeAccountId, mode: 'account_link' },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      )

      return json({
        authorizeUrl: link.authorizeUrl,
        provider: 'stripe',
        configured: true,
        mode: 'account_link',
      })
    }

    if (!(await isOAuthResolvable(provider))) {
      return json(
        {
          error: `Provider « ${provider} » inconnu ou non configuré. Ajoutez-le via « Ajouter un logiciel » ou les secrets Supabase.`,
          configured: false,
        },
        400,
      )
    }

    const cfg = await resolveOAuthProvider(provider)
    if (!cfg) {
      return json({ error: `Impossible de résoudre « ${provider} »`, configured: false }, 400)
    }

    const { error: stateErr } = await admin.from('oauth_states').insert({
      state,
      user_id: userData.user.id,
      provider,
      redirect_to: redirectTo,
    })
    if (stateErr) return json({ error: stateErr.message }, 500)

    const authorizeUrl = buildAuthorizeUrlResolved(cfg, callbackBase, state)
    return json({ authorizeUrl, provider, configured: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur oauth-start' }, 500)
  }
})
