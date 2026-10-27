import { Link } from 'react-router-dom'
import { Bot, Plug, Users, Zap } from 'lucide-react'
import { useAgents } from '../../context/AgentsContext'
import { useCore } from '../../context/CoreContext'
import { clients } from '../../data/clients'

export default function StatsWindow() {
  const { tools } = useCore()
  const { agents } = useAgents()
  const connected = tools.filter((t) => t.status === 'connected' || t.status === 'syncing')
  const runningAgents = agents.filter((a) => a.status === 'running' || a.status === 'waiting')

  const stats = [
    { label: 'Outils actifs', value: String(connected.length), icon: Plug, to: '/connexions' },
    { label: 'Agents actifs', value: String(runningAgents.length), icon: Bot, to: '/agents' },
    { label: 'Clients', value: String(clients.length), icon: Users, to: '/clients' },
    {
      label: 'Items sync',
      value: connected
        .reduce((s, t) => s + (t.itemsSynced ?? 0), 0)
        .toLocaleString('fr-FR'),
      icon: Zap,
      to: '/connexions',
    },
  ]

  return (
    <div className="stat-grid hub-window__stats">
      {stats.map((s) => (
        <Link key={s.label} to={s.to} className="stat-card">
          <s.icon size={18} strokeWidth={1.75} />
          <div>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
