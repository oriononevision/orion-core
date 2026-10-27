export type CalendarEvent = {
  id: string
  summary: string
  description?: string
  htmlLink?: string
  hangoutLink?: string
  start: string
  end: string
  location?: string
  attendees?: string[]
}

export async function listUpcomingEvents(token: string, max = 25): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: String(max),
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
  })
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) throw new Error(`Calendar API ${res.status}`)
  const data = (await res.json()) as {
    items?: Array<{
      id: string
      summary?: string
      description?: string
      htmlLink?: string
      hangoutLink?: string
      location?: string
      start?: { dateTime?: string; date?: string }
      end?: { dateTime?: string; date?: string }
      attendees?: Array<{ email?: string }>
    }>
  }

  return (data.items ?? []).map((e) => ({
    id: e.id,
    summary: e.summary || '(sans titre)',
    description: e.description,
    htmlLink: e.htmlLink,
    hangoutLink: e.hangoutLink,
    location: e.location,
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    attendees: e.attendees?.map((a) => a.email || '').filter(Boolean),
  }))
}
