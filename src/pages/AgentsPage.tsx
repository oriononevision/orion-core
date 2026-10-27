import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Sparkles,
  XCircle,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import { ToolBadgeRow } from '../components/ToolBadge'
import { useAgents } from '../context/AgentsContext'
import { useCore } from '../context/CoreContext'
import type { Agent } from '../data/agents'

const statusCopy = {
  idle: 'En veille',
  running: 'En cours',
  waiting: 'En attente',
  done: 'Terminé',
}

const agentHelp: Record<string, string> = {
  nexus:
    'Orchestrateur : consolide l’état des outils connectés et le Hub mails en un brief actionnable.',
  mailer:
    'Lit votre Gmail réel, score les messages importants / relances, et prépare des brouillons à valider.',
  'crm-pulse':
    'Repère les signaux commerciaux dans vos e-mails (devis, deals, propositions) pour prioriser le suivi.',
  archiviste:
    'Indexe les fichiers récents de Google Drive et les expose aux autres agents.',
  sentinel:
    'Détecte les messages de type support / urgence dans la boîte et les priorise.',
  meeting:
    'Lit Google Calendar et assemble un brief (invités, contexte e-mails liés) pour chaque rendez-vous.',
}

export default function AgentsPage() {
  const { tools } = useCore()
  const {
    agents,
    runs,
    drafts,
    runningId,
    lastSummary,
    runOne,
    runAllReady,
    pause,
    setDraftStatus,
  } = useAgents()

  const [selectedId, setSelectedId] = useState(agents[0]?.id ?? 'mailer')
  const selected = agents.find((a) => a.id === selectedId) ?? agents[0]
  const pendingDrafts = drafts.filter((d) => d.status === 'pending')

  const connectedIds = useMemo(
    () =>
      new Set(
        tools
          .filter((t) => t.status === 'connected' || t.status === 'syncing')
          .map((t) => t.id),
      ),
    [tools],
  )

  const selectedRuns = useMemo(() => {
    if (!selected) return []
    const own = runs.filter((r) => r.agentId === selected.id)
    const others = runs.filter((r) => r.agentId !== selected.id)
    return [...own, ...others].slice(0, 6)
  }, [runs, selected])

  function onToggle(agent: Agent) {
    if (runningId === agent.id || agent.status === 'running') {
      pause(agent.id)
      return
    }
    void runOne(agent.id)
  }

  if (!selected) return null

  return (
    <div className="page-view">
      <TopBar
        title="Agents IA"
        subtitle="Agents réels branchés sur Gmail, Agenda et Drive — ils analysent vos données et proposent des actions à valider."
      />

      <div className="page-view__body">
        <div className="agents-toolbar">
          <button
            type="button"
            className="btn btn--white btn--sm"
            disabled={Boolean(runningId)}
            onClick={() => void runAllReady()}
          >
            {runningId ? (
              <>
                <Loader2 size={14} className="spin" /> Exécution…
              </>
            ) : (
              <>
                <Sparkles size={14} /> Lancer tous les agents
              </>
            )}
          </button>
          {lastSummary ? <p className="muted agents-toolbar__summary">{lastSummary}</p> : null}
        </div>

        <div className="agents-layout">
          <div className="agent-grid">
            {agents.map((agent, i) => {
              const missing = agent.tools.filter((t) => !connectedIds.has(t))
              return (
                <motion.button
                  key={agent.id}
                  type="button"
                  className={`agent-card${selected.id === agent.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(agent.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <header>
                    <h3>{agent.name}</h3>
                    <span className={`status-pill status-pill--agent-${agent.status}`}>
                      {runningId === agent.id ? 'En cours' : statusCopy[agent.status]}
                    </span>
                  </header>
                  <p className="agent-card__role">{agent.role}</p>
                  <p className="agent-card__desc">{agent.description}</p>
                  <ToolBadgeRow ids={agent.tools} />
                  {missing.length > 0 ? (
                    <p className="agent-card__warn">
                      Manque : {missing.slice(0, 3).join(', ')}
                      {missing.length > 3 ? '…' : ''}
                    </p>
                  ) : (
                    <p className="agent-card__ok">Outils prêts</p>
                  )}
                  <footer>
                    <span>{agent.runsToday} runs</span>
                    <span>{agent.successRate}% OK</span>
                  </footer>
                </motion.button>
              )
            })}
          </div>

          <aside className="panel agent-detail">
            <p className="eyebrow">Agent sélectionné</p>
            <h2>{selected.name}</h2>
            <p className="agent-detail__role">{selected.role}</p>
            <p>{selected.description}</p>
            <p className="muted">{agentHelp[selected.id]}</p>

            <h3>Capacités</h3>
            <div className="chip-row">
              {selected.capabilities.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </div>

            <h3>Outils liés</h3>
            <ToolBadgeRow ids={selected.tools} />

            <h3>Dernière action</h3>
            <p className="agent-detail__last">{selected.lastAction}</p>

            <div className="agent-detail__actions">
              <button
                type="button"
                className="btn btn--white btn--sm"
                disabled={Boolean(runningId) && runningId !== selected.id}
                onClick={() => onToggle(selected)}
              >
                {runningId === selected.id || selected.status === 'running' ? (
                  <>
                    <Pause size={14} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={14} /> Lancer
                  </>
                )}
              </button>
              {pendingDrafts.length > 0 ? (
                <span className="chip chip--accent">{pendingDrafts.length} brouillon(s)</span>
              ) : null}
            </div>

            {pendingDrafts.length > 0 ? (
              <>
                <h3>Brouillons à valider</h3>
                <ul className="agent-drafts">
                  {pendingDrafts.slice(0, 5).map((d) => (
                    <li key={d.id}>
                      <div>
                        <strong>{d.subject}</strong>
                        <p>
                          → {d.to}
                        </p>
                        <pre>{d.body.slice(0, 180)}{d.body.length > 180 ? '…' : ''}</pre>
                      </div>
                      <div className="agent-drafts__actions">
                        {d.mailId ? (
                          <Link
                            to={`/mail?open=${encodeURIComponent(d.mailId)}`}
                            className="btn btn--ghost btn--sm"
                            onClick={() => setDraftStatus(d.id, 'approved')}
                          >
                            <CheckCircle2 size={14} /> Ouvrir dans Gmail
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setDraftStatus(d.id, 'dismissed')}
                        >
                          <XCircle size={14} /> Ignorer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <h3>Runs récents</h3>
            {selectedRuns.length === 0 ? (
              <p className="muted">Aucun run encore — lancez un agent pour alimenter cette liste.</p>
            ) : (
              <ul className="mini-list">
                {selectedRuns.map((run) => (
                  <li key={run.id}>
                    <div>
                      <strong>{run.title}</strong>
                      <p>{run.detail}</p>
                      <ToolBadgeRow ids={run.tools} />
                    </div>
                    <time>{run.time}</time>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
