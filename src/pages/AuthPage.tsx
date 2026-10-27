import { Link, useLocation } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import AuthShell from '../components/AuthShell'
import GoogleAuthButton from '../components/GoogleAuthButton'
import {
  authErrorMessage,
  signInWithEmail,
  signUpWithEmail,
} from '../lib/auth'
import { SITE_URL } from '../lib/supabase'

export default function AuthPage() {
  const { pathname } = useLocation()
  const mode = pathname.includes('inscription') ? 'signup' : 'login'

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') || '')
    const password = String(fd.get('password') || '')

    try {
      if (mode === 'signup') {
        const confirm = String(fd.get('passwordConfirm') || '')
        if (password !== confirm) {
          throw new Error('Les mots de passe ne correspondent pas.')
        }
        if (password.length < 8) {
          throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
        }
        const { session } = await signUpWithEmail(email, password)
        if (!session) {
          setInfo(
            'Compte créé. Confirmez votre e-mail si demandé, puis reconnectez-vous.',
          )
          setLoading(false)
          return
        }
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(authErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <AuthShell
      mode={mode}
      title={mode === 'login' ? 'Connexion' : 'Créer un compte'}
    >
      <form className="auth__form" onSubmit={onSubmit} noValidate={mode === 'login'}>
        <GoogleAuthButton onError={setError} />

        <div className="auth__divider" aria-hidden="true">
          <span>ou</span>
        </div>

        <label className="auth__field">
          <span>{mode === 'login' ? 'E-mail' : 'E-mail professionnel'}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@entreprise.com"
          />
        </label>

        <div className="auth__field">
          <span>
            Mot de passe
            {mode === 'login' ? (
              <a href={`${SITE_URL}/connexion`} className="auth__text-btn">
                Oublié ?
              </a>
            ) : null}
          </span>
          <div className="auth__input-wrap">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={
                mode === 'signup' ? '8 caractères minimum' : 'Votre mot de passe'
              }
            />
            <button
              type="button"
              className="auth__eye"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <label className="auth__field">
            <span>Confirmer le mot de passe</span>
            <input
              name="passwordConfirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Retapez le mot de passe"
            />
          </label>
        )}

        {error && <p className="auth__error">{error}</p>}
        {info && <p className="auth__info">{info}</p>}

        <button type="submit" className="auth__btn" disabled={loading}>
          {loading
            ? mode === 'login'
              ? 'Connexion…'
              : 'Création…'
            : mode === 'login'
              ? 'Continuer'
              : 'Créer mon compte'}
        </button>

        <p className="auth__switch">
          {mode === 'login' ? (
            <>
              Nouveau sur ORION ? <Link to="/inscription">Créer un compte</Link>
              {' · '}
              <a href={`${SITE_URL}/commencer`}>Inscription complète</a>
            </>
          ) : (
            <>
              Déjà un compte ? <Link to="/connexion">Se connecter</Link>
            </>
          )}
        </p>
      </form>
    </AuthShell>
  )
}
