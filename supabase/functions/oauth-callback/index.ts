import { encryptSecret } from '../_shared/crypto.ts'
import { exchangeCodeResolved, verifyAccessToken } from '../_shared/oauthRuntime.ts'
import { resolveOAuthProvider } from '../_shared/resolveProvider.ts'
import { fetchStripeAccount, startStripeAccountLink } from '../_shared/stripeConnect.ts'
import {
  adminClient,
  coreConnectionsUrl,
  oauthCallbackUrl,
} from '../_shared/supabase.ts'

function redirect(to: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: to },
  })
}

function failRedirect(base: string, message: string, provider?: string): Response {
  const url = new URL(base || coreConnectionsUrl())
  url.searchParams.set('oauth', 'error')
  url.searchParams.set('message', message.slice(0, 180))
  if (provider) url.searchParams.set('provider', provider)
  return redirect(url.toString())
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const err = url.searchParams.get('error')
    const errDesc = url.searchParams.get('error_description')
    const stripeReturn = url.searchParams.get('stripe_return') === '1'
    const stripeRefresh = url.searchParams.get('stripe_refresh') === '1'

    if (!state) {
      return failRedirect(coreConnectionsUrl(), 'State OAuth manquant')
    }

    const admin = adminClient()
    const { data: st, error: stErr } = await admin
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle()

    // Ne pas supprimer le state tout de suite si refresh Stripe (on peut en avoir besoin)
    const redirectBase = st?.redirect_to || coreConnectionsUrl()

    if (stErr || !st) {
      return failRedirect(redirectBase, 'State OAuth invalide ou expiré')
    }

    // --- Stripe Account Links (retour / refresh) ---
    if (st.provider === 'stripe' && (stripeReturn || stripeRefresh)) {
      const { data: conn } = await admin
        .from('user_connections')
        .select('meta')
        .eq('user_id', st.user_id)
        .eq('provider', 'stripe')
        .maybeSingle()
      const accountId = String(
        (conn?.meta as { stripe_account_id?: string } | null)?.stripe_account_id || '',
      )
      if (!accountId) {
        await admin.from('oauth_states').delete().eq('state', state)
        return failRedirect(redirectBase, 'Compte Stripe introuvable', 'stripe')
      }

      if (stripeRefresh) {
        const callbackBase = oauthCallbackUrl()
        const link = await startStripeAccountLink({
          userId: st.user_id,
          existingAccountId: accountId,
          returnUrl: `${callbackBase}?state=${encodeURIComponent(state)}&stripe_return=1`,
          refreshUrl: `${callbackBase}?state=${encodeURIComponent(state)}&stripe_refresh=1`,
        })
        return redirect(link.authorizeUrl)
      }

      // stripe_return
      await admin.from('oauth_states').delete().eq('state', state)
      const acct = await fetchStripeAccount(accountId)
      const charges = Boolean(acct.charges_enabled)
      const details = Boolean(acct.details_submitted)
      const email = String(acct.email || '')
      const biz = acct.business_profile as { name?: string } | undefined
      const label = String(biz?.name || email || accountId)

      const { error: upsertErr } = await admin.from('user_connections').upsert(
        {
          user_id: st.user_id,
          provider: 'stripe',
          account_label: label,
          access_token: null,
          refresh_token: null,
          status: charges || details ? 'connected' : 'pending_sync',
          items_synced: 0,
          last_sync: new Date().toISOString(),
          connected_at: new Date().toISOString(),
          meta: {
            stripe_account_id: accountId,
            mode: 'account_link',
            charges_enabled: charges,
            details_submitted: details,
            country: acct.country,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      )
      if (upsertErr) return failRedirect(redirectBase, upsertErr.message, 'stripe')

      const ok = new URL(redirectBase)
      ok.searchParams.set('oauth', 'success')
      ok.searchParams.set('provider', 'stripe')
      ok.searchParams.set('account', label)
      return redirect(ok.toString())
    }

    await admin.from('oauth_states').delete().eq('state', state)

    if (err) {
      return failRedirect(redirectBase, errDesc || err, st.provider)
    }

    if (!code) {
      return failRedirect(redirectBase, 'Code OAuth manquant', st.provider)
    }

    const cfg = await resolveOAuthProvider(st.provider)
    if (!cfg) {
      return failRedirect(redirectBase, `Provider inconnu: ${st.provider}`, st.provider)
    }

    const tokens = await exchangeCodeResolved(cfg, code, oauthCallbackUrl())
    const verified = await verifyAccessToken(cfg, tokens.access_token, {
      instance_url: tokens.instance_url,
      subdomain: Deno.env.get('ZENDESK_SUBDOMAIN'),
    })

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    const encAccess = await encryptSecret(tokens.access_token)
    const encRefresh = await encryptSecret(tokens.refresh_token ?? null)

    const { error: upsertErr } = await admin.from('user_connections').upsert(
      {
        user_id: st.user_id,
        provider: st.provider,
        account_label: verified.accountLabel,
        access_token: encAccess,
        refresh_token: encRefresh,
        expires_at: expiresAt,
        scopes: tokens.scope || cfg.scopes,
        meta: {
          ...(verified.meta || {}),
          instance_url: tokens.instance_url,
          stripe_user_id: tokens.stripe_user_id,
        },
        status: 'connected',
        items_synced: verified.itemsSynced ?? 0,
        last_sync: new Date().toISOString(),
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

    if (upsertErr) {
      return failRedirect(redirectBase, upsertErr.message, st.provider)
    }

    const ok = new URL(redirectBase)
    ok.searchParams.set('oauth', 'success')
    ok.searchParams.set('provider', st.provider)
    ok.searchParams.set('account', verified.accountLabel)
    return redirect(ok.toString())
  } catch (e) {
    return failRedirect(
      coreConnectionsUrl(),
      e instanceof Error ? e.message : 'Échec OAuth',
    )
  }
})
