import { Check, Pencil } from 'lucide-react'
import TopBar from '../components/TopBar'
import HubBoard from '../hub/HubBoard'
import { HubLayoutProvider, useHubLayout } from '../hub/HubLayoutContext'

function HubPageInner() {
  const { editing, setEditing, setSelectedId } = useHubLayout()

  return (
    <div className="page-view">
      <TopBar
        title="Hub"
        subtitle={
          editing
            ? 'Cliquez un élément pour le supprimer, ou + pour en ajouter.'
            : 'Votre tableau de bord multi-fenêtres — mails, agents, outils et plus.'
        }
        actions={
          <button
            type="button"
            className={`btn btn--sm ${editing ? 'btn--white' : 'btn--ghost'} hub-customize-btn`}
            onClick={() => {
              const next = !editing
              setEditing(next)
              if (!next) setSelectedId(null)
            }}
          >
            {editing ? <Check size={15} /> : <Pencil size={15} />}
            {editing ? 'Terminer' : 'Personnaliser l’affichage'}
          </button>
        }
      />

      <div className="page-view__body page-view__body--hub">
        <HubBoard />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <HubLayoutProvider>
      <HubPageInner />
    </HubLayoutProvider>
  )
}
