'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createGoogleCalendarEvent,
  fetchGoogleCalendarEvents,
  fetchGoogleCalendars,
  fetchGoogleUserProfile,
  googleCalendarScope,
  type GoogleCalendarEventItem,
  type GoogleCalendarItem,
} from '@/services/googleCalendar'

type GoogleAuthResult =
  | { success: true }
  | { success: false; reason: 'missing-client-id' | 'script-not-ready' | 'login-failed' | 'popup-closed' | 'token-missing' | 'calendar-load-failed'; detail?: string }

export function useGoogleCalendar(isScriptReady: boolean) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
  const [accessToken, setAccessToken] = useState('')
  const [tokenSource, setTokenSource] = useState<'gis' | 'supabase' | null>(null)
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

  const refreshEvents = useCallback(
    async (calendarId = selectedCalendarId) => {
      if (!accessToken || !calendarId) {
        setEvents([])
        return [] as GoogleCalendarEventItem[]
      }

      setIsEventsLoading(true)

      try {
        const nextEvents = await fetchGoogleCalendarEvents(accessToken, calendarId)
        setEvents(nextEvents)
        return nextEvents
      } catch {
        setAuthError('?좏깮??罹섎┛???쇱젙??遺덈윭?ㅼ? 紐삵뻽?듬땲??')
        return [] as GoogleCalendarEventItem[]
      } finally {
        setIsEventsLoading(false)
      }
    },
    [accessToken, selectedCalendarId],
  )

  useEffect(() => {
    if (!isScriptReady || !googleClientId || typeof window === 'undefined' || !window.google?.accounts?.oauth2) return

    const nextTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: googleCalendarScope,
      callback: (response) => {
        if (response.access_token) {
          setAuthError('')
          setAccessToken(response.access_token)
          setTokenSource('gis')
        } else {
          setAuthError('?좏겙??諛쏆? 紐삵뻽?듬땲??')
        }
        setIsAuthorizing(false)
      },
      error_callback: (error) => {
        setAuthError(error?.type === 'popup_closed' ? '濡쒓렇??李쎌씠 ?ロ? ?곌껐???꾨즺?섏? ?딆븯?듬땲??' : '援ш? 濡쒓렇??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.')
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
        if (isMounted) setAuthError('濡쒓렇?몄? ?섏뿀吏留?罹섎┛??紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??')
      } finally {
        if (isMounted) setIsCalendarsLoading(false)
      }
    }

    void loadGoogleData()

    return () => {
      isMounted = false
    }
  }, [accessToken, selectedCalendarId])

  useEffect(() => {
    if (!accessToken || !selectedCalendarId) {
      setEvents([])
      return
    }

    void refreshEvents(selectedCalendarId)
  }, [accessToken, refreshEvents, selectedCalendarId])

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

  const connectWithAccessToken = useCallback((nextAccessToken: string, emailHint?: string) => {
    if (!nextAccessToken) return

    setAuthError('')
    setAccessToken(nextAccessToken)
    setTokenSource('supabase')
    if (emailHint) {
      setGoogleEmail(emailHint)
    }
  }, [])

  const disconnect = () => {
    if (tokenSource === 'gis' && accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken)
    }

    setAccessToken('')
    setTokenSource(null)
    setCalendars([])
    setSelectedCalendarId('')
    setGoogleEmail('')
    setAuthError('')
    setEvents([])
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
      const createdEvent = await createGoogleCalendarEvent(accessToken, payload.calendarId, payload)
      if (payload.calendarId === selectedCalendarId) {
        await refreshEvents(payload.calendarId)
      }
      return createdEvent
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
    connectWithAccessToken,
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
    refreshEvents,
  }
}
