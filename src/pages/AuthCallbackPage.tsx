import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { acceptHandoffFromHash } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const { session, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await acceptHandoffFromHash()
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (cancelled) return
        if (sessionError) throw sessionError
        if (!data.session) {
          setError('Session introuvable.')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Échec de la connexion')
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  if (ready && error) {
    return (
      <AuthShell mode="login" title="Connexion">
        <div className="auth__done">
          <p className="auth__error">{error}</p>
          <Link to="/connexion" className="auth__btn">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell mode="login" title="Connexion">
      <div className="auth__done">
        <p>Finalisation de la connexion…</p>
      </div>
    </AuthShell>
  )
}
