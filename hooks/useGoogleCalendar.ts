'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createGoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  fetchGoogleCalendars,
  fetchGoogleUserProfile,
  googleCalendarScope,
  type GoogleCalendarItem,
  type GoogleCalendarEventItem,
} from '@/services/googleCalendar'

type GoogleAuthResult =
  | { success: true }
  | { success: false; reason: 'missing-client-id' | 'script-not-ready' | 'login-failed' | 'popup-closed' | 'token-missing' | 'calendar-load-failed'; detail?: string }

export function useGoogleCalendar(isScriptReady: boolean) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
  const [accessToken, setAccessToken] = useState('')
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isCalendarsLoading, setIsCalendarsLoading] = useState(false)
  const [isEventsLoading, setIsEventsLoading] = useState(false)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([])
  const [events, setEvents] = useState<GoogleCalendarEventItem[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState('')
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient | null>(null)

  useEffect(() => {
    if (!isScriptReady || !googleClientId || typeof window === 'undefined' || !window.google?.accounts?.oauth2) return

    const nextTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: googleCalendarScope,
      callback: (response) => {
        if (response.access_token) {
          setAuthError('')
          setAccessToken(response.access_token)
        } else {
          setAuthError('토큰을 받지 못했습니다.')
        }
        setIsAuthorizing(false)
      },
      error_callback: (error) => {
        setAuthError(error?.type === 'popup_closed' ? '로그인 창이 닫혀 연결이 완료되지 않았습니다.' : '구글 로그인 중 오류가 발생했습니다.')
        setIsAuthorizing(false)
      },
    })

    setTokenClient(nextTokenClient)
  }, [googleClientId, isScriptReady])

  useEffect(() => {
    if (!accessToken) return

    let isMounted = true

    const loadGoogleData = async () => {
      setIsCalendarsLoading(true)

      try {
        const [calendarItems, profile] = await Promise.all([fetchGoogleCalendars(accessToken), fetchGoogleUserProfile(accessToken)])
        if (!isMounted) return

        setCalendars(calendarItems)
        setGoogleEmail(profile.email ?? '')

        if (!selectedCalendarId) {
          const defaultCalendar = calendarItems.find((calendar) => calendar.primary) ?? calendarItems[0]
          setSelectedCalendarId(defaultCalendar?.id ?? '')
        }
      } catch {
        if (isMounted) setAuthError('로그인은 되었지만 캘린더 목록을 불러오지 못했습니다.')
      } finally {
        if (isMounted) setIsCalendarsLoading(false)
      }
    }

    void loadGoogleData()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !selectedCalendarId) {
      setEvents([])
      return
    }

    let isMounted = true

    const loadCalendarEvents = async () => {
      setIsEventsLoading(true)
      try {
        const nextEvents = await fetchGoogleCalendarEvents(accessToken, selectedCalendarId)
        if (isMounted) {
          setEvents(nextEvents)
        }
      } catch {
        if (isMounted) setAuthError('선택한 캘린더 일정을 불러오지 못했습니다.')
      } finally {
        if (isMounted) setIsEventsLoading(false)
      }
    }

    void loadCalendarEvents()

    return () => {
      isMounted = false
    }
  }, [accessToken, selectedCalendarId])

  const isConnected = useMemo(() => Boolean(accessToken), [accessToken])
  const selectedCalendar = useMemo(() => calendars.find((calendar) => calendar.id === selectedCalendarId) ?? null, [calendars, selectedCalendarId])

  const authorize = async (): Promise<GoogleAuthResult> => {
    if (!googleClientId) return { success: false, reason: 'missing-client-id' }
    if (!isScriptReady || !tokenClient) return { success: false, reason: 'script-not-ready' }

    setAuthError('')
    setIsAuthorizing(true)

    try {
      tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' })
      return { success: true }
    } catch {
      setIsAuthorizing(false)
      return { success: false, reason: 'login-failed' }
    }
  }

  const disconnect = () => {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken)
    }

    setAccessToken('')
    setCalendars([])
    setSelectedCalendarId('')
    setGoogleEmail('')
    setAuthError('')
  }

  const addEventToCalendar = async (payload: {
    calendarId: string
    title: string
    date: string
    time: string
    repeatType?: 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'
    repeatCustom?: string
    memo: string
    projectName?: string
  }) => {
    if (!accessToken) throw new Error('missing-access-token')

    setIsSavingEvent(true)

    try {
      return await createGoogleCalendarEvent(accessToken, payload.calendarId, payload)
    } finally {
      setIsSavingEvent(false)
    }
  }

  return {
    accessToken,
    authorize,
    calendars,
    disconnect,
    events,
    googleClientId,
    googleEmail,
    authError,
    isAuthorizing,
    isCalendarsLoading,
    isEventsLoading,
    isConnected,
    isSavingEvent,
    selectedCalendar,
    selectedCalendarId,
    setSelectedCalendarId,
    addEventToCalendar,
  }
}
