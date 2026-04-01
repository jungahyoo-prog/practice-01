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

function buildGoogleCalendarDescription(projectName?: string, memo?: string) {
  return [projectName ? `프로젝트: ${projectName}` : '', memo ?? ''].filter(Boolean).join('\n')
}

function buildDateTime(date: string, time: string) {
  return `${date}T${time}:00`
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

export async function createGoogleCalendarEvent(accessToken: string, calendarId: string, payload: CalendarEventPayload) {
  const startDateTime = new Date(buildDateTime(payload.date, payload.time))
  const endDateTime = new Date(startDateTime)
  endDateTime.setHours(endDateTime.getHours() + 1)
  const recurrence = buildRecurringRule(payload.date, payload.repeatType, payload.repeatCustom)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: payload.title,
      description: buildGoogleCalendarDescription(payload.projectName, payload.memo),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      recurrence: recurrence ? [recurrence] : undefined,
    }),
  })

  if (!response.ok) throw new Error('event-create-failed')

  return (await response.json()) as { htmlLink?: string }
}
