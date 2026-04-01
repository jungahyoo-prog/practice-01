'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createGoogleCalendarEvent,
  fetchGoogleCalendars,
  fetchGoogleUserProfile,
  googleCalendarScope,
  type GoogleCalendarItem,
} from '@/services/googleCalendar'

type GoogleAuthResult = { success: true } | { success: false; reason: 'missing-client-id' | 'script-not-ready' | 'login-failed' }

export function useGoogleCalendar(isScriptReady: boolean) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
  const [accessToken, setAccessToken] = useState('')
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [isCalendarsLoading, setIsCalendarsLoading] = useState(false)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [calendars, setCalendars] = useState<GoogleCalendarItem[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState('')
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient | null>(null)

  useEffect(() => {
    if (!isScriptReady || !googleClientId || typeof window === 'undefined' || !window.google?.accounts?.oauth2) return

    const nextTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: googleCalendarScope,
      callback: (response) => {
        if (response.access_token) setAccessToken(response.access_token)
        setIsAuthorizing(false)
      },
      error_callback: () => {
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
      } finally {
        if (isMounted) setIsCalendarsLoading(false)
      }
    }

    void loadGoogleData()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  const isConnected = useMemo(() => Boolean(accessToken), [accessToken])
  const selectedCalendar = useMemo(() => calendars.find((calendar) => calendar.id === selectedCalendarId) ?? null, [calendars, selectedCalendarId])

  const authorize = async (): Promise<GoogleAuthResult> => {
    if (!googleClientId) return { success: false, reason: 'missing-client-id' }
    if (!isScriptReady || !tokenClient) return { success: false, reason: 'script-not-ready' }

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
  }

  const addEventToCalendar = async (payload: { calendarId: string; title: string; date: string; time: string; memo: string; projectName?: string }) => {
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
    googleClientId,
    googleEmail,
    isAuthorizing,
    isCalendarsLoading,
    isConnected,
    isSavingEvent,
    selectedCalendar,
    selectedCalendarId,
    setSelectedCalendarId,
    addEventToCalendar,
  }
}
