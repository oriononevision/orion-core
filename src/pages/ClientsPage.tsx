import { useState } from 'react'
import TopBar from '../components/TopBar'
import { ToolBadgeRow } from '../components/ToolBadge'
import { clients, type Client } from '../data/clients'

export default function ClientsPage() {
  const [selected, setSelected] = useState<Client>(clients[0])
  const [q, setQ] = useState('')

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.domain.toLowerCase().includes(q.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div className="page-view">
      <TopBar
        title="Clients"
        subtitle="Fiches unifiées : CRM, e-mails, tickets et documents au même endroit."
      />

      <div className="page-view__body split-layout">
        <section className="panel split-list">
          <input
            className="field"
            placeholder="Filtrer clients…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="entity-list">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={selected.id === c.id ? 'is-active' : ''}
                  onClick={() => setSelected(c)}
                >
                  <div>
                    <strong>{c.name}</strong>
                    <span>{c.domain}</span>
                  </div>
                  <span className={`status-pill status-pill--${c.status}`}>{c.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel entity-detail">
          <header className="entity-detail__head">
            <div>
              <p className="eyebrow">{selected.industry}</p>
              <h2>{selected.name}</h2>
              <p>{selected.domain}</p>
            </div>
            <span className={`status-pill status-pill--${selected.status}`}>
              {selected.status}
            </span>
          </header>

          <p className="entity-detail__summary">{selected.summary}</p>

          <div className="meta-grid">
            <div>
              <span>Owner</span>
              <strong>{selected.owner}</strong>
            </div>
            <div>
              <span>Dernier contact</span>
              <strong>{selected.lastTouch}</strong>
            </div>
            <div>
              <span>MRR</span>
              <strong>{selected.mrr ?? '—'}</strong>
            </div>
            <div>
              <span>Deals / tickets</span>
              <strong>
                {selected.openDeals} / {selected.openTickets}
              </strong>
            </div>
          </div>

          <h3>Sources synchronisées</h3>
          <ToolBadgeRow ids={selected.sources} />

          <h3>Tags</h3>
          <div className="chip-row">
            {selected.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>

          <h3>Contacts</h3>
          <ul className="contact-list">
            {selected.contacts.map((ct) => (
              <li key={ct.email}>
                <strong>{ct.name}</strong>
                <span>{ct.role}</span>
                <a href={`mailto:${ct.email}`}>{ct.email}</a>
              </li>
            ))}
          </ul>

          <div className="entity-detail__actions">
            <button type="button" className="btn btn--white btn--sm">
              Demander un brief agent
            </button>
            <button type="button" className="btn btn--ghost btn--sm">
              Ouvrir dans HubSpot
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
