import { Trash2 } from 'lucide-react'
import { useHubLayout } from './HubLayoutContext'
import type { HubWindowConfig } from './types'
import ActivityWindow from './windows/ActivityWindow'
import AgentsWindow from './windows/AgentsWindow'
import ComingSoonWindow from './windows/ComingSoonWindow'
import MailPrioritiesWindow from './windows/MailPrioritiesWindow'
import ProjectsWindow from './windows/ProjectsWindow'
import StatsWindow from './windows/StatsWindow'
import ToolsWindow from './windows/ToolsWindow'

function WindowBody({ config }: { config: HubWindowConfig }) {
  switch (config.type) {
    case 'stats':
      return <StatsWindow />
    case 'mail_priorities':
      return <MailPrioritiesWindow config={config} />
    case 'agents':
      return <AgentsWindow />
    case 'tools':
      return <ToolsWindow config={config} />
    case 'projects':
      return <ProjectsWindow />
    case 'activity':
      return <ActivityWindow config={config} />
    case 'notes':
    case 'chart_placeholder':
    case 'widget_placeholder':
      return <ComingSoonWindow type={config.type} />
    default:
      return null
  }
}

export default function HubWindow({ config }: { config: HubWindowConfig }) {
  const { editing, selectedId, setSelectedId, removeWindow } = useHubLayout()

  const selected = editing && selectedId === config.id
  const isStats = config.type === 'stats'

  return (
    <article
      className={[
        'hub-window',
        `hub-window--w-${config.w}`,
        `hub-window--h-${config.h}`,
        isStats ? 'hub-window--bare' : 'panel',
        editing ? 'hub-window--editing' : '',
        selected ? 'is-selected' : '',
        config.hidden ? 'is-hidden-preview' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => {
        if (!editing) return
        e.stopPropagation()
        setSelectedId(selected ? null : config.id)
      }}
    >
      {selected ? (
        <button
          type="button"
          className="hub-window__trash"
          title="Supprimer"
          aria-label="Supprimer cet élément"
          onClick={(e) => {
            e.stopPropagation()
            removeWindow(config.id)
          }}
        >
          <Trash2 size={15} />
        </button>
      ) : null}

      <div className="hub-window__body">
        <WindowBody config={config} />
      </div>
    </article>
  )
}
