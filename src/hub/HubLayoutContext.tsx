import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getCatalogItem } from './catalog'
import { createId, defaultHubLayout, loadHubLayout, saveHubLayout } from './layoutStore'
import type {
  HubColSpan,
  HubHeight,
  HubLayout,
  HubWindowConfig,
  HubWindowType,
} from './types'

type HubLayoutContextValue = {
  layout: HubLayout
  editing: boolean
  setEditing: (v: boolean) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  addWindow: (type: HubWindowType) => void
  removeWindow: (id: string) => void
  updateWindow: (id: string, patch: Partial<HubWindowConfig>) => void
  moveWindow: (id: string, direction: 'up' | 'down') => void
  setWindowSize: (id: string, size: { w?: HubColSpan; h?: HubHeight }) => void
  toggleConnector: (windowId: string, toolId: string) => void
  resetLayout: () => void
}

const HubLayoutContext = createContext<HubLayoutContextValue | null>(null)

function persist(next: HubLayout) {
  saveHubLayout(next)
  return next
}

export function HubLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<HubLayout>(() => loadHubLayout())
  const [editing, setEditing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const addWindow = useCallback((type: HubWindowType) => {
    const item = getCatalogItem(type)
    setLayout((prev) => {
      const count = prev.windows.filter((w) => w.type === type).length
      if (item.maxInstances != null && count >= item.maxInstances) return prev
      const win: HubWindowConfig = {
        id: createId('win'),
        type,
        w: item.defaultW,
        h: item.defaultH,
        connectorIds: [...(item.suggestedConnectors ?? [])],
      }
      const next = persist({ ...prev, windows: [...prev.windows, win] })
      setSelectedId(win.id)
      return next
    })
  }, [])

  const removeWindow = useCallback((id: string) => {
    setLayout((prev) =>
      persist({ ...prev, windows: prev.windows.filter((w) => w.id !== id) }),
    )
    setSelectedId((cur) => (cur === id ? null : cur))
  }, [])

  const updateWindow = useCallback((id: string, patch: Partial<HubWindowConfig>) => {
    setLayout((prev) =>
      persist({
        ...prev,
        windows: prev.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      }),
    )
  }, [])

  const moveWindow = useCallback((id: string, direction: 'up' | 'down') => {
    setLayout((prev) => {
      const idx = prev.windows.findIndex((w) => w.id === id)
      if (idx < 0) return prev
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.windows.length) return prev
      const windows = [...prev.windows]
      const [item] = windows.splice(idx, 1)
      windows.splice(target, 0, item)
      return persist({ ...prev, windows })
    })
  }, [])

  const setWindowSize = useCallback(
    (id: string, size: { w?: HubColSpan; h?: HubHeight }) => {
      updateWindow(id, size)
    },
    [updateWindow],
  )

  const toggleConnector = useCallback((windowId: string, toolId: string) => {
    setLayout((prev) =>
      persist({
        ...prev,
        windows: prev.windows.map((w) => {
          if (w.id !== windowId) return w
          const has = w.connectorIds.includes(toolId)
          return {
            ...w,
            connectorIds: has
              ? w.connectorIds.filter((c) => c !== toolId)
              : [...w.connectorIds, toolId],
          }
        }),
      }),
    )
  }, [])

  const resetLayout = useCallback(() => {
    const next = defaultHubLayout()
    saveHubLayout(next)
    setLayout(next)
    setSelectedId(null)
  }, [])

  const value = useMemo(
    () => ({
      layout,
      editing,
      setEditing,
      selectedId,
      setSelectedId,
      addWindow,
      removeWindow,
      updateWindow,
      moveWindow,
      setWindowSize,
      toggleConnector,
      resetLayout,
    }),
    [
      layout,
      editing,
      selectedId,
      addWindow,
      removeWindow,
      updateWindow,
      moveWindow,
      setWindowSize,
      toggleConnector,
      resetLayout,
    ],
  )

  return <HubLayoutContext.Provider value={value}>{children}</HubLayoutContext.Provider>
}

export function useHubLayout() {
  const ctx = useContext(HubLayoutContext)
  if (!ctx) throw new Error('useHubLayout must be used within HubLayoutProvider')
  return ctx
}
