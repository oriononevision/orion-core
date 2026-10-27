import { BarChart3, LayoutGrid, StickyNote } from 'lucide-react'
import type { HubWindowType } from '../types'
import { getCatalogItem } from '../catalog'

const icons: Partial<Record<HubWindowType, typeof StickyNote>> = {
  notes: StickyNote,
  chart_placeholder: BarChart3,
  widget_placeholder: LayoutGrid,
}

export default function ComingSoonWindow({ type }: { type: HubWindowType }) {
  const item = getCatalogItem(type)
  const Icon = icons[type] ?? LayoutGrid

  return (
    <div className="hub-coming-soon">
      <Icon size={22} strokeWidth={1.6} />
      <strong>{item.label}</strong>
      <p>{item.description}</p>
      <span className="hub-coming-soon__badge">Bientôt disponible</span>
    </div>
  )
}
