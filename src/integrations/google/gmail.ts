export type GmailListItem = {
  id: string
  threadId: string
}

export type OrionMail = {
  id: string
  threadId: string
  from: { name: string; email: string }
  to: { name: string; email: string }[]
  subject: string
  preview: string
  body: string
  bodyHtml?: string
  time: string
  dateLabel: string
  unread: boolean
  starred: boolean
  labels: string[]
  hasAttachment: boolean
  internalDate: number
  bodyLoaded?: boolean
}

function parseAddress(raw: string): { name: string; email: string } {
  const m = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/)
  if (m) {
    return { name: (m[1] || m[2]).trim(), email: m[2].trim() }
  }
  return { name: raw.trim(), email: raw.trim() }
}

function header(headers: { name: string; value: string }[], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeBody(data?: string) {
  if (!data) return ''
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(normalized), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
  } catch {
    try {
      return atob(normalized)
    } catch {
      return ''
    }
  }
}

type GmailPart = {
  mimeType?: string
  filename?: string
  body?: { data?: string; attachmentId?: string; size?: number }
  parts?: GmailPart[]
  headers?: { name: string; value: string }[]
}

function extractBodies(payload?: GmailPart): { text: string; html: string; hasAttachment: boolean } {
  let text = ''
  let html = ''
  let hasAttachment = false

  function walk(part?: GmailPart) {
    if (!part) return
    if (part.filename && part.body?.attachmentId) hasAttachment = true
    if (part.mimeType === 'text/plain' && part.body?.data && !text) {
      text = decodeBody(part.body.data)
    }
    if (part.mimeType === 'text/html' && part.body?.data && !html) {
      html = decodeBody(part.body.data)
    }
    part.parts?.forEach(walk)
  }

  walk(payload)
  if (!text && !html && payload?.body?.data) {
    text = decodeBody(payload.body.data)
  }
  return { text, html, hasAttachment }
}

function formatWhen(ms: number) {
  const d = new Date(ms)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return {
      time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      dateLabel: "Aujourd'hui",
    }
  }
  return {
    time: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    dateLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
  }
}

export function formatGmailError(status: number, body: string) {
  const lower = body.toLowerCase()
  if (status === 403 && (lower.includes('quota') || lower.includes('rate limit') || lower.includes('units per minute'))) {
    return 'Quota Gmail atteint pour cette minute. Attendez 30–60 s puis cliquez sur Actualiser. Astuce : Core charge désormais moins de messages à la fois.'
  }
  if (status === 401) {
    return 'Session Google expirée. Reconnectez Gmail depuis Connexions.'
  }
  if (status === 429) {
    return 'Trop de requêtes Gmail. Patientez une minute puis actualisez.'
  }
  return `Gmail API ${status}: ${body.slice(0, 160)}`
}

async function gmailFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(formatGmailError(res.status, err))
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Enchaîne les appels par petits lots pour rester sous le quota « units per minute ». */
async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0

  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export async function listGmailMessageIds(
  token: string,
  opts?: { q?: string; labelIds?: string[]; maxResults?: number },
) {
  const params = new URLSearchParams()
  params.set('maxResults', String(opts?.maxResults ?? 20))
  if (opts?.q) params.set('q', opts.q)
  opts?.labelIds?.forEach((id) => params.append('labelIds', id))
  const data = await gmailFetch<{ messages?: GmailListItem[]; resultSizeEstimate?: number }>(
    token,
    `messages?${params.toString()}`,
  )
  return {
    ids: data.messages ?? [],
    estimate: data.resultSizeEstimate ?? 0,
  }
}

type RawMessage = {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  internalDate?: string
  payload?: GmailPart
}

function toOrionMail(msg: RawMessage, bodyLoaded: boolean): OrionMail {
  const headers = msg.payload?.headers ?? []
  const from = parseAddress(header(headers, 'From') || 'inconnu')
  const toRaw = header(headers, 'To')
  const to = toRaw
    ? toRaw.split(',').map((p) => parseAddress(p.trim()))
    : [{ name: 'moi', email: '' }]
  const subject = header(headers, 'Subject') || '(sans objet)'
  const { text, html, hasAttachment } = bodyLoaded
    ? extractBodies(msg.payload)
    : { text: '', html: '', hasAttachment: false }
  const internalDate = Number(msg.internalDate || Date.now())
  const when = formatWhen(internalDate)
  const labels = (msg.labelIds || []).filter(
    (l) =>
      ![
        'UNREAD',
        'IMPORTANT',
        'CATEGORY_PERSONAL',
        'CATEGORY_UPDATES',
        'CATEGORY_PROMOTIONS',
        'CATEGORY_SOCIAL',
        'CATEGORY_FORUMS',
      ].includes(l),
  )

  return {
    id: msg.id,
    threadId: msg.threadId,
    from,
    to,
    subject,
    preview: msg.snippet || text.slice(0, 120),
    body: text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : msg.snippet || ''),
    bodyHtml: html || undefined,
    time: when.time,
    dateLabel: when.dateLabel,
    unread: (msg.labelIds || []).includes('UNREAD'),
    starred: (msg.labelIds || []).includes('STARRED'),
    labels,
    hasAttachment,
    internalDate,
    bodyLoaded,
  }
}

const META_HEADERS = ['From', 'To', 'Subject', 'Date']

/** Liste légère : metadata seulement (beaucoup moins cher que format=full). */
export async function getGmailMessageMeta(token: string, id: string): Promise<OrionMail> {
  const params = new URLSearchParams({ format: 'metadata' })
  META_HEADERS.forEach((h) => params.append('metadataHeaders', h))
  const msg = await gmailFetch<RawMessage>(token, `messages/${id}?${params.toString()}`)
  return toOrionMail(msg, false)
}

/** Corps complet — à appeler seulement à l’ouverture d’un message. */
export async function getGmailMessage(token: string, id: string): Promise<OrionMail> {
  const msg = await gmailFetch<RawMessage>(token, `messages/${id}?format=full`)
  return toOrionMail(msg, true)
}

async function fetchLabeledMails(token: string, labelIds: string[], max: number) {
  const { ids, estimate } = await listGmailMessageIds(token, {
    labelIds,
    maxResults: max,
  })
  const mails = await mapPool(ids, 3, (m) => getGmailMessageMeta(token, m.id))
  const sorted = mails.sort((a, b) => b.internalDate - a.internalDate)
  ;(sorted as OrionMail[] & { estimate?: number }).estimate = estimate
  return sorted
}

export async function fetchInbox(token: string, max = 15): Promise<OrionMail[]> {
  return fetchLabeledMails(token, ['INBOX'], max)
}

export async function fetchStarred(token: string, max = 12) {
  return fetchLabeledMails(token, ['STARRED'], max)
}

export async function fetchSent(token: string, max = 12) {
  return fetchLabeledMails(token, ['SENT'], max)
}

export async function modifyGmailLabels(
  token: string,
  id: string,
  add: string[],
  remove: string[],
) {
  await gmailFetch(token, `messages/${id}/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addLabelIds: add, removeLabelIds: remove }),
  })
}

export async function markGmailRead(token: string, id: string) {
  await modifyGmailLabels(token, id, [], ['UNREAD'])
}

export async function toggleGmailStar(token: string, id: string, starred: boolean) {
  if (starred) await modifyGmailLabels(token, id, ['STARRED'], [])
  else await modifyGmailLabels(token, id, [], ['STARRED'])
}

export async function archiveGmail(token: string, id: string) {
  await modifyGmailLabels(token, id, [], ['INBOX'])
}

function toBase64Url(raw: string) {
  const bytes = new TextEncoder().encode(raw)
  let bin = ''
  bytes.forEach((b) => {
    bin += String.fromCharCode(b)
  })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendGmailReply(
  token: string,
  opts: {
    to: string
    subject: string
    body: string
    threadId?: string
    fromEmail?: string
  },
) {
  const subject = opts.subject.toLowerCase().startsWith('re:')
    ? opts.subject
    : `Re: ${opts.subject}`
  const lines = [
    `To: ${opts.to}`,
    opts.fromEmail ? `From: ${opts.fromEmail}` : '',
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    opts.body,
  ].filter(Boolean)

  const raw = toBase64Url(lines.join('\r\n'))
  await gmailFetch(token, 'messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      raw,
      threadId: opts.threadId,
    }),
  })
}

export async function getProfileEmailCount(token: string) {
  const data = await gmailFetch<{ messagesTotal?: number; threadsTotal?: number; emailAddress?: string }>(
    token,
    'profile',
  )
  return data
}
