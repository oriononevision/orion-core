import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ToolBadge from '../../components/ToolBadge'
import { useCore } from '../../context/CoreContext'
import type { HubWindowConfig } from '../types'

export default function ToolsWindow({ config }: { config: HubWindowConfig }) {
  const { tools } = useCore()
  const connected = tools.filter((t) => {
    const active = t.status === 'connected' || t.status === 'syncing'
    if (!active) return false
    if (config.connectorIds.length === 0) return true
    return config.connectorIds.includes(t.id)
  })

  return (
    <>
      <header className="panel__head">
        <h2>Outils connectés</h2>
        <Link to="/connexions">
          Catalogue <ArrowRight size={14} />
        </Link>
      </header>
      {connected.length === 0 ? (
        <p className="muted">Aucun outil lié à cette fenêtre.</p>
      ) : (
        <div className="tool-chip-grid">
          {connected.map((t) => (
            <div key={t.id} className="tool-chip">
              <ToolBadge id={t.id} />
              <div>
                <strong>{t.name}</strong>
                <span>{t.lastSync}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
