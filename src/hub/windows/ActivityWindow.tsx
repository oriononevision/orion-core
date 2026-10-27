import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ToolBadgeRow } from '../../components/ToolBadge'
import { activity } from '../../data/activity'
import type { HubWindowConfig } from '../types'

export default function ActivityWindow({ config }: { config: HubWindowConfig }) {
  const items = activity
    .filter((a) =>
      config.connectorIds.length === 0
        ? true
        : a.toolIds.some((id) => config.connectorIds.includes(id)),
    )
    .slice(0, 6)

  return (
    <>
      <header className="panel__head">
        <h2>Activité</h2>
        <Link to="/activite">
          Tout voir <ArrowRight size={14} />
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="muted">Aucun événement pour ces connecteurs.</p>
      ) : (
        <ul className="mini-list">
          {items.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{a.title}</strong>
                <p>{a.detail}</p>
                <ToolBadgeRow ids={a.toolIds} />
              </div>
              <time className="muted">{a.time}</time>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
