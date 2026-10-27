import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, RefreshCw } from 'lucide-react'
import TopBar from '../components/TopBar'
import ToolBadge from '../components/ToolBadge'
import { useCore } from '../context/CoreContext'
import { listUpcomingEvents, type CalendarEvent } from '../integrations/google/calendar'
import { getGoogleAccessToken } from '../integrations/google/tokenStore'

export default function CalendarPage() {
  const { tools, openConnectModal, googleConfigured } = useCore()
  const calendar = tools.find((t) => t.id === 'calendar')
  const connected = calendar?.status === 'connected'
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const token = getGoogleAccessToken()
    if (!token || !connected) {
      setEvents([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      setEvents(await listUpcomingEvents(token, 40))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur Calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [connected]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!connected) {
    return (
      <div className="page-view">
        <TopBar title="Agenda" subtitle="Événements de votre Google Calendar." />
        <div className="page-view__body">
          <div className="panel mail-empty">
            <ToolBadge id="calendar" size="lg" />
            <h2>Google Calendar non connecté</h2>
            <p>Connectez Google pour voir vos prochains rendez-vous dans Core.</p>
            {!googleConfigured ? (
              <p className="mail-setup">
                Setup Google manquant. <Link to="/setup-google">Configurer</Link>
              </p>
            ) : null}
            {googleConfigured ? (
              <button
                type="button"
                className="btn btn--white btn--sm"
                disabled={!calendar}
                onClick={() => calendar && openConnectModal(calendar)}
              >
                Connecter Google Calendar
              </button>
            ) : (
              <Link to="/setup-google" className="btn btn--white btn--sm">
                Faire le setup Google
              </Link>
            )}
            <Link to="/connexions" className="mail-empty__link">
              Connexions →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-view">
      <TopBar title="Agenda" subtitle={`${events.length} prochains événements`} />
      <div className="page-view__body">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void refresh()}>
          <RefreshCw size={14} /> Actualiser
        </button>
        {loading ? <p className="muted">Chargement Calendar API…</p> : null}
        {error ? <p className="mail-list__error">{error}</p> : null}
        <div className="event-list">
          {events.map((e) => (
            <article key={e.id} className="panel event-card">
              <header>
                <h3>{e.summary}</h3>
                {e.htmlLink ? (
                  <a href={e.htmlLink} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </header>
              <p>
                {new Date(e.start).toLocaleString('fr-FR')} →{' '}
                {new Date(e.end).toLocaleString('fr-FR')}
              </p>
              {e.location ? <p className="muted">{e.location}</p> : null}
              {e.attendees?.length ? (
                <p className="muted">{e.attendees.slice(0, 6).join(', ')}</p>
              ) : null}
            </article>
          ))}
          {!loading && events.length === 0 ? (
            <p className="muted">Aucun événement à venir.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
