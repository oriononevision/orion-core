import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Sparkles } from 'lucide-react'
import ToolBadge, { ToolBadgeRow } from '../../components/ToolBadge'
import { useCore } from '../../context/CoreContext'
import { useMail } from '../../context/MailContext'
import { altMailToolIds } from '../../integrations/config'
import { buildHubInsights, type MailInsight } from '../../lib/mailIntelligence'
import type { HubWindowConfig } from '../types'

type HubFilter = 'priority' | 'followup' | 'all'

export default function MailPrioritiesWindow({ config }: { config: HubWindowConfig }) {
  const { tools, openConnectModal } = useCore()
  const { mails, loading, unreadCount, accountEmail, refresh } = useMail()
  const [filter, setFilter] = useState<HubFilter>('priority')

  const gmail = tools.find((t) => t.id === 'gmail')
  const gmailOn = gmail?.status === 'connected'

  const mailTools = tools.filter((t) => {
    const isMail = t.id === 'gmail' || altMailToolIds.has(t.id)
    const linked =
      config.connectorIds.length === 0 || config.connectorIds.includes(t.id)
    return (
      isMail &&
      linked &&
      (t.status === 'connected' || t.status === 'syncing')
    )
  })

  const hub = useMemo(() => buildHubInsights(mails, 'gmail'), [mails])

  const feedItems: MailInsight[] = useMemo(() => {
    if (filter === 'followup') return hub.followups.slice(0, 8)
    if (filter === 'all') return hub.insights.slice(0, 10)
    return [...hub.important, ...hub.followups]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [filter, hub])

  return (
    <div className="hub-intel">
      <header className="panel__head">
        <div className="hub-intel__title">
          <h2>Priorités &amp; mails</h2>
          <p className="muted">
            {gmailOn
              ? `${accountEmail ?? 'Gmail'} · ${unreadCount} non lus · ${hub.priorityCount} à traiter`
              : 'Connectez une boîte pour alimenter le Hub et les agents'}
          </p>
        </div>
        <Link to="/mail">
          Boîte <ArrowRight size={14} />
        </Link>
      </header>

      <div className="hub-intel__filters">
        {(
          [
            ['priority', 'Importants'],
            ['followup', 'Relances IA'],
            ['all', 'Tous'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={filter === id ? 'is-active' : ''}
            onClick={() => setFilter(id)}
          >
            {label}
            {id === 'followup' && hub.followups.length > 0 ? (
              <em>{hub.followups.length}</em>
            ) : null}
            {id === 'priority' && hub.priorityCount > 0 ? (
              <em>{hub.priorityCount}</em>
            ) : null}
          </button>
        ))}
        {gmailOn ? (
          <button type="button" className="hub-intel__refresh" onClick={() => void refresh()}>
            Actualiser
          </button>
        ) : null}
      </div>

      {!gmailOn ? (
        <div className="hub-intel__empty">
          <Mail size={22} strokeWidth={1.6} />
          <p>
            Branchez Gmail, Outlook, Yahoo, iCloud ou n’importe quel IMAP — le Hub trie
            l’important et propose les relances aux agents.
          </p>
          <div className="hub-intel__cta">
            {gmail ? (
              <button
                type="button"
                className="btn btn--white btn--sm"
                onClick={() => openConnectModal(gmail)}
              >
                Connecter Gmail
              </button>
            ) : null}
            <Link to="/connexions" className="btn btn--ghost btn--sm">
              Autres boîtes mail
            </Link>
          </div>
        </div>
      ) : loading && mails.length === 0 ? (
        <p className="muted hub-intel__loading">Chargement de votre boîte…</p>
      ) : feedItems.length === 0 ? (
        <p className="muted hub-intel__loading">Rien à signaler sur ce filtre — boîte à jour.</p>
      ) : (
        <ul className="feed hub-feed">
          {feedItems.map((item) => (
            <li key={item.id} className={item.unread ? 'is-unread' : ''}>
              <div className="feed__main">
                <div className="hub-feed__tags">
                  <span className={`hub-tag hub-tag--${item.kind}`}>
                    {item.kind === 'followup'
                      ? 'Relance'
                      : item.kind === 'important'
                        ? 'Important'
                        : item.kind === 'unread'
                          ? 'Non lu'
                          : 'Info'}
                  </span>
                  <span className="hub-feed__score">
                    <Sparkles size={11} /> {item.score}
                  </span>
                </div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <ToolBadgeRow ids={item.toolIds} />
              </div>
              <div className="hub-feed__side">
                <time>{item.time}</time>
                <Link
                  to={`/mail?open=${encodeURIComponent(item.mailId)}`}
                  className="btn btn--ghost btn--sm"
                >
                  {item.actionLabel ?? 'Ouvrir'}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mailTools.length > 0 ? (
        <footer className="hub-intel__foot">
          <span>Boîtes liées</span>
          <div className="hub-intel__accounts">
            {mailTools.map((t) => (
              <span key={t.id} className="hub-account-chip">
                <ToolBadge id={t.id} size="sm" />
                {t.name}
              </span>
            ))}
            <Link to="/connexions" className="hub-account-chip hub-account-chip--add">
              + autre mail
            </Link>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
