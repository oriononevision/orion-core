import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCore } from '../context/CoreContext'
import { clients } from '../data/clients'
import { documents } from '../data/documents'
import { projects } from '../data/projects'
import { agents } from '../data/agents'
import { ToolBadgeRow } from './ToolBadge'

type Hit = {
  id: string
  kind: string
  title: string
  meta: string
  to: string
  tools?: string[]
}

export default function SearchPalette() {
  const { searchOpen, setSearchOpen, tools } = useCore()
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen, setSearchOpen])

  useEffect(() => {
    if (!searchOpen) setQ('')
  }, [searchOpen])

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase()
    const all: Hit[] = [
      ...clients.map((c) => ({
        id: c.id,
        kind: 'Client',
        title: c.name,
        meta: c.summary,
        to: '/clients',
        tools: c.sources,
      })),
      ...projects.map((p) => ({
        id: p.id,
        kind: 'Projet',
        title: p.name,
        meta: p.summary,
        to: '/projets',
        tools: p.sources,
      })),
      ...documents.map((d) => ({
        id: d.id,
        kind: 'Document',
        title: d.name,
        meta: d.summary,
        to: '/documents',
        tools: [d.toolId],
      })),
      ...agents.map((a) => ({
        id: a.id,
        kind: 'Agent',
        title: a.name,
        meta: a.role + ' — ' + a.description,
        to: '/agents',
        tools: a.tools,
      })),
      ...tools.map((t) => ({
        id: t.id,
        kind: 'Outil',
        title: t.name,
        meta: t.description,
        to: '/connexions',
        tools: [t.id],
      })),
    ]
    if (!query) return all.slice(0, 8)
    return all
      .filter(
        (h) =>
          h.title.toLowerCase().includes(query) ||
          h.meta.toLowerCase().includes(query) ||
          h.kind.toLowerCase().includes(query),
      )
      .slice(0, 12)
  }, [q, tools])

  function go(to: string) {
    setSearchOpen(false)
    navigate(to)
  }

  return (
    <AnimatePresence>
      {searchOpen ? (
        <motion.div
          className="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            className="search-palette"
            role="dialog"
            aria-label="Recherche globale"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-palette__bar">
              <Search size={18} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Clients, e-mails, docs, deals, agents…"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
            <ul className="search-palette__list">
              {hits.map((h) => (
                <li key={h.kind + h.id}>
                  <button type="button" onClick={() => go(h.to)}>
                    <span className="search-palette__kind">{h.kind}</span>
                    <span className="search-palette__title">{h.title}</span>
                    <span className="search-palette__meta">{h.meta}</span>
                    {h.tools ? <ToolBadgeRow ids={h.tools.slice(0, 4)} /> : null}
                  </button>
                </li>
              ))}
              {hits.length === 0 ? (
                <li className="search-palette__empty">Aucun résultat pour « {q} »</li>
              ) : null}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
