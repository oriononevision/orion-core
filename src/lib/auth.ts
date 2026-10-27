import { supabase } from './supabase'

export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Une erreur est survenue.'

  const msg = raw.toLowerCase()
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou mot de passe incorrect.'
  }
  if (msg.includes('user already registered')) {
    return 'Un compte existe déjà avec cet e-mail.'
  }
  if (msg.includes('password')) {
    return 'Mot de passe trop court (6 caractères minimum).'
  }
  if (msg.includes('email')) {
    return 'Adresse e-mail invalide.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  }
  return raw
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: fullName ? { full_name: fullName, first_name: fullName.split(' ')[0] } : {},
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signInWithGoogleIdToken(credential: string, nonce?: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
    nonce,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function acceptHandoffFromHash(): Promise<boolean> {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return false

  const params = new URLSearchParams(raw)
  if (params.get('type') !== 'orion_handoff') return false

  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) return false

  const { error } = await supabase.auth.setSession({ access_token, refresh_token })
  // Nettoie le hash pour ne pas laisser les tokens dans l’historique
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  if (error) throw error
  return true
}
