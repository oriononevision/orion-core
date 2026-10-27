import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ConnectedTool } from '../data/tools'
import {
  loadToolsWithConnections,
  removeConnection,
  saveConnection,
  wait,
} from '../lib/connectionStore'
import {
  connectToolLive,
  disconnectGoogleTools,
  googleSession,
  toolCanConnectForReal,
} from '../integrations/connect'
import { altMailToolIds, googleToolIds, isGoogleConfigured } from '../integrations/config'
import { removeMailAccountsByProvider, type MailProviderId } from '../integrations/mail/accounts'

export type ConnectPhase =
  | 'idle'
  | 'authorizing'
  | 'granted'
  | 'syncing'
  | 'done'
  | 'error'

type CoreContextValue = {
  tools: ConnectedTool[]
  connectPhase: ConnectPhase
  syncProgress: number
  connectError: string | null
  googleConfigured: boolean
  googleEmail: string | null
  connectTool: (
    id: string,
    options?: { emailHint?: string; imapHost?: string; imapPort?: number },
  ) => Promise<void>
  disconnectTool: (id: string) => Promise<void>
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  connectModalTool: ConnectedTool | null
  openConnectModal: (tool: ConnectedTool | null) => void
  canConnectLive: (id: string) => boolean
}

const CoreContext = createContext<CoreContextValue | null>(null)

export function CoreProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<ConnectedTool[]>(() =>
    typeof window === 'undefined' ? [] : loadToolsWithConnections(),
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [connectModalTool, setConnectModalTool] = useState<ConnectedTool | null>(null)
  const [connectPhase, setConnectPhase] = useState<ConnectPhase>('idle')
  const [syncProgress, setSyncProgress] = useState(0)
  const [connectError, setConnectError] = useState<string | null>(null)
  const abortRef = useRef(0)
  const session = googleSession()
  const [googleConfigured, setGoogleConfigured] = useState(() =>
    typeof window === 'undefined' ? false : isGoogleConfigured(),
  )

  useEffect(() => {
    setTools(loadToolsWithConnections())
  }, [])

  useEffect(() => {
    const refresh = () => setGoogleConfigured(isGoogleConfigured())
    refresh()
    window.addEventListener('orion-google-config', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('orion-google-config', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const openConnectModal = useCallback((tool: ConnectedTool | null) => {
    setConnectModalTool(tool)
    setConnectPhase('idle')
    setSyncProgress(0)
    setConnectError(null)
    abortRef.current += 1
  }, [])

  const connectTool = useCallback(async (
    id: string,
    options?: { emailHint?: string; imapHost?: string; imapPort?: number },
  ) => {
    const runId = ++abortRef.current
    setConnectError(null)
    setConnectPhase('authorizing')
    setSyncProgress(5)
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'syncing', lastSync: 'Confirmation…' } : t)),
    )

    try {
      if (googleToolIds.has(id) && !isGoogleConfigured()) {
        throw new Error(
          'Setup Google manquant. Allez dans Setup Google et collez le Client ID.',
        )
      }

      const result = await connectToolLive(id, {
        emailHint: options?.emailHint,
        imapHost: options?.imapHost,
        imapPort: options?.imapPort,
      })
      if (abortRef.current !== runId) return

      setConnectPhase('granted')
      setSyncProgress(40)
      await wait(300)
      if (abortRef.current !== runId) return

      setConnectPhase('syncing')
      setSyncProgress(70)
      setTools((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'syncing',
                lastSync: altMailToolIds.has(id) ? 'Compte lié…' : 'Sync API…',
                itemsSynced: result.itemsSynced,
                accounts: 1,
              }
            : t,
        ),
      )
      await wait(400)
      if (abortRef.current !== runId) return

      // Google : une auth active gmail + drive + calendar
      const idsToActivate = googleToolIds.has(id) ? ['gmail', 'drive', 'calendar'] : [id]

      setTools((prev) =>
        prev.map((t) => {
          if (!idsToActivate.includes(t.id)) return t
          const items =
            t.id === id
              ? result.itemsSynced
              : t.id === 'drive' || t.id === 'calendar'
                ? t.itemsSynced ?? 0
                : result.itemsSynced
          saveConnection({
            id: t.id,
            status: 'connected',
            accounts: 1,
            lastSync: 'À l’instant',
            itemsSynced: items,
            connectedAt: new Date().toISOString(),
            accessToken: result.accessToken,
          })
          return {
            ...t,
            status: 'connected',
            lastSync: 'À l’instant',
            itemsSynced: items,
            accounts: 1,
          }
        }),
      )

      // Refresh counts for sibling google tools
      if (googleToolIds.has(id) && result.accessToken) {
        try {
          const { listDriveFiles } = await import('../integrations/google/drive')
          const { listUpcomingEvents } = await import('../integrations/google/calendar')
          const { getProfileEmailCount } = await import('../integrations/google/gmail')
          const [driveFiles, events, mailProfile] = await Promise.all([
            listDriveFiles(result.accessToken, 50),
            listUpcomingEvents(result.accessToken, 40),
            getProfileEmailCount(result.accessToken),
          ])
          setTools((prev) =>
            prev.map((t) => {
              if (t.id === 'drive') {
                saveConnection({
                  id: 'drive',
                  status: 'connected',
                  accounts: 1,
                  lastSync: 'À l’instant',
                  itemsSynced: driveFiles.length,
                  connectedAt: new Date().toISOString(),
                  accessToken: result.accessToken,
                })
                return { ...t, status: 'connected', itemsSynced: driveFiles.length, lastSync: 'À l’instant', accounts: 1 }
              }
              if (t.id === 'calendar') {
                saveConnection({
                  id: 'calendar',
                  status: 'connected',
                  accounts: 1,
                  lastSync: 'À l’instant',
                  itemsSynced: events.length,
                  connectedAt: new Date().toISOString(),
                  accessToken: result.accessToken,
                })
                return { ...t, status: 'connected', itemsSynced: events.length, lastSync: 'À l’instant', accounts: 1 }
              }
              if (t.id === 'gmail') {
                const total = mailProfile.messagesTotal ?? result.itemsSynced
                saveConnection({
                  id: 'gmail',
                  status: 'connected',
                  accounts: 1,
                  lastSync: 'À l’instant',
                  itemsSynced: total,
                  connectedAt: new Date().toISOString(),
                  accessToken: result.accessToken,
                })
                return { ...t, status: 'connected', itemsSynced: total, lastSync: 'À l’instant', accounts: 1 }
              }
              return t
            }),
          )
        } catch {
          /* partial ok */
        }
      }

      setConnectPhase('done')
      setSyncProgress(100)
      await wait(700)
      if (abortRef.current !== runId) return
      setConnectModalTool(null)
      setConnectPhase('idle')
      setSyncProgress(0)
    } catch (e) {
      if (abortRef.current !== runId) return
      const message = e instanceof Error ? e.message : 'Connexion impossible'
      setConnectError(message)
      setConnectPhase('error')
      setTools((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: 'error', lastSync: 'Échec OAuth' }
            : t,
        ),
      )
    }
  }, [])

  const disconnectTool = useCallback(async (id: string) => {
    abortRef.current += 1
    if (googleToolIds.has(id)) {
      await disconnectGoogleTools()
      ;['gmail', 'drive', 'calendar'].forEach((gid) => removeConnection(gid))
      setTools((prev) =>
        prev.map((t) =>
          googleToolIds.has(t.id)
            ? {
                ...t,
                status: 'available',
                lastSync: undefined,
                accounts: undefined,
                itemsSynced: undefined,
              }
            : t,
        ),
      )
      return
    }
    if (altMailToolIds.has(id)) {
      removeMailAccountsByProvider(id as MailProviderId)
    }
    removeConnection(id)
    setTools((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'available',
              lastSync: undefined,
              accounts: undefined,
              itemsSynced: undefined,
            }
          : t,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({
      tools,
      connectPhase,
      syncProgress,
      connectError,
      googleConfigured,
      googleEmail: session?.email ?? null,
      connectTool,
      disconnectTool,
      searchOpen,
      setSearchOpen,
      connectModalTool,
      openConnectModal,
      canConnectLive: toolCanConnectForReal,
    }),
    [
      tools,
      connectPhase,
      syncProgress,
      connectError,
      googleConfigured,
      session?.email,
      connectTool,
      disconnectTool,
      searchOpen,
      connectModalTool,
      openConnectModal,
    ],
  )

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>
}

export function useCore() {
  const ctx = useContext(CoreContext)
  if (!ctx) throw new Error('useCore must be used within CoreProvider')
  return ctx
}
