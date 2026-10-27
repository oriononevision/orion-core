import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ToolBadgeRow } from '../../components/ToolBadge'
import { useAgents } from '../../context/AgentsContext'
import { useMail } from '../../context/MailContext'
import { buildHubInsights } from '../../lib/mailIntelligence'

export default function AgentsWindow() {
  const { agents, runs, runOne, runningId } = useAgents()
  const { mails } = useMail()
  const hub = buildHubInsights(mails, 'gmail')

  return (
    <>
      <header className="panel__head">
        <h2>Agents</h2>
        <Link to="/agents">
          Gérer <ArrowRight size={14} />
        </Link>
      </header>
      <ul className="mini-list">
        {runs.slice(0, 4).map((run) => {
          const agent = agents.find((a) => a.id === run.agentId)
          return (
            <li key={run.id}>
              <div>
                <strong>{run.title}</strong>
                <p>
                  {agent?.name} · {run.detail}
                </p>
                <ToolBadgeRow ids={run.tools} />
              </div>
              <span className={`status-pill status-pill--${run.status}`}>
                {run.status === 'success'
                  ? 'OK'
                  : run.status === 'running'
                    ? 'En cours'
                    : 'À valider'}
              </span>
            </li>
          )
        })}
      </ul>
      {runs.length === 0 ? (
        <p className="hub-agent-hint">
          <Sparkles size={13} /> Aucun run encore —{' '}
          <button
            type="button"
            className="linkish"
            disabled={Boolean(runningId)}
            onClick={() => void runOne('mailer')}
          >
            lancer Mailer
          </button>{' '}
          sur votre Gmail.
        </p>
      ) : hub.followups.length > 0 ? (
        <p className="hub-agent-hint">
          <Sparkles size={13} /> {hub.followups.length} relance
          {hub.followups.length > 1 ? 's' : ''} détectée
          {hub.followups.length > 1 ? 's' : ''} — Mailer peut préparer les brouillons.
        </p>
      ) : null}
    </>
  )
}
