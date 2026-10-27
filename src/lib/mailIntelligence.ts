import type { OrionMail } from '../integrations/google/gmail'

export type MailInsightKind = 'important' | 'followup' | 'unread' | 'info'

export type MailInsight = {
  id: string
  mailId: string
  kind: MailInsightKind
  title: string
  detail: string
  score: number
  actionLabel?: string
  toolIds: string[]
  time: string
  unread: boolean
  from: string
  subject: string
}

const IMPORTANT_RE =
  /\b(urgent|asap|important|deadline|devis|facture|invoice|contrat|signature|paiement|payment|offre|proposition|relance|rappel|action required|répondre|reply|valider|validation|meeting|réunion)\b/i

const FOLLOWUP_RE =
  /\b(relance|follow[- ]?up|rappel|as discussed|suite à|en attente|waiting|ping|re\s*:|fw\s*:|tr\s*:)\b/i

const NOISE_RE =
  /\b(newsletter|unsubscribe|désabonnement|no[- ]?reply|noreply|notification|receipt|reçu automatique|promo|soldes)\b/i

function daysSince(internalDate: number) {
  return (Date.now() - internalDate) / (1000 * 60 * 60 * 24)
}

/** Score 0–100 : importance métier pour le Hub / agents. */
export function scoreMail(mail: OrionMail): number {
  let score = 0
  const blob = `${mail.subject} ${mail.preview} ${mail.from.name}`

  if (mail.unread) score += 18
  if (mail.starred) score += 22
  if (mail.hasAttachment) score += 8
  if (IMPORTANT_RE.test(blob)) score += 28
  if (FOLLOWUP_RE.test(blob)) score += 20
  if (NOISE_RE.test(blob)) score -= 35

  const age = daysSince(mail.internalDate)
  if (age < 1) score += 12
  else if (age < 3) score += 6
  else if (age > 14) score -= 8

  // Fil sans réponse récente côté inbox non lu = relance potentielle
  if (mail.unread && age >= 2 && age <= 10) score += 15

  return Math.max(0, Math.min(100, score))
}

export function classifyMail(mail: OrionMail): MailInsightKind {
  const blob = `${mail.subject} ${mail.preview}`
  const score = scoreMail(mail)
  const age = daysSince(mail.internalDate)

  if (NOISE_RE.test(blob) && score < 40) return 'info'
  if (
    FOLLOWUP_RE.test(blob) ||
    (mail.unread && age >= 2 && age <= 14 && score >= 35)
  ) {
    return 'followup'
  }
  if (score >= 45 || mail.starred || (mail.unread && IMPORTANT_RE.test(blob))) {
    return 'important'
  }
  if (mail.unread) return 'unread'
  return 'info'
}

export function toInsight(mail: OrionMail, providerId = 'gmail'): MailInsight {
  const kind = classifyMail(mail)
  const score = scoreMail(mail)
  const from = mail.from.name || mail.from.email

  if (kind === 'followup') {
    return {
      id: `ins-${mail.id}`,
      mailId: mail.id,
      kind,
      title: `Relance suggérée — ${from}`,
      detail: mail.subject || mail.preview.slice(0, 120),
      score,
      actionLabel: 'Préparer la relance',
      toolIds: [providerId],
      time: mail.dateLabel || mail.time,
      unread: mail.unread,
      from,
      subject: mail.subject,
    }
  }

  if (kind === 'important') {
    return {
      id: `ins-${mail.id}`,
      mailId: mail.id,
      kind,
      title: `Prioritaire — ${from}`,
      detail: mail.subject || mail.preview.slice(0, 120),
      score,
      actionLabel: 'Ouvrir',
      toolIds: [providerId],
      time: mail.dateLabel || mail.time,
      unread: mail.unread,
      from,
      subject: mail.subject,
    }
  }

  return {
    id: `ins-${mail.id}`,
    mailId: mail.id,
    kind: mail.unread ? 'unread' : 'info',
    title: mail.subject || '(sans objet)',
    detail: `${from} · ${mail.preview.slice(0, 100)}`,
    score,
    actionLabel: 'Ouvrir',
    toolIds: [providerId],
    time: mail.dateLabel || mail.time,
    unread: mail.unread,
    from,
    subject: mail.subject,
  }
}

export function buildHubInsights(mails: OrionMail[], providerId = 'gmail') {
  const insights = mails.map((m) => toInsight(m, providerId))
  const important = insights
    .filter((i) => i.kind === 'important')
    .sort((a, b) => b.score - a.score)
  const followups = insights
    .filter((i) => i.kind === 'followup')
    .sort((a, b) => b.score - a.score)
  const recent = [...insights].sort((a, b) => b.score - a.score)

  return {
    insights: recent,
    important,
    followups,
    unreadCount: mails.filter((m) => m.unread).length,
    priorityCount: important.length + followups.length,
  }
}
