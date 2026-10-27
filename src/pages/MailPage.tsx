import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Archive,
  Paperclip,
  RefreshCw,
  Reply,
  Search,
  Star,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import ToolBadge from '../components/ToolBadge'
import { useCore } from '../context/CoreContext'
import { useMail } from '../context/MailContext'
import type { MailFolder } from '../context/MailContext'

const folders: { id: MailFolder; label: string }[] = [
  { id: 'inbox', label: 'Boîte de réception' },
  { id: 'starred', label: 'Suivis' },
  { id: 'sent', label: 'Envoyés' },
]

export default function MailPage() {
  const { tools, openConnectModal, googleConfigured, googleEmail } = useCore()
  const gmail = tools.find((t) => t.id === 'gmail')
  const connected = gmail?.status === 'connected'

  const {
    mails,
    filtered,
    selected,
    selectedId,
    setSelectedId,
    folder,
    setFolder,
    query,
    setQuery,
    markRead,
    toggleStar,
    archive,
    sendReply,
    unreadCount,
    loading,
    error,
    refresh,
    accountEmail,
  } = useMail()

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [sentFlash, setSentFlash] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId || !connected) return
    if (!mails.some((m) => m.id === openId)) return
    setSelectedId(openId)
    const next = new URLSearchParams(searchParams)
    next.delete('open')
    setSearchParams(next, { replace: true })
  }, [searchParams, connected, mails, setSelectedId, setSearchParams])

  useEffect(() => {
    if (selected?.unread) void markRead(selected.id)
    setReply('')
    setSentFlash(false)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!connected) {
    return (
      <div className="page-view">
        <TopBar
          title="Gmail"
          subtitle="Connexion à votre vrai compte Google — lecture et envoi via l’API Gmail."
        />
        <div className="page-view__body">
          <div className="panel mail-empty">
            <ToolBadge id="gmail" size="lg" />
            <h2>Connecter Gmail en 2 étapes</h2>
            <p>
              Indiquez votre adresse Gmail, confirmez, puis validez une fois sur
              Google. Vos vrais e-mails apparaissent ensuite dans Core.
            </p>
            {!googleConfigured ? (
              <p className="mail-setup">
                Setup Google manquant.{' '}
                <Link to="/setup-google">Configurer le Client ID</Link>
              </p>
            ) : null}
            {googleConfigured ? (
              <button
                type="button"
                className="btn btn--white btn--sm"
                disabled={!gmail}
                onClick={() => gmail && openConnectModal(gmail)}
              >
                Entrer mon adresse Gmail
              </button>
            ) : (
              <Link to="/setup-google" className="btn btn--white btn--sm">
                Faire le setup Google
              </Link>
            )}
            <Link to="/connexions" className="mail-empty__link">
              Ou via Connexions →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function onSend() {
    if (!selected || !reply.trim() || sending) return
    setSending(true)
    try {
      await sendReply(selected.id, reply.trim())
      setSentFlash(true)
      setReply('')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Envoi impossible')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-view">
      <TopBar
        title="Gmail"
        subtitle={`Compte ${accountEmail || googleEmail || 'Google'} · ${gmail?.itemsSynced?.toLocaleString('fr-FR') ?? '—'} messages`}
      />

      <div className="page-view__body mail-layout">
        <aside className="mail-folders panel">
          <div className="mail-folders__brand">
            <ToolBadge id="gmail" />
            <div>
              <strong>Gmail</strong>
              <span>{accountEmail || googleEmail}</span>
            </div>
          </div>
          <nav>
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                className={folder === f.id ? 'is-active' : ''}
                onClick={() => {
                  setFolder(f.id)
                  setSelectedId(null)
                }}
              >
                {f.label}
                {f.id === 'inbox' && unreadCount > 0 ? <em>{unreadCount}</em> : null}
              </button>
            ))}
          </nav>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void refresh()}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <a
            className="mail-open-native"
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
          >
            Ouvrir Gmail.com →
          </a>
        </aside>

        <section className="mail-list panel">
          <div className="mail-list__search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer les messages chargés…"
            />
          </div>
          {loading ? <p className="mail-list__empty">Chargement Gmail API…</p> : null}
          {error ? (
            <div className="mail-list__error" role="alert">
              <p>{error}</p>
              {error.toLowerCase().includes('quota') ? (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => void refresh()}>
                  <RefreshCw size={14} /> Réessayer
                </button>
              ) : null}
            </div>
          ) : null}
          <ul>
            {filtered.map((m) => (
              <li key={m.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`mail-row${selectedId === m.id ? ' is-active' : ''}${m.unread ? ' is-unread' : ''}`}
                  onClick={() => setSelectedId(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedId(m.id)
                  }}
                >
                  <button
                    type="button"
                    className={`mail-star${m.starred ? ' is-on' : ''}`}
                    aria-label="Suivre"
                    onClick={(e) => {
                      e.stopPropagation()
                      void toggleStar(m.id)
                    }}
                  >
                    <Star size={14} fill={m.starred ? 'currentColor' : 'none'} />
                  </button>
                  <div className="mail-row__main">
                    <div className="mail-row__top">
                      <strong>{m.from.name}</strong>
                      <time>{m.time}</time>
                    </div>
                    <p className="mail-row__subject">{m.subject}</p>
                    <p className="mail-row__preview">{m.preview}</p>
                  </div>
                  {m.hasAttachment ? <Paperclip size={14} className="mail-row__clip" /> : null}
                </div>
              </li>
            ))}
            {!loading && filtered.length === 0 ? (
              <li className="mail-list__empty">Aucun message.</li>
            ) : null}
          </ul>
        </section>

        <section className="mail-detail panel">
          {selected ? (
            <>
              <header className="mail-detail__head">
                <div>
                  <h2>{selected.subject}</h2>
                  <p>
                    <strong>{selected.from.name}</strong>
                    <span>&lt;{selected.from.email}&gt;</span>
                  </p>
                </div>
                <div className="mail-detail__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => void toggleStar(selected.id)}
                  >
                    <Star size={14} fill={selected.starred ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => void archive(selected.id)}
                  >
                    <Archive size={14} /> Archiver
                  </button>
                </div>
              </header>

              <article className="mail-detail__body">
                {selected.bodyHtml ? (
                  <div
                    className="mail-html"
                    dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
                  />
                ) : (
                  selected.body.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)
                )}
              </article>

              {folder !== 'sent' ? (
                <div className="mail-compose">
                  <div className="mail-compose__head">
                    <Reply size={15} />
                    <strong>Répondre via Gmail API</strong>
                  </div>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={8}
                    placeholder="Votre réponse sera envoyée depuis votre compte Gmail…"
                  />
                  <div className="mail-compose__actions">
                    <button
                      type="button"
                      className="btn btn--white btn--sm"
                      disabled={!reply.trim() || sending}
                      onClick={() => void onSend()}
                    >
                      {sending ? 'Envoi…' : 'Envoyer'}
                    </button>
                  </div>
                  {sentFlash ? (
                    <p className="mail-compose__ok">Envoyé sur votre compte Gmail.</p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mail-detail__empty">
              <ToolBadge id="gmail" size="lg" />
              <p>Sélectionnez un e-mail de votre boîte Gmail.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
