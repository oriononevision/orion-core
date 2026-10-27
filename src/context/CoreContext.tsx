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
  applyRemoteConnections,
  loadToolsWithConnections,
  removeConnection,
  saveConnection,
  wait,
} from '../lib/connectionStore'
import {
  connectToolLive,
  disconnectToolLive,
  googleSession,
  toolCanConnectForReal,
} from '../integrations/connect'
import {
  googleToolIds,
  imapToolIds,
  isGoogleConfigured,
  setDynamicOauthIds,
  setEdgeConfiguredMap,
} from '../integrations/config'
import { listRemoteConnections } from '../integrations/bridge'
import { listCustomTools, setCustomConnectors } from '../integrations/customConnectors'
import {
  applyLocalSessionConnections,
  mergeLocalSessionsIntoCustoms,
} from '../integrations/sessionStore'
import { supabase } from '../lib/supabase'

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
  refreshConnections: () => Promise<void>
  customConnectorIds: string[]
  connectTool: (
    id: string,
    options?: {
      emailHint?: string
      imapHost?: string
      imapPort?: number
      password?: string
      displayName?: string
      productUrl?: string
    },
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

  const [customConnectorIds, setCustomConnectorIds] = useState<string[]>([])

  const refreshConnections = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession()
      if (!auth.session) {
        setTools(loadToolsWithConnections())
        setCustomConnectorIds([])
        return
      }
      const remote = await listRemoteConnections()
      setEdgeConfiguredMap(remote.configured)
      const customs = mergeLocalSessionsIntoCustoms(remote.customConnectors ?? [])
      setDynamicOauthIds([
        ...(remote.authModes?.oauth ?? []).filter((id) => id.startsWith('custom_')),
        ...customs
          .filter((c) => c.authMode !== 'session' && c.scopes !== '__orion_session__')
          .map((c) => c.slug),
      ])
      setCustomConnectorIds(customs.map((c) => c.slug))

      const base = applyRemoteConnections(remote.connections)
      const byId = new Map(base.map((t) => [t.id, t]))
      for (const custom of listCustomTools()) {
        const existing = byId.get(custom.id)
        byId.set(
          custom.id,
          existing
            ? {
                ...custom,
                ...existing,
                name: custom.name,
                logo: custom.logo,
                domain: custom.domain,
                description: custom.description,
                permissions: custom.permissions,
                features: custom.features,
                status:
                  custom.permissions.includes('Session Desktop')
                    ? 'connected'
                    : existing.status,
              }
            : custom,
        )
      }
      setTools(applyLocalSessionConnections(Array.from(byId.values())))
    } catch {
      const merged = mergeLocalSessionsIntoCustoms([])
      setCustomConnectorIds(merged.map((c) => c.slug))
      setTools(applyLocalSessionConnections(loadToolsWithConnections()))
    }
  }, [])

  useEffect(() => {
    void refreshConnections()
  }, [refreshConnections])

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

  const connectTool = useCallback(
    async (
      id: string,
      options?: {
        emailHint?: string
        imapHost?: string
        imapPort?: number
        password?: string
        displayName?: string
        productUrl?: string
      },
    ) => {
      const runId = ++abortRef.current
      setConnectError(null)
      setConnectPhase('authorizing')
      setSyncProgress(5)
      setTools((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: 'syncing', lastSync: 'Confirmation…' } : t,
        ),
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
          password: options?.password,
          displayName: options?.displayName,
          productUrl: options?.productUrl,
        })
        if (abortRef.current !== runId) return

        if (result.pendingRedirect) {
          setConnectPhase('authorizing')
          setSyncProgress(20)
          return
        }

        // Sans OAuth serveur : logiciel ajouté en « activation »
        if (result.pendingActivation) {
          saveConnection({
            id,
            status: 'syncing',
            accounts: 1,
            lastSync: 'Activation…',
            itemsSynced: 0,
            connectedAt: new Date().toISOString(),
            accountLabel: options?.displayName,
          })
          setTools((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: 'syncing',
                    lastSync: 'Activation…',
                    accounts: 1,
                  }
                : t,
            ),
          )
          setConnectPhase('done')
          setSyncProgress(100)
          await wait(600)
          if (abortRef.current !== runId) return
          setConnectModalTool(null)
          setConnectPhase('idle')
          setSyncProgress(0)
          void refreshConnections()
          return
        }

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
                  lastSync: imapToolIds.has(id) ? 'Compte lié…' : 'Sync API…',
                  itemsSynced: result.itemsSynced,
                  accounts: 1,
                }
              : t,
          ),
        )
        await wait(400)
        if (abortRef.current !== runId) return

        const idsToActivate = googleToolIds.has(id) ? ['gmail', 'drive', 'calendar'] : [id]

        setTools((prev) =>
          prev.map((t) => {
            if (!idsToActivate.includes(t.id)) return t
            const items =
              t.id === id
                ? result.itemsSynced
                : t.id === 'drive' || t.id === 'calendar'
                  ? (t.itemsSynced ?? 0)
                  : result.itemsSynced
            saveConnection({
              id: t.id,
              status: 'connected',
              accounts: 1,
              lastSync: 'À l’instant',
              itemsSynced: items,
              connectedAt: new Date().toISOString(),
              accessToken: result.accessToken,
              accountLabel: result.accountLabel,
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
                  return {
                    ...t,
                    status: 'connected',
                    itemsSynced: driveFiles.length,
                    lastSync: 'À l’instant',
                    accounts: 1,
                  }
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
                  return {
                    ...t,
                    status: 'connected',
                    itemsSynced: events.length,
                    lastSync: 'À l’instant',
                    accounts: 1,
                  }
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
                  return {
                    ...t,
                    status: 'connected',
                    itemsSynced: total,
                    lastSync: 'À l’instant',
                    accounts: 1,
                  }
                }
                return t
              }),
            )
          } catch {
            /* partial ok */
          }
        }

        if (!googleToolIds.has(id)) {
          await refreshConnections()
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
            t.id === id ? { ...t, status: 'error', lastSync: 'Échec connexion' } : t,
          ),
        )
      }
    },
    [refreshConnections],
  )

  const disconnectTool = useCallback(
    async (id: string) => {
      abortRef.current += 1
      await disconnectToolLive(id)

      if (googleToolIds.has(id)) {
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
      await refreshConnections()
    },
    [refreshConnections],
  )

  const value = useMemo(
    () => ({
      tools,
      connectPhase,
      syncProgress,
      connectError,
      googleConfigured,
      googleEmail: session?.email ?? null,
      refreshConnections,
      customConnectorIds,
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
      refreshConnections,
      customConnectorIds,
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
