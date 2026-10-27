import { Link } from 'react-router-dom'
import { Check, KeyRound, LogOut, RotateCcw } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import { useCore } from '../context/CoreContext'
import { resetOnboarding } from '../onboarding/store'

export default function SettingsPage() {
  const { tools, googleConfigured } = useCore()
  const { user, signOut } = useAuth()
  const connected = tools.filter((t) => t.status !== 'available').length
  const display =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.first_name as string | undefined) ||
    user?.email ||
    'Compte'

  return (
    <div className="page-view">
      <TopBar title="Réglages" subtitle="Espace de travail, agents et confidentialité." />

      <div className="page-view__body settings-grid">
        <section className="panel">
          <h2>Compte</h2>
          <dl className="settings-dl">
            <div>
              <dt>Utilisateur</dt>
              <dd>{display}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user?.email ?? '—'}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ marginTop: '0.85rem' }}
            onClick={async () => {
              await signOut()
              window.location.assign('/connexion')
            }}
          >
            <LogOut size={14} /> Se déconnecter
          </button>
        </section>

        <section className="panel">
          <h2>Setup Google</h2>
          <p className="muted" style={{ marginBottom: '0.85rem' }}>
            Une seule fois pour le projet : Client ID OAuth. Ensuite chaque
            utilisateur connecte son Gmail avec e-mail + confirmation.
          </p>
          <div className="settings-setup-row">
            {googleConfigured ? (
              <span className="status-pill status-pill--connected">
                <Check size={12} /> Prêt
              </span>
            ) : (
              <span className="status-pill status-pill--available">À configurer</span>
            )}
            <Link to="/setup-google" className="btn btn--white btn--sm">
              <KeyRound size={14} /> {googleConfigured ? 'Modifier' : 'Configurer'}
            </Link>
          </div>
        </section>

        <section className="panel">
          <h2>Espace</h2>
          <dl className="settings-dl">
            <div>
              <dt>Organisation</dt>
              <dd>Équipe Orion</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>Pro (démo)</dd>
            </div>
            <div>
              <dt>Outils connectés</dt>
              <dd>{connected}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <h2>Agents</h2>
          <label className="toggle-row">
            <span>Autoriser les actions d’écriture (drafts, labels)</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="toggle-row">
            <span>Demander validation avant envoi e-mail</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="toggle-row">
            <span>Briefs meeting automatiques</span>
            <input type="checkbox" defaultChecked />
          </label>
        </section>

        <section className="panel">
          <h2>Confidentialité</h2>
          <p className="muted">
            Les données synchronisées restent dans votre espace. Les agents
            n’agissent que sur les outils explicitement connectés et selon les
            permissions accordées.
          </p>
          <button type="button" className="btn btn--ghost btn--sm">
            Exporter le journal d’activité
          </button>
        </section>

        <section className="panel">
          <h2>Onboarding</h2>
          <p className="muted" style={{ marginBottom: '0.85rem' }}>
            Relancez la configuration initiale : objectifs, logiciels et design du
            Hub (le layout actuel sera remplacé).
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              resetOnboarding()
              window.location.assign('/onboarding')
            }}
          >
            <RotateCcw size={14} /> Relancer l’onboarding
          </button>
        </section>
      </div>
    </div>
  )
}
