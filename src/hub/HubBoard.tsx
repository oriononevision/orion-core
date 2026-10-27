import { Link } from 'react-router-dom'
import { useCore } from '../context/CoreContext'
import { useHubLayout } from './HubLayoutContext'
import HubAddMenu from './HubAddMenu'
import HubWindow from './HubWindow'

export default function HubBoard() {
  const { tools } = useCore()
  const { layout, editing, setSelectedId } = useHubLayout()
  const errors = tools.filter((t) => t.status === 'error')
  const visible = layout.windows.filter((w) => editing || !w.hidden)

  return (
    <div className={`hub-board-wrap ${editing ? 'is-editing' : ''}`}>
      <HubAddMenu />

      <div
        className="hub-board"
        onClick={() => {
          if (editing) setSelectedId(null)
        }}
      >
        {errors.length > 0 ? (
          <div className="alert-banner hub-board__alert">
            <strong>Attention</strong>
            <span>
              {errors.map((e) => e.name).join(', ')} — reconnexion requise pour les
              agents.
            </span>
            <Link to="/connexions">Corriger →</Link>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="hub-board__empty panel">
            <strong>Hub vide</strong>
            <p className="muted">
              {editing
                ? 'Utilisez le bouton + pour ajouter des éléments.'
                : 'Personnalisez l’affichage ou relancez l’onboarding dans les réglages.'}
            </p>
          </div>
        ) : (
          visible.map((w) => <HubWindow key={w.id} config={w} />)
        )}
      </div>
    </div>
  )
}
