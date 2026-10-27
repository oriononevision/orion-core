import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { getCatalogItem, hubWindowCatalog } from './catalog'
import { useHubLayout } from './HubLayoutContext'
import type { HubWindowType } from './types'

export default function HubAddMenu() {
  const { layout, editing, addWindow } = useHubLayout()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editing) setOpen(false)
  }, [editing])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!editing) return null

  const counts = layout.windows.reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1
    return acc
  }, {})

  const canAdd = (type: HubWindowType) => {
    const item = getCatalogItem(type)
    if (item.maxInstances == null) return true
    return (counts[type] ?? 0) < item.maxInstances
  }

  return (
    <div className="hub-add" ref={rootRef}>
      <button
        type="button"
        className={`hub-add__btn ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus size={18} strokeWidth={2.25} />
        <span>Ajouter</span>
      </button>

      {open ? (
        <div className="hub-add__menu" role="menu" aria-label="Éléments à ajouter">
          <p className="hub-add__menu-title">Ajouter au Hub</p>
          <ul className="hub-add__menu-list">
            {hubWindowCatalog.map((item) => {
              const disabled = !canAdd(item.type)
              return (
                <li key={item.type}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={disabled}
                    onClick={() => {
                      addWindow(item.type)
                      setOpen(false)
                    }}
                  >
                    <strong>
                      {item.label}
                      {item.comingSoon ? (
                        <em className="hub-add__soon">bientôt</em>
                      ) : null}
                    </strong>
                    <span>{item.description}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
