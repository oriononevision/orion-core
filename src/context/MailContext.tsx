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
import type { OrionMail } from '../integrations/google/gmail'
import {
  archiveGmail,
  fetchInbox,
  fetchSent,
  fetchStarred,
  getGmailMessage,
  markGmailRead,
  sendGmailReply,
  toggleGmailStar,
} from '../integrations/google/gmail'
import { getGoogleAccessToken, readGoogleToken } from '../integrations/google/tokenStore'
import { useCore } from './CoreContext'

export type MailFolder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archived'

type MailContextValue = {
  mails: OrionMail[]
  loading: boolean
  error: string | null
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  folder: MailFolder
  setFolder: (f: MailFolder) => void
  query: string
  setQuery: (q: string) => void
  filtered: OrionMail[]
  selected: OrionMail | null
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  toggleStar: (id: string) => Promise<void>
  archive: (id: string) => Promise<void>
  sendReply: (id: string, body: string) => Promise<void>
  unreadCount: number
  accountEmail: string | null
}

const MailContext = createContext<MailContextValue | null>(null)

const CACHE_TTL_MS = 45_000

export function MailProvider({ children }: { children: ReactNode }) {
  const { tools } = useCore()
  const gmailConnected = tools.some((t) => t.id === 'gmail' && t.status === 'connected')
  const [mails, setMails] = useState<OrionMail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [folder, setFolder] = useState<MailFolder>('inbox')
  const [query, setQuery] = useState('')
  const accountEmail = readGoogleToken()?.email ?? null
  const cacheRef = useRef<Partial<Record<MailFolder, { at: number; mails: OrionMail[] }>>>({})
  const bodyCacheRef = useRef<Map<string, OrionMail>>(new Map())
  const lastFetchRef = useRef(0)

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    const token = getGoogleAccessToken()
    if (!token || !gmailConnected) {
      setMails([])
      return
    }

    const cached = cacheRef.current[folder]
    const now = Date.now()
    if (!opts?.force && cached && now - cached.at < CACHE_TTL_MS) {
      setMails(cached.mails)
      setError(null)
      return
    }

    // Évite les doubles appels (Strict Mode / re-renders) dans la même seconde.
    if (!opts?.force && now - lastFetchRef.current < 1200) return
    lastFetchRef.current = now

    setLoading(true)
    setError(null)
    try {
      let list: OrionMail[] = []
      if (folder === 'starred') list = await fetchStarred(token)
      else if (folder === 'sent') list = await fetchSent(token)
      else list = await fetchInbox(token)
      cacheRef.current[folder] = { at: Date.now(), mails: list }
      setMails(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur Gmail')
      setMails([])
    } finally {
      setLoading(false)
    }
  }, [folder, gmailConnected])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const ensureBody = useCallback(async (id: string) => {
    const token = getGoogleAccessToken()
    if (!token) return
    const cached = bodyCacheRef.current.get(id)
    if (cached?.bodyLoaded) {
      setMails((prev) => prev.map((m) => (m.id === id ? { ...m, ...cached } : m)))
      return
    }
    let alreadyLoaded = false
    setMails((prev) => {
      const current = prev.find((m) => m.id === id)
      alreadyLoaded = Boolean(current?.bodyLoaded)
      return prev
    })
    if (alreadyLoaded) return
    try {
      const full = await getGmailMessage(token, id)
      bodyCacheRef.current.set(id, full)
      setMails((prev) => prev.map((m) => (m.id === id ? full : m)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement message')
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    const token = getGoogleAccessToken()
    if (!token) return
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)))
    try {
      await markGmailRead(token, id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lecture')
    }
  }, [])

  const toggleStar = useCallback(async (id: string) => {
    const token = getGoogleAccessToken()
    if (!token) return
    const current = mails.find((m) => m.id === id)
    if (!current) return
    const next = !current.starred
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: next } : m)))
    try {
      await toggleGmailStar(token, id, next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur favori')
      setMails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: current.starred } : m)))
    }
  }, [mails])

  const archive = useCallback(async (id: string) => {
    const token = getGoogleAccessToken()
    if (!token) return
    setMails((prev) => prev.filter((m) => m.id !== id))
    setSelectedId(null)
    try {
      await archiveGmail(token, id)
      const cached = cacheRef.current[folder]
      if (cached) {
        cacheRef.current[folder] = {
          ...cached,
          mails: cached.mails.filter((m) => m.id !== id),
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur archive')
      await refresh({ force: true })
    }
  }, [folder, refresh])

  const sendReply = useCallback(
    async (id: string, body: string) => {
      const token = getGoogleAccessToken()
      const mail = mails.find((m) => m.id === id) ?? bodyCacheRef.current.get(id)
      if (!token || !mail) return
      await sendGmailReply(token, {
        to: mail.from.email,
        subject: mail.subject,
        body,
        threadId: mail.threadId,
        fromEmail: accountEmail || undefined,
      })
      await markGmailRead(token, id)
      delete cacheRef.current.sent
      delete cacheRef.current.inbox
      setFolder('sent')
      await refresh({ force: true })
    },
    [mails, accountEmail, refresh],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mails.filter((m) => {
      if (!q) return true
      return (
        m.subject.toLowerCase().includes(q) ||
        m.from.name.toLowerCase().includes(q) ||
        m.from.email.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
      )
    })
  }, [mails, query])

  const selected = mails.find((m) => m.id === selectedId) ?? null
  const unreadCount = mails.filter((m) => m.unread).length

  useEffect(() => {
    if (selectedId) void ensureBody(selectedId)
  }, [selectedId, ensureBody])

  const value = useMemo(
    () => ({
      mails,
      loading,
      error,
      selectedId,
      setSelectedId,
      folder,
      setFolder,
      query,
      setQuery,
      filtered,
      selected,
      refresh: () => refresh({ force: true }),
      markRead,
      toggleStar,
      archive,
      sendReply,
      unreadCount,
      accountEmail,
    }),
    [
      mails,
      loading,
      error,
      selectedId,
      folder,
      query,
      filtered,
      selected,
      refresh,
      markRead,
      toggleStar,
      archive,
      sendReply,
      unreadCount,
      accountEmail,
    ],
  )

  return <MailContext.Provider value={value}>{children}</MailContext.Provider>
}

export function useMail() {
  const ctx = useContext(MailContext)
  if (!ctx) throw new Error('useMail must be used within MailProvider')
  return ctx
}
