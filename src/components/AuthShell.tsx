import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { OrionLogo } from './OrionLogo'
import { SITE_URL } from '../lib/supabase'

type AuthShellProps = {
  mode: 'login' | 'signup'
  title: string
  children: ReactNode
}

const ease = [0.22, 1, 0.36, 1] as const

export default function AuthShell({ mode, title, children }: AuthShellProps) {
  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true">
        <img src="/images/hero-cosmic-bg.jpg" alt="" />
        <div className="auth__veil" />
      </div>

      <header className="auth__bar">
        <a href={SITE_URL} className="auth__logo" aria-label="ORION — Accueil">
          <OrionLogo markSize={24} />
        </a>
        <nav className="auth__bar-links">
          {mode === 'login' ? (
            <Link to="/inscription">Créer un compte</Link>
          ) : (
            <Link to="/connexion">Se connecter</Link>
          )}
          <a href={SITE_URL} className="auth__bar-quiet">
            Site
          </a>
        </nav>
      </header>

      <main className="auth__main">
        <motion.div
          className="auth__frame"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          <h1 className="auth__title">{title}</h1>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
