import { useState } from 'react'
import TopBar from '../components/TopBar'
import { ToolBadgeRow } from '../components/ToolBadge'
import { activity, type ActivityItem } from '../data/activity'

const types: Array<ActivityItem['type'] | 'all'> = [
  'all',
  'email',
  'agent',
  'crm',
  'file',
  'meeting',
  'sync',
  'alert',
]

const typeLabels: Record<string, string> = {
  all: 'Tout',
  email: 'E-mail',
  agent: 'Agents',
  crm: 'CRM',
  file: 'Fichiers',
  meeting: 'Réunions',
  sync: 'Sync',
  alert: 'Alertes',
}

export default function ActivityPage() {
  const [type, setType] = useState<(typeof types)[number]>('all')
  const items = activity.filter((a) => type === 'all' || a.type === type)

  return (
    <div className="page-view">
      <TopBar
        title="Activité"
        subtitle="Journal temps réel de vos outils et des actions agents."
      />

      <div className="page-view__body">
        <div className="filter-bar">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={type === t ? 'is-active' : ''}
              onClick={() => setType(t)}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>

        <ul className="feed feed--full panel">
          {items.map((item) => (
            <li key={item.id} className={item.unread ? 'is-unread' : ''}>
              <div className="feed__type">{typeLabels[item.type]}</div>
              <div className="feed__main">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <ToolBadgeRow ids={item.toolIds} />
              </div>
              <time>{item.time}</time>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
