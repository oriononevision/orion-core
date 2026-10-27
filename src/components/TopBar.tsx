import type { ReactNode } from 'react'
import { Search, Bell, Command } from 'lucide-react'
import { useCore } from '../context/CoreContext'
import { activity } from '../data/activity'

export default function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  const { setSearchOpen } = useCore()
  const unread = activity.filter((a) => a.unread).length

  return (
    <header className="topbar">
      <div className="topbar__titles">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className="topbar__actions">
        {actions}

        <button
          type="button"
          className="topbar__search"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={16} />
          <span>Rechercher dans tous les outils…</span>
          <kbd>
            <Command size={11} />K
          </kbd>
        </button>

        <button type="button" className="topbar__icon-btn" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 ? <span className="topbar__badge">{unread}</span> : null}
        </button>

        <div className="topbar__avatar" title="Vous">
          OR
        </div>
      </div>
    </header>
  )
}
