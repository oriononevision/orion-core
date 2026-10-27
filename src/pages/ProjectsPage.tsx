import TopBar from '../components/TopBar'
import { ToolBadgeRow } from '../components/ToolBadge'
import { projects } from '../data/projects'
import { clients } from '../data/clients'

const labels = {
  en_cours: 'En cours',
  bloque: 'Bloqué',
  termine: 'Terminé',
  planifie: 'Planifié',
}

export default function ProjectsPage() {
  return (
    <div className="page-view">
      <TopBar
        title="Projets"
        subtitle="Projets alimentés par Notion, Linear, Drive et le CRM — progression visible."
      />

      <div className="page-view__body">
        <div className="project-grid">
          {projects.map((p) => {
            const client = clients.find((c) => c.id === p.clientId)
            return (
              <article key={p.id} className="project-card project-card--lg">
                <header>
                  <div>
                    <p className="eyebrow">{client?.name ?? 'Interne'}</p>
                    <h3>{p.name}</h3>
                  </div>
                  <span className={`status-pill status-pill--${p.status}`}>
                    {labels[p.status]}
                  </span>
                </header>
                <p>{p.summary}</p>
                <div className="progress">
                  <div className="progress__bar" style={{ width: `${p.progress}%` }} />
                </div>
                <dl className="meta-inline">
                  <div>
                    <dt>Owner</dt>
                    <dd>{p.owner}</dd>
                  </div>
                  <div>
                    <dt>Échéance</dt>
                    <dd>{p.due}</dd>
                  </div>
                  <div>
                    <dt>Tâches</dt>
                    <dd>
                      {p.tasksDone}/{p.tasksTotal}
                    </dd>
                  </div>
                </dl>
                <ToolBadgeRow ids={p.sources} />
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
