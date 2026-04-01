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
    }),
  })

  if (!response.ok) throw new Error('event-create-failed')

  return (await response.json()) as { htmlLink?: string }
}
