import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  KeyRound,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Unplug,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import AddConnectorModal from '../components/AddConnectorModal'
import TopBar from '../components/TopBar'
import ToolBadge from '../components/ToolBadge'
import { useCore } from '../context/CoreContext'
import { deleteCustomConnector } from '../integrations/bridge'
import { removeLocalSessionConnector } from '../integrations/sessionStore'
import {
  categoryLabels,
  type ToolCategory,
  type ToolStatus,
} from '../data/tools'
import { desktopApi, isOrionDesktop } from '../lib/desktop'

const statusLabel: Record<ToolStatus, string> = {
  connected: 'Connecté',
  syncing: 'Sync…',
  error: 'Erreur',
  available: 'Disponible',
}

export default function ConnectionsPage() {
  const {
    tools,
    openConnectModal,
    disconnectTool,
    googleConfigured,
    refreshConnections,
    customConnectorIds,
  } = useCore()
  const [filter, setFilter] = useState<'all' | ToolCategory | 'live' | 'custom'>('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const [oauthBanner, setOauthBanner] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const desktop = isOrionDesktop()
  const desk = desktopApi()

  useEffect(() => {
    const oauth = searchParams.get('oauth')
    if (!oauth) return
    const provider = searchParams.get('provider') || 'outil'
    const account = searchParams.get('account')
    const message = searchParams.get('message')

    if (oauth === 'success') {
      setOauthBanner(
        account
          ? `${provider} connecté · ${account}`
          : `${provider} connecté avec succès.`,
      )
      void refreshConnections()
    } else {
      setOauthBanner(message || `Échec OAuth (${provider})`)
    }

    const next = new URLSearchParams(searchParams)
    ;['oauth', 'provider', 'account', 'message'].forEach((k) => next.delete(k))
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, refreshConnections])

  const categories = useMemo(
    () => Array.from(new Set(tools.map((t) => t.category))),
    [tools],
  )

  const customSet = useMemo(() => new Set(customConnectorIds), [customConnectorIds])

  const filtered = tools.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'live') return t.status !== 'available'
    if (filter === 'custom') return customSet.has(t.id)
    return t.category === filter
  })

  async function removeCustom(slug: string) {
    if (!confirm('Supprimer ce connecteur personnalisé ?')) return
    setBusySlug(slug)
    try {
      if (desk?.clearSession) {
        try {
          await desk.clearSession({ slug })
        } catch {
          /* ignore */
        }
      }
      removeLocalSessionConnector(slug)
      try {
        await deleteCustomConnector(slug)
      } catch {
        /* peut n’exister que en local */
      }
      await refreshConnections()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Suppression impossible')
    } finally {
      setBusySlug(null)
    }
  }

  async function openSessionTool(tool: (typeof tools)[number]) {
    if (!desk?.openSessionApp) return
    const url = tool.domain
      ? `https://${tool.domain}`
      : `https://${tool.id.replace(/^custom_/, '').replace(/_/g, '.')}`
    try {
      await desk.openSessionApp({
        slug: tool.id,
        url,
        name: tool.name,
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ouverture impossible')
    }
  }

  return (
    <div className="page-view">
      <TopBar
        title="Connexions"
        subtitle={
          desktop
            ? 'Branchez vos outils — ou collez un lien et connectez-vous dans Orion Desktop.'
            : 'Branchez vos outils — ou ajoutez n’importe quel logiciel via son lien OAuth.'
        }
        actions={
          <button
            type="button"
            className="btn btn--white btn--sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={14} /> Ajouter un logiciel
          </button>
        }
      />

      <div className="page-view__body">
        {oauthBanner ? (
          <section className="panel setup-banner">
            <div>
              <h2>Connexion OAuth</h2>
              <p className="muted">{oauthBanner}</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setOauthBanner(null)}
            >
              OK
            </button>
          </section>
        ) : null}

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
          <button
            type="button"
            className={filter === 'custom' ? 'is-active' : ''}
            onClick={() => setFilter('custom')}
          >
            Ajoutés ({customConnectorIds.length})
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
              <p className="tool-card__cat">
                {categoryLabels[tool.category]}
                {customSet.has(tool.id) ? ' · Personnalisé' : ''}
              </p>
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
                {tool.features.includes('En attente') ? (
                  <button type="button" className="btn btn--ghost btn--sm" disabled>
                    Activation Orion…
                  </button>
                ) : tool.status === 'available' ? (
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
                    {desktop &&
                    customSet.has(tool.id) &&
                    tool.permissions.includes('Session Desktop') ? (
                      <button
                        type="button"
                        className="btn btn--white btn--sm"
                        onClick={() => void openSessionTool(tool)}
                      >
                        <ExternalLink size={14} /> Ouvrir
                      </button>
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
                {customSet.has(tool.id) ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={busySlug === tool.id}
                    onClick={() => void removeCustom(tool.id)}
                    title="Supprimer le connecteur"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </footer>
            </motion.article>
          ))}
        </div>
      </div>

      <AddConnectorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          void refreshConnections()
        }}
        onConnectKnown={(toolId) => {
          const tool = tools.find((t) => t.id === toolId)
          if (tool) openConnectModal(tool)
        }}
      />
    </div>
  )
}
