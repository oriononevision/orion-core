import { agents as catalog, type Agent, type AgentRun, type AgentStatus } from '../data/agents'
import { buildHubInsights, type MailInsight } from './mailIntelligence'
import type { OrionMail } from '../integrations/google/gmail'
import { fetchInbox } from '../integrations/google/gmail'
import { listUpcomingEvents, type CalendarEvent } from '../integrations/google/calendar'
import { listDriveFiles, type DriveFile } from '../integrations/google/drive'
import { getGoogleAccessToken } from '../integrations/google/tokenStore'

export type AgentDraft = {
  id: string
  agentId: string
  mailId?: string
  to: string
  subject: string
  body: string
  createdAt: string
  status: 'pending' | 'approved' | 'dismissed'
}

export type AgentRunResult = {
  agent: Agent
  runs: AgentRun[]
  drafts: AgentDraft[]
  summary: string
}

export type AgentRuntimeContext = {
  connectedToolIds: string[]
  mails: OrionMail[]
}

function nowLabel() {
  return 'À l’instant'
}

function runId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function hasTool(ctx: AgentRuntimeContext, id: string) {
  return ctx.connectedToolIds.includes(id)
}

function draftReply(mail: OrionMail, kind: 'followup' | 'important'): AgentDraft {
  const firstName = mail.from.name.split(' ')[0] || mail.from.name
  const body =
    kind === 'followup'
      ? `Bonjour ${firstName},\n\nJe me permets de revenir vers vous concernant « ${mail.subject} ».\nN’hésitez pas à me dire où vous en êtes — je reste disponible pour avancer.\n\nCordialement`
      : `Bonjour ${firstName},\n\nMerci pour votre message au sujet de « ${mail.subject} ».\nJe reviens vers vous rapidement avec une réponse précise.\n\nCordialement`

  return {
    id: runId('draft'),
    agentId: 'mailer',
    mailId: mail.id,
    to: mail.from.email,
    subject: mail.subject.toLowerCase().startsWith('re:') ? mail.subject : `Re: ${mail.subject}`,
    body,
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
}

async function ensureMails(ctx: AgentRuntimeContext): Promise<OrionMail[]> {
  if (ctx.mails.length > 0) return ctx.mails
  const token = getGoogleAccessToken()
  if (!token || !hasTool(ctx, 'gmail')) return []
  try {
    return await fetchInbox(token, 12)
  } catch {
    return []
  }
}

async function runMailer(ctx: AgentRuntimeContext, agent: Agent): Promise<AgentRunResult> {
  if (!hasTool(ctx, 'gmail')) {
    return {
      agent: { ...agent, status: 'waiting', lastAction: 'Gmail requis' },
      runs: [
        {
          id: runId('r'),
          agentId: agent.id,
          title: 'Gmail non connecté',
          detail: 'Connectez Gmail pour que Mailer trie l’inbox et prépare des brouillons.',
          tools: ['gmail'],
          time: nowLabel(),
          status: 'needs_input',
        },
      ],
      drafts: [],
      summary: 'En attente de Gmail.',
    }
  }

  const mails = await ensureMails(ctx)
  const hub = buildHubInsights(mails, 'gmail')
  const drafts: AgentDraft[] = []
  const runs: AgentRun[] = []

  for (const insight of hub.followups.slice(0, 3)) {
    const mail = mails.find((m) => m.id === insight.mailId)
    if (!mail) continue
    drafts.push(draftReply(mail, 'followup'))
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: insight.title,
      detail: `Brouillon de relance préparé · score ${insight.score}`,
      tools: ['gmail'],
      time: nowLabel(),
      status: 'success',
    })
  }

  for (const insight of hub.important.slice(0, 2)) {
    const mail = mails.find((m) => m.id === insight.mailId)
    if (!mail) continue
    if (drafts.some((d) => d.mailId === mail.id)) continue
    drafts.push(draftReply(mail, 'important'))
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: insight.title,
      detail: `Priorité détectée — brouillon d’accusé prêt · score ${insight.score}`,
      tools: ['gmail'],
      time: nowLabel(),
      status: 'success',
    })
  }

  if (runs.length === 0) {
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: 'Inbox analysée',
      detail: `${mails.length} messages scorés — aucune relance urgente pour l’instant.`,
      tools: ['gmail'],
      time: nowLabel(),
      status: 'success',
    })
  }

  return {
    agent: {
      ...agent,
      status: 'done',
      lastAction: `${drafts.length} brouillon(s) · ${hub.followups.length} relance(s) · ${hub.important.length} prioritaire(s)`,
      runsToday: agent.runsToday + 1,
    },
    runs,
    drafts,
    summary: `Mailer a analysé ${mails.length} e-mails et préparé ${drafts.length} brouillon(s).`,
  }
}

async function runNexus(ctx: AgentRuntimeContext, agent: Agent): Promise<AgentRunResult> {
  const mails = hasTool(ctx, 'gmail') ? await ensureMails(ctx) : []
  const hub = buildHubInsights(mails, 'gmail')
  const toolsLabel = ctx.connectedToolIds.slice(0, 6).join(', ') || 'aucun'

  const detail = [
    `Outils actifs : ${toolsLabel}`,
    mails.length
      ? `Mails : ${hub.unreadCount} non lus · ${hub.important.length} importants · ${hub.followups.length} relances`
      : 'Mails : Gmail non chargé',
  ].join(' · ')

  return {
    agent: {
      ...agent,
      status: 'done',
      lastAction: 'Brief hub consolidé',
      runsToday: agent.runsToday + 1,
    },
    runs: [
      {
        id: runId('r'),
        agentId: agent.id,
        title: 'Brief quotidien ORION',
        detail,
        tools: ctx.connectedToolIds.slice(0, 5),
        time: nowLabel(),
        status: 'success',
      },
    ],
    drafts: [],
    summary: detail,
  }
}

async function runMeeting(ctx: AgentRuntimeContext, agent: Agent): Promise<AgentRunResult> {
  const token = getGoogleAccessToken()
  if (!hasTool(ctx, 'calendar') || !token) {
    return {
      agent: { ...agent, status: 'waiting', lastAction: 'Agenda Google requis' },
      runs: [
        {
          id: runId('r'),
          agentId: agent.id,
          title: 'Agenda non connecté',
          detail: 'Connectez Google Calendar (via Google) pour générer les briefs.',
          tools: ['calendar'],
          time: nowLabel(),
          status: 'needs_input',
        },
      ],
      drafts: [],
      summary: 'En attente de Calendar.',
    }
  }

  let events: CalendarEvent[] = []
  try {
    events = await listUpcomingEvents(token, 5)
  } catch {
    return {
      agent: { ...agent, status: 'waiting', lastAction: 'Erreur Calendar API' },
      runs: [
        {
          id: runId('r'),
          agentId: agent.id,
          title: 'Impossible de lire l’agenda',
          detail: 'Quota ou session Google — réessayez dans une minute.',
          tools: ['calendar'],
          time: nowLabel(),
          status: 'needs_input',
        },
      ],
      drafts: [],
      summary: 'Échec Calendar.',
    }
  }

  const mails = hasTool(ctx, 'gmail') ? await ensureMails(ctx) : []
  const runs: AgentRun[] = events.map((ev) => {
    const attendees = ev.attendees ?? []
    const related = mails.filter((m) => {
      const blob = `${m.subject} ${m.from.email} ${m.preview}`.toLowerCase()
      return (
        attendees.some((a) => blob.includes(a.toLowerCase())) ||
        ev.summary
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 4)
          .some((w) => blob.includes(w))
      )
    })
    const when = ev.start
      ? new Date(ev.start).toLocaleString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'
    return {
      id: runId('r'),
      agentId: agent.id,
      title: `Brief — ${ev.summary}`,
      detail: `${when}${ev.location ? ` · ${ev.location}` : ''} · ${attendees.length || 0} invité(s) · ${related.length} e-mail(s) liés`,
      tools: ['calendar', ...(related.length ? ['gmail'] : [])],
      time: nowLabel(),
      status: 'success' as const,
    }
  })

  if (runs.length === 0) {
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: 'Aucun événement à venir',
      detail: 'Pas de rendez-vous trouvé sur l’agenda principal.',
      tools: ['calendar'],
      time: nowLabel(),
      status: 'success',
    })
  }

  return {
    agent: {
      ...agent,
      status: 'done',
      lastAction: `${events.length} brief(s) réunion`,
      runsToday: agent.runsToday + 1,
    },
    runs,
    drafts: [],
    summary: `Meeting Prep a préparé ${events.length} brief(s).`,
  }
}

async function runArchiviste(ctx: AgentRuntimeContext, agent: Agent): Promise<AgentRunResult> {
  const token = getGoogleAccessToken()
  if (!hasTool(ctx, 'drive') || !token) {
    return {
      agent: { ...agent, status: 'waiting', lastAction: 'Drive requis' },
      runs: [
        {
          id: runId('r'),
          agentId: agent.id,
          title: 'Drive non connecté',
          detail: 'Connectez Google Drive pour indexer les fichiers récents.',
          tools: ['drive'],
          time: nowLabel(),
          status: 'needs_input',
        },
      ],
      drafts: [],
      summary: 'En attente de Drive.',
    }
  }

  let files: DriveFile[] = []
  try {
    files = await listDriveFiles(token, 12)
  } catch {
    return {
      agent: { ...agent, status: 'waiting', lastAction: 'Erreur Drive API' },
      runs: [
        {
          id: runId('r'),
          agentId: agent.id,
          title: 'Impossible de lire Drive',
          detail: 'Vérifiez la session Google ou le quota, puis relancez.',
          tools: ['drive'],
          time: nowLabel(),
          status: 'needs_input',
        },
      ],
      drafts: [],
      summary: 'Échec Drive.',
    }
  }

  const runs: AgentRun[] = files.slice(0, 6).map((f) => ({
    id: runId('r'),
    agentId: agent.id,
    title: `Indexé — ${f.name}`,
    detail: `${f.mimeType || 'fichier'} · modifié ${f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('fr-FR') : '—'}`,
    tools: ['drive'],
    time: nowLabel(),
    status: 'success',
  }))

  if (runs.length === 0) {
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: 'Aucun fichier récent',
      detail: 'Drive ne renvoie pas de documents récents.',
      tools: ['drive'],
      time: nowLabel(),
      status: 'success',
    })
  }

  return {
    agent: {
      ...agent,
      status: 'done',
      lastAction: `${files.length} fichier(s) indexés`,
      runsToday: agent.runsToday + 1,
    },
    runs,
    drafts: [],
    summary: `Archiviste a indexé ${files.length} fichier(s) Drive.`,
  }
}

async function runCrmPulse(ctx: AgentRuntimeContext, agent: Agent): Promise<AgentRunResult> {
  const mails = hasTool(ctx, 'gmail') ? await ensureMails(ctx) : []
  const commercial = mails.filter((m) =>
    /\b(devis|proposition|offre|deal|contrat|pipeline|client|facture|opportunité)\b/i.test(
      `${m.subject} ${m.preview}`,
    ),
  )

  const hubspotOn = hasTool(ctx, 'hubspot')
  const runs: AgentRun[] = commercial.slice(0, 4).map((m) => ({
    id: runId('r'),
    agentId: agent.id,
    title: `Signal commercial — ${m.from.name || m.from.email}`,
    detail: `${m.subject} · source Gmail${hubspotOn ? ' · croiser HubSpot' : ' · HubSpot démo'}`,
    tools: hubspotOn ? ['gmail', 'hubspot'] : ['gmail'],
    time: nowLabel(),
    status: commercial.length && !m.unread ? ('success' as const) : ('needs_input' as const),
  }))

  if (runs.length === 0) {
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: hubspotOn ? 'Pipeline calme' : 'Scan commercial terminé',
      detail: hasTool(ctx, 'gmail')
        ? 'Aucun e-mail commercial prioritaire détecté dans le lot chargé.'
        : 'Connectez Gmail (et HubSpot) pour alimenter CRM Pulse.',
      tools: hubspotOn ? ['hubspot', 'gmail'] : ['gmail'],
      time: nowLabel(),
      status: hasTool(ctx, 'gmail') ? 'success' : 'needs_input',
    })
  }

  return {
    agent: {
      ...agent,
      status: 'done',
      lastAction: `${commercial.length} signal(aux) commercial(aux)`,
      runsToday: agent.runsToday + 1,
    },
    runs,
    drafts: [],
    summary: `CRM Pulse a repéré ${commercial.length} fil(s) commercial(aux).`,
  }
}

async function runSentinel(ctx: AgentRuntimeContext, agent: Agent): Promise<AgentRunResult> {
  const mails = hasTool(ctx, 'gmail') ? await ensureMails(ctx) : []
  const support = mails.filter((m) =>
    /\b(support|aide|bug|erreur|ticket|urgence|problème|issue|plainte|réclamation)\b/i.test(
      `${m.subject} ${m.preview}`,
    ),
  )

  const runs: AgentRun[] = support.slice(0, 4).map((m) => ({
    id: runId('r'),
    agentId: agent.id,
    title: `Ticket potentiel — ${m.from.name || m.from.email}`,
    detail: m.subject,
    tools: hasTool(ctx, 'intercom') ? ['intercom', 'gmail'] : ['gmail'],
    time: nowLabel(),
    status: m.unread ? ('needs_input' as const) : ('success' as const),
  }))

  if (runs.length === 0) {
    runs.push({
      id: runId('r'),
      agentId: agent.id,
      title: 'File support calme',
      detail: hasTool(ctx, 'gmail')
        ? 'Aucun message support critique dans le lot actuel.'
        : 'Connectez Gmail ou Intercom pour activer Sentinel.',
      tools: ['intercom', 'gmail'],
      time: nowLabel(),
      status: hasTool(ctx, 'gmail') ? 'success' : 'needs_input',
    })
  }

  return {
    agent: {
      ...agent,
      status: 'done',
      lastAction:
        support.length === 0 ? '0 critique' : `${support.length} conversation(s) priorisées`,
      runsToday: agent.runsToday + 1,
    },
    runs,
    drafts: [],
    summary: `Sentinel a classé ${support.length} signal(aux) support.`,
  }
}

export async function runAgent(
  agentId: string,
  ctx: AgentRuntimeContext,
  current?: Agent,
): Promise<AgentRunResult> {
  const base = current ?? catalog.find((a) => a.id === agentId)
  if (!base) throw new Error(`Agent inconnu: ${agentId}`)

  const running: Agent = {
    ...base,
    status: 'running' as AgentStatus,
    lastAction: 'Exécution en cours…',
  }

  switch (agentId) {
    case 'mailer':
      return runMailer(ctx, running)
    case 'nexus':
      return runNexus(ctx, running)
    case 'meeting':
      return runMeeting(ctx, running)
    case 'archiviste':
      return runArchiviste(ctx, running)
    case 'crm-pulse':
      return runCrmPulse(ctx, running)
    case 'sentinel':
      return runSentinel(ctx, running)
    default:
      return {
        agent: { ...running, status: 'idle', lastAction: 'Agent non implémenté' },
        runs: [],
        drafts: [],
        summary: 'Agent inconnu.',
      }
  }
}

export function insightsForAgent(agentId: string, insights: MailInsight[]) {
  if (agentId === 'mailer') {
    return insights.filter((i) => i.kind === 'followup' || i.kind === 'important')
  }
  return insights
}
