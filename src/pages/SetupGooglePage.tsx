import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink } from 'lucide-react'
import TopBar from '../components/TopBar'
import ToolBadge from '../components/ToolBadge'
import {
  GOOGLE_SETUP_LINKS,
  getGoogleClientId,
  getStoredGoogleClientId,
  isGoogleConfigured,
  setStoredGoogleClientId,
} from '../integrations/config'

const steps = [
  {
    n: 1,
    title: 'Créer / ouvrir un projet Google Cloud',
    href: GOOGLE_SETUP_LINKS.newProject,
    text: 'Créez un projet nommé par ex. orion-core (ou sélectionnez-en un existant).',
  },
  {
    n: 2,
    title: 'Activer Gmail API',
    href: GOOGLE_SETUP_LINKS.enableGmail,
    text: 'Cliquez Enable / Activer.',
  },
  {
    n: 3,
    title: 'Activer Drive API',
    href: GOOGLE_SETUP_LINKS.enableDrive,
    text: 'Cliquez Enable / Activer.',
  },
  {
    n: 4,
    title: 'Activer Calendar API',
    href: GOOGLE_SETUP_LINKS.enableCalendar,
    text: 'Cliquez Enable / Activer.',
  },
  {
    n: 5,
    title: 'Écran de consentement OAuth',
    href: GOOGLE_SETUP_LINKS.consent,
    text: 'Type External → remplissez le nom « ORION Core » → ajoutez votre e-mail en Test user si besoin → Save.',
  },
  {
    n: 6,
    title: 'Créer le Client ID Web',
    href: GOOGLE_SETUP_LINKS.credentials,
    text: 'Create credentials → OAuth client ID → Web application. Origins : http://localhost:5174 → Create. Copiez le Client ID.',
  },
]

export default function SetupGooglePage() {
  const [clientId, setClientId] = useState('')
  const [saved, setSaved] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const current = getGoogleClientId()
    setClientId(getStoredGoogleClientId() || current)
    setReady(isGoogleConfigured())
    const onCfg = () => setReady(isGoogleConfigured())
    window.addEventListener('orion-google-config', onCfg)
    return () => window.removeEventListener('orion-google-config', onCfg)
  }, [])

  function save() {
    setStoredGoogleClientId(clientId)
    setSaved(true)
    setReady(isGoogleConfigured())
    setTimeout(() => setSaved(false), 2000)
  }

  function openAll() {
    ;[
      GOOGLE_SETUP_LINKS.newProject,
      GOOGLE_SETUP_LINKS.enableGmail,
      GOOGLE_SETUP_LINKS.enableDrive,
      GOOGLE_SETUP_LINKS.enableCalendar,
      GOOGLE_SETUP_LINKS.consent,
      GOOGLE_SETUP_LINKS.credentials,
    ].forEach((url, i) => {
      window.setTimeout(() => window.open(url, '_blank', 'noopener'), i * 400)
    })
  }

  return (
    <div className="page-view">
      <TopBar
        title="Setup Google"
        subtitle="À faire une seule fois pour le projet Orion — ensuite chaque user connecte juste son Gmail."
      />

      <div className="page-view__body setup-page">
        <section className="panel setup-status">
          <ToolBadge id="gmail" size="lg" />
          <div>
            <h2>{ready ? 'Setup Google prêt' : 'Setup Google à terminer'}</h2>
            <p className="muted">
              {ready
                ? 'Les utilisateurs peuvent connecter Gmail avec leur adresse + confirmation.'
                : 'Je ne peux pas créer le Client ID à ta place (compte Google personnel). Suis les étapes, puis colle l’ID ici.'}
            </p>
          </div>
          {ready ? (
            <span className="status-pill status-pill--connected">
              <Check size={12} /> Configuré
            </span>
          ) : null}
        </section>

        <section className="panel">
          <header className="panel__head">
            <h2>Étapes Google Cloud</h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={openAll}>
              Ouvrir tous les liens
            </button>
          </header>
          <ol className="setup-steps">
            {steps.map((s) => (
              <li key={s.n}>
                <span className="setup-steps__n">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                  <a href={s.href} target="_blank" rel="noreferrer">
                    Ouvrir <ExternalLink size={12} />
                  </a>
                </div>
              </li>
            ))}
          </ol>
          <p className="muted setup-origin">
            Origin JavaScript autorisée à mettre :{' '}
            <code>http://localhost:5174</code>
          </p>
        </section>

        <section className="panel">
          <h2>Coller le Client ID (une fois)</h2>
          <p className="muted" style={{ marginBottom: '0.85rem' }}>
            Format typique : <code>123456789-xxxxx.apps.googleusercontent.com</code>
          </p>
          <label className="gmail-connect__field">
            Google OAuth Client ID
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="….apps.googleusercontent.com"
              spellCheck={false}
            />
          </label>
          <div className="modal__actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn--white btn--sm" onClick={save}>
              Enregistrer le setup
            </button>
            {saved ? <span className="mail-compose__ok">Enregistré</span> : null}
            {ready ? (
              <Link to="/connexions" className="btn btn--accent btn--sm">
                Connecter Gmail →
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
