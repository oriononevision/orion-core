import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import ToolBadge from '../components/ToolBadge'
import { useCore } from '../context/CoreContext'
import { listDriveFiles, type DriveFile } from '../integrations/google/drive'
import { getGoogleAccessToken } from '../integrations/google/tokenStore'

export default function DocumentsPage() {
  const { tools, openConnectModal, googleConfigured } = useCore()
  const drive = tools.find((t) => t.id === 'drive')
  const connected = drive?.status === 'connected'
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  async function refresh() {
    const token = getGoogleAccessToken()
    if (!token || !connected) {
      setFiles([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      setFiles(await listDriveFiles(token, 60))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur Drive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [connected]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!connected) {
    return (
      <div className="page-view">
        <TopBar title="Documents" subtitle="Fichiers de votre Google Drive réel." />
        <div className="page-view__body">
          <div className="panel mail-empty">
            <ToolBadge id="drive" size="lg" />
            <h2>Google Drive non connecté</h2>
            <p>Connectez Google pour lister et ouvrir vos fichiers Drive dans Core.</p>
            {!googleConfigured ? (
              <p className="mail-setup">
                Setup Google manquant. <Link to="/setup-google">Configurer</Link>
              </p>
            ) : null}
            {googleConfigured ? (
              <button
                type="button"
                className="btn btn--white btn--sm"
                disabled={!drive}
                onClick={() => drive && openConnectModal(drive)}
              >
                Connecter Google Drive
              </button>
            ) : (
              <Link to="/setup-google" className="btn btn--white btn--sm">
                Faire le setup Google
              </Link>
            )}
            <Link to="/connexions" className="mail-empty__link">
              Connexions →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const filtered = files.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page-view">
      <TopBar
        title="Documents"
        subtitle={`Google Drive · ${files.length} fichiers chargés`}
      />
      <div className="page-view__body">
        <div className="mail-list__search" style={{ maxWidth: 360 }}>
          <input
            className="field field--wide"
            style={{ margin: 0, border: 'none', background: 'transparent' }}
            placeholder="Filtrer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void refresh()}>
            <RefreshCw size={14} />
          </button>
        </div>
        {loading ? <p className="muted">Chargement Drive API…</p> : null}
        {error ? <p className="mail-list__error">{error}</p> : null}
        <div className="doc-table panel">
          <div className="doc-table__head">
            <span>Nom</span>
            <span>Type</span>
            <span>Modifié</span>
            <span>Ouvrir</span>
          </div>
          {filtered.map((f) => (
            <article key={f.id} className="doc-row">
              <div className="doc-row__main">
                <strong>{f.name}</strong>
              </div>
              <div>{f.mimeType.replace('application/', '').slice(0, 28)}</div>
              <div className="doc-row__meta">
                <span>
                  {f.modifiedTime
                    ? new Date(f.modifiedTime).toLocaleString('fr-FR')
                    : '—'}
                </span>
              </div>
              <div>
                {f.webViewLink ? (
                  <a
                    href={f.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--ghost btn--sm"
                  >
                    <ExternalLink size={14} /> Drive
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
