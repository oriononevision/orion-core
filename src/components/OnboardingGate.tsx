import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isOnboardingComplete } from '../onboarding/store'

function AuthLoading() {
  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true">
        <img src="/images/hero-cosmic-bg.jpg" alt="" />
        <div className="auth__veil" />
      </div>
      <main className="auth__main">
        <div className="auth__frame">
          <p className="auth__switch">Chargement de votre session…</p>
        </div>
      </main>
    </div>
  )
}

/** Exige une session Supabase. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!session) return <Navigate to="/connexion" replace />
  return <Outlet />
}

/** Pages publiques auth : redirige si déjà connecté. */
export function PublicOnly() {
  const { session, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

/** Protège l’app : onboarding obligatoire avant le shell. */
export function OnboardedApp() {
  if (!isOnboardingComplete()) {
    return <Navigate to="/onboarding" replace />
  }
  return <Outlet />
}

/** Empêche de revoir l’onboarding une fois terminé. */
export function OnboardingOnly() {
  if (isOnboardingComplete()) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
