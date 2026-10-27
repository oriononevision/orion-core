/** Stripe Connect — Account Links (Accounts v2) ou OAuth legacy (ca_ + sk_). */

const STRIPE_API_VERSION = '2026-09-30.endive'

function env(name: string): string {
  return Deno.env.get(name)?.trim() ?? ''
}

export function stripeSecretKey(): string {
  return env('STRIPE_SECRET_KEY')
}

export function stripeClientId(): string {
  return env('STRIPE_CLIENT_ID')
}

/** Connect possible dès qu’une secret key est présente. */
export function isStripeConnectReady(): boolean {
  return Boolean(stripeSecretKey())
}

/** OAuth Connect classique (ca_ + sk_). */
export function isStripeOAuthReady(): boolean {
  return Boolean(stripeClientId() && stripeSecretKey())
}

async function stripeJson(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const sk = stripeSecretKey()
  if (!sk) throw new Error('STRIPE_SECRET_KEY manquant')
  const res = await fetch(`https://api.stripe.com/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${sk}`,
      'Stripe-Version': STRIPE_API_VERSION,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = data.error as { message?: string; code?: string } | undefined
    throw new Error(err?.message || `Stripe ${path} HTTP ${res.status}`)
  }
  return data
}

async function stripeForm(
  path: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const sk = stripeSecretKey()
  if (!sk) throw new Error('STRIPE_SECRET_KEY manquant')
  const body = new URLSearchParams(params)
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sk}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined
    throw new Error(err?.message || `Stripe ${path} HTTP ${res.status}`)
  }
  return data
}

async function stripeGet(path: string): Promise<Record<string, unknown>> {
  const sk = stripeSecretKey()
  if (!sk) throw new Error('STRIPE_SECRET_KEY manquant')
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Basic ${btoa(`${sk}:`)}` },
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined
    throw new Error(err?.message || `Stripe GET ${path} HTTP ${res.status}`)
  }
  return data
}

/**
 * Crée (ou réutilise) un compte Connect v2 (recipient) + lien d’onboarding.
 * Plateformes FR : pas de config merchant sans account token → recipient seul.
 * Fonctionne avec la seule STRIPE_SECRET_KEY (pas besoin de ca_).
 */
export async function startStripeAccountLink(input: {
  userId: string
  email?: string | null
  existingAccountId?: string | null
  returnUrl: string
  refreshUrl: string
}): Promise<{ authorizeUrl: string; stripeAccountId: string }> {
  let accountId = input.existingAccountId?.trim() || ''

  if (!accountId) {
    if (!input.email) {
      throw new Error('Email utilisateur requis pour créer un compte Stripe Connect')
    }
    const acct = await stripeJson('POST', 'v2/core/accounts', {
      contact_email: input.email,
      identity: { country: 'FR' },
      dashboard: 'express',
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      metadata: { orion_user_id: input.userId },
    })
    accountId = String(acct.id)
  }

  // Account Links v1 fonctionne aussi sur les comptes créés via Accounts v2
  const link = await stripeForm('account_links', {
    account: accountId,
    refresh_url: input.refreshUrl,
    return_url: input.returnUrl,
    type: 'account_onboarding',
  })

  const url = String(link.url || '')
  if (!url) throw new Error('Stripe n’a pas renvoyé d’URL d’onboarding')
  return { authorizeUrl: url, stripeAccountId: accountId }
}

export async function fetchStripeAccount(accountId: string) {
  return stripeGet(`accounts/${accountId}`)
}
