export type GoogleCalendarItem = {
  id: string
  summary: string
  primary?: boolean
  accessRole?: string
  backgroundColor?: string
  htmlLink?: string
}

export type GoogleUserProfile = {
  email?: string
  name?: string
}

export type GoogleCalendarEventItem = {
  id: string
  summary?: string
  description?: string
  htmlLink?: string
  status?: string
  start?: {
    date?: string
    dateTime?: string
  }
  end?: {
    date?: string
    dateTime?: string
  }
}

export type GoogleCalendarEventsQuery = {
  timeMin?: string
  timeMax?: string
  maxResults?: number
}

type CalendarEventPayload = {
  title: string
  date: string
  time: string
  repeatType?: 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  repeatCustom?: string
  memo: string
  projectName?: string
}

const GOOGLE_CALENDAR_SCOPE = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ')

export const googleCalendarScope = GOOGLE_CALENDAR_SCOPE

const ALL_DAY_TIME_VALUE = 'all-day'

function buildGoogleCalendarDescription(projectName?: string, memo?: string) {
  return [projectName ? `프로젝트: ${projectName}` : '', memo ?? ''].filter(Boolean).join('\n')
}

function buildDateTime(date: string, time: string) {
  return `${date}T${time}:00`
}

function getNextDateKey(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`)
  parsedDate.setDate(parsedDate.getDate() + 1)
  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`
}

function buildRecurringRule(date: string, repeatType?: CalendarEventPayload['repeatType'], repeatCustom?: string) {
  if (!repeatType || repeatType === 'none') return undefined

  const parsedDate = new Date(`${date}T00:00:00`)
  const byDay = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][parsedDate.getDay()]
  const dayOfMonth = parsedDate.getDate()
  const monthOfYear = parsedDate.getMonth() + 1

  if (repeatType === 'custom') {
    if (!repeatCustom) return undefined
    return repeatCustom.startsWith('RRULE:') ? repeatCustom : `RRULE:${repeatCustom}`
  }

  if (repeatType === 'daily') return 'RRULE:FREQ=DAILY'
  if (repeatType === 'weekday') return 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
  if (repeatType === 'weekly') return `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`
  if (repeatType === 'monthly') return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`
  if (repeatType === 'yearly') return `RRULE:FREQ=YEARLY;BYMONTH=${monthOfYear};BYMONTHDAY=${dayOfMonth}`

  return undefined
}

export async function fetchGoogleCalendars(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('calendar-list-failed')

  const data = (await response.json()) as { items?: GoogleCalendarItem[] }
  return data.items ?? []
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('user-profile-failed')

  return (await response.json()) as GoogleUserProfile
}

export async function fetchGoogleCalendarEvents(accessToken: string, calendarId: string, query: GoogleCalendarEventsQuery = {}) {
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(query.maxResults ?? 2500),
    timeMin: query.timeMin ?? currentYearStart,
  })
  if (query.timeMax) params.set('timeMax', query.timeMax)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('calendar-events-failed')

  const data = (await response.json()) as { items?: GoogleCalendarEventItem[] }
  return (data.items ?? []).filter((item) => item.status !== 'cancelled')
}

export async function createGoogleCalendarEvent(accessToken: string, calendarId: string, payload: CalendarEventPayload) {
  const recurrence = buildRecurringRule(payload.date, payload.repeatType, payload.repeatCustom)
  const isAllDay = payload.time === ALL_DAY_TIME_VALUE
  const start = isAllDay
    ? { date: payload.date }
    : {
        dateTime: new Date(buildDateTime(payload.date, payload.time)).toISOString(),
        timeZone: 'Asia/Seoul',
      }
  const end = isAllDay
    ? { date: getNextDateKey(payload.date) }
    : (() => {
        const startDateTime = new Date(buildDateTime(payload.date, payload.time))
        const endDateTime = new Date(startDateTime)
        endDateTime.setHours(endDateTime.getHours() + 1)
        return {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Seoul',
        }
      })()

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: payload.title,
      description: buildGoogleCalendarDescription(payload.projectName, payload.memo),
      start,
      end,
      recurrence: recurrence ? [recurrence] : undefined,
    }),
  })

  if (!response.ok) throw new Error('event-create-failed')

  return (await response.json()) as { htmlLink?: string }
}
