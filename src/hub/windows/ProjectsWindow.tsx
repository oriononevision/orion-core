import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ToolBadgeRow } from '../../components/ToolBadge'
import { projects } from '../../data/projects'

export default function ProjectsWindow() {
  const list = projects
    .filter((p) => p.status === 'en_cours' || p.status === 'planifie')
    .slice(0, 4)

  return (
    <>
      <header className="panel__head">
        <h2>Projets en cours</h2>
        <Link to="/projets">
          Tous les projets <ArrowRight size={14} />
        </Link>
      </header>
      <div className="project-row">
        {list.map((p) => (
          <article key={p.id} className="project-card">
            <header>
              <h3>{p.name}</h3>
              <span className={`status-pill status-pill--${p.status}`}>
                {p.status.replace('_', ' ')}
              </span>
            </header>
            <p>{p.summary}</p>
            <div className="progress">
              <div className="progress__bar" style={{ width: `${p.progress}%` }} />
            </div>
            <footer>
              <span>
                {p.tasksDone}/{p.tasksTotal} tâches
              </span>
              <ToolBadgeRow ids={p.sources.slice(0, 4)} />
            </footer>
          </article>
        ))}
      </div>
    </>
  )
}
