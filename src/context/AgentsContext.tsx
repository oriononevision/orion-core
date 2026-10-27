import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { agents as catalog, type Agent, type AgentRun } from '../data/agents'
import {
  runAgent,
  type AgentDraft,
  type AgentRuntimeContext,
} from '../lib/agentRunner'
import { useCore } from './CoreContext'
import { useMail } from './MailContext'

type AgentsContextValue = {
  agents: Agent[]
  runs: AgentRun[]
  drafts: AgentDraft[]
  runningId: string | null
  lastSummary: string | null
  runOne: (agentId: string) => Promise<void>
  runAllReady: () => Promise<void>
  pause: (agentId: string) => void
  setDraftStatus: (draftId: string, status: AgentDraft['status']) => void
  clearDrafts: () => void
}

const AgentsContext = createContext<AgentsContextValue | null>(null)

export function AgentsProvider({ children }: { children: ReactNode }) {
  const { tools } = useCore()
  const { mails } = useMail()
  const [agents, setAgents] = useState<Agent[]>(() =>
    catalog.map((a) => ({ ...a, status: 'idle' as const, lastAction: 'Prêt à lancer' })),
  )
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [drafts, setDrafts] = useState<AgentDraft[]>([])
  const [runningId, setRunningId] = useState<string | null>(null)
  const [lastSummary, setLastSummary] = useState<string | null>(null)

  const runtimeCtx = useCallback((): AgentRuntimeContext => {
    const connectedToolIds = tools
      .filter((t) => t.status === 'connected' || t.status === 'syncing')
      .map((t) => t.id)
    return { connectedToolIds, mails }
  }, [tools, mails])

  const runOne = useCallback(
    async (agentId: string) => {
      setRunningId(agentId)
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, status: 'running', lastAction: 'Exécution en cours…' }
            : a,
        ),
      )
      try {
        const current = agents.find((a) => a.id === agentId)
        const result = await runAgent(agentId, runtimeCtx(), current)
        setAgents((prev) => prev.map((a) => (a.id === agentId ? result.agent : a)))
        setRuns((prev) => [...result.runs, ...prev].slice(0, 40))
        if (result.drafts.length) {
          setDrafts((prev) => [...result.drafts, ...prev].slice(0, 30))
        }
        setLastSummary(result.summary)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Échec agent'
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? { ...a, status: 'waiting', lastAction: message }
              : a,
          ),
        )
        setRuns((prev) => [
          {
            id: `err-${Date.now()}`,
            agentId,
            title: 'Échec d’exécution',
            detail: message,
            tools: [],
            time: 'À l’instant',
            status: 'needs_input',
          },
          ...prev,
        ])
        setLastSummary(message)
      } finally {
        setRunningId(null)
      }
    },
    [agents, runtimeCtx],
  )

  const runAllReady = useCallback(async () => {
    const order = ['nexus', 'mailer', 'meeting', 'archiviste', 'crm-pulse', 'sentinel']
    for (const id of order) {
      await runOne(id)
    }
  }, [runOne])

  const pause = useCallback((agentId: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status: 'idle', lastAction: 'Mis en pause manuellement' }
          : a,
      ),
    )
    if (runningId === agentId) setRunningId(null)
  }, [runningId])

  const setDraftStatus = useCallback((draftId: string, status: AgentDraft['status']) => {
    setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, status } : d)))
  }, [])

  const clearDrafts = useCallback(() => {
    setDrafts((prev) => prev.filter((d) => d.status === 'pending'))
  }, [])

  const value = useMemo(
    () => ({
      agents,
      runs,
      drafts,
      runningId,
      lastSummary,
      runOne,
      runAllReady,
      pause,
      setDraftStatus,
      clearDrafts,
    }),
    [
      agents,
      runs,
      drafts,
      runningId,
      lastSummary,
      runOne,
      runAllReady,
      pause,
      setDraftStatus,
      clearDrafts,
    ],
  )

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
}

export function useAgents() {
  const ctx = useContext(AgentsContext)
  if (!ctx) throw new Error('useAgents must be used within AgentsProvider')
  return ctx
}
