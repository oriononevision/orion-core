import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Plug,
  Bot,
  Users,
  FolderKanban,
  FileText,
  Activity,
  Settings,
  Sparkles,
  Mail,
  CalendarDays,
} from 'lucide-react'
import { useCore } from '../context/CoreContext'
import { useMail } from '../context/MailContext'

export default function Sidebar() {
  const { tools } = useCore()
  const { unreadCount } = useMail()
  const connected = tools.filter((t) => t.status === 'connected' || t.status === 'syncing').length
  const gmailOn = tools.some((t) => t.id === 'gmail' && t.status === 'connected')
  const anyMail = tools.some(
    (t) =>
      (t.id === 'gmail' ||
        t.id === 'outlook' ||
        t.id === 'yahoo' ||
        t.id === 'icloud' ||
        t.id === 'imap') &&
      t.status === 'connected',
  )
  const driveOn = tools.some((t) => t.id === 'drive' && t.status === 'connected')
  const calOn = tools.some((t) => t.id === 'calendar' && t.status === 'connected')

  const links = [
    { to: '/', label: 'Hub', icon: LayoutDashboard, end: true },
    { to: '/connexions', label: 'Connexions', icon: Plug },
    ...(anyMail ? [{ to: '/mail', label: gmailOn ? 'Gmail' : 'Mail', icon: Mail }] : []),
    ...(driveOn ? [{ to: '/documents', label: 'Drive', icon: FileText }] : []),
    ...(calOn ? [{ to: '/agenda', label: 'Agenda', icon: CalendarDays }] : []),
    { to: '/agents', label: 'Agents IA', icon: Bot },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/projets', label: 'Projets', icon: FolderKanban },
    ...(!driveOn ? [{ to: '/documents', label: 'Documents', icon: FileText }] : []),
    { to: '/activite', label: 'Activité', icon: Activity },
    { to: '/reglages', label: 'Réglages', icon: Settings },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          <Sparkles size={16} />
        </span>
        <div>
          <strong>ORION</strong>
          <span>Core</span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Navigation Core">
        {links.map((l) => (
          <NavLink
            key={l.to + l.label}
            to={l.to}
            end={'end' in l ? Boolean(l.end) : false}
            className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
          >
            <l.icon size={18} strokeWidth={1.75} />
            <span>{l.label}</span>
            {l.to === '/mail' && unreadCount > 0 ? (
              <em className="sidebar__count">{unreadCount}</em>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__foot">
        <p className="sidebar__stat">
          <strong>{connected}</strong> outils connectés
        </p>
        <p className="sidebar__hint">Espace · Équipe Orion</p>
      </div>
    </aside>
  )
}
