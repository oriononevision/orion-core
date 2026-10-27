import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Link2, RefreshCw, Unplug } from 'lucide-react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import ToolBadge from '../components/ToolBadge'
import { useCore } from '../context/CoreContext'
import {
  categoryLabels,
  type ToolCategory,
  type ToolStatus,
} from '../data/tools'

const statusLabel: Record<ToolStatus, string> = {
  connected: 'Connecté',
  syncing: 'Sync…',
  error: 'Erreur',
  available: 'Disponible',
}

export default function ConnectionsPage() {
  const { tools, openConnectModal, disconnectTool, googleConfigured } = useCore()
  const [filter, setFilter] = useState<'all' | ToolCategory | 'live'>('all')

  const categories = useMemo(
    () => Array.from(new Set(tools.map((t) => t.category))),
    [tools],
  )

  const filtered = tools.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'live') return t.status !== 'available'
    return t.category === filter
  })

  return (
    <div className="page-view">
      <TopBar
        title="Connexions"
        subtitle="Branchez vos outils. Core agrège leurs données et expose les actions aux agents."
      />

      <div className="page-view__body">
        {!googleConfigured ? (
          <section className="panel setup-banner">
            <div>
              <h2>Setup Google requis</h2>
              <p className="muted">
                Une fois pour le projet : créez le Client ID sur Google Cloud, puis
                collez-le. Ensuite Gmail / Drive / Agenda se connectent par e-mail.
              </p>
            </div>
            <Link to="/setup-google" className="btn btn--accent btn--sm">
              <KeyRound size={14} /> Faire le setup
            </Link>
          </section>
        ) : null}

        <div className="filter-bar">
          <button
            type="button"
            className={filter === 'all' ? 'is-active' : ''}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
          <button
            type="button"
            className={filter === 'live' ? 'is-active' : ''}
            onClick={() => setFilter('live')}
          >
            Connectés
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={filter === c ? 'is-active' : ''}
              onClick={() => setFilter(c)}
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>

        <div className="tool-grid">
          {filtered.map((tool, i) => (
            <motion.article
              key={tool.id}
              className={`tool-card tool-card--${tool.status}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.4 }}
            >
              <header>
                <ToolBadge id={tool.id} size="lg" />
                <span className={`status-pill status-pill--${tool.status}`}>
                  {statusLabel[tool.status]}
                </span>
              </header>
              <h3>{tool.name}</h3>
              <p className="tool-card__cat">{categoryLabels[tool.category]}</p>
              <p className="tool-card__desc">{tool.description}</p>

              {tool.status !== 'available' ? (
                <dl className="tool-card__meta">
                  <div>
                    <dt>Dernière sync</dt>
                    <dd>{tool.lastSync}</dd>
                  </div>
                  <div>
                    <dt>Éléments</dt>
                    <dd>{tool.itemsSynced?.toLocaleString('fr-FR') ?? '—'}</dd>
                  </div>
                </dl>
              ) : (
                <ul className="tool-card__perms">
                  {tool.permissions.slice(0, 3).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}

              <footer className="tool-card__footer">
                {tool.status === 'available' ? (
                  <button
                    type="button"
                    className="btn btn--white btn--sm"
                    onClick={() => openConnectModal(tool)}
                  >
                    <Link2 size={14} /> Connecter
                  </button>
                ) : tool.status === 'error' ? (
                  <button
                    type="button"
                    className="btn btn--accent btn--sm"
                    onClick={() => openConnectModal(tool)}
                  >
                    <RefreshCw size={14} /> Reconnecter
                  </button>
                ) : (
                  <>
                    {tool.id === 'gmail' ? (
                      <Link to="/mail" className="btn btn--white btn--sm">
                        Ouvrir Gmail
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => void disconnectTool(tool.id)}
                    >
                      <Unplug size={14} /> Déconnecter
                    </button>
                  </>
                )}
              </footer>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}
