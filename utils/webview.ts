/**
 * Webview 초기화 모듈
 *
 * App에서 Webview로 전달하는 URL 파라미터를 쿠키로 변환합니다.
 *
 * @example
 * // App에서 webview를 열 때 URL 형식:
 * // https://your-app.music-flo.com?token=xxx&mode=webview&osType=A&isApp=Y
 *
 * import { initWebview } from '@/utils/webview'
 * useEffect(() => { initWebview() }, [])
 */

import { setAccessToken, setCookie, getAccessToken, isApp, COOKIE_KEY } from './cookie'
import { decodeJwtPayload } from './jwt'
import { actionLogger } from './actionLogger'
import { isAppWebView } from './navigation'

interface FloJwtPayload {
  memberNo?: string
  characterNo?: string
  [key: string]: unknown
}

/**
 * URL 파라미터와 쿠키 키 매핑
 */
const QUERY_TO_COOKIE_MAP: Array<{ query: string; cookie: string }> = [
  { query: 'token', cookie: COOKIE_KEY.ACCESS_TOKEN },
  { query: 'refreshToken', cookie: COOKIE_KEY.REFRESH_TOKEN },
  { query: 'mode', cookie: COOKIE_KEY.MODE },
  { query: 'osType', cookie: COOKIE_KEY.OS_TYPE },
  { query: 'isApp', cookie: COOKIE_KEY.IS_APP },
  { query: 'appVersion', cookie: COOKIE_KEY.APP_VERSION },
  { query: 'deviceId', cookie: COOKIE_KEY.DEVICE_ID },
  { query: 'deviceModel', cookie: COOKIE_KEY.DEVICE_MODEL },
  { query: 'osVersion', cookie: COOKIE_KEY.OS_VERSION },
  { query: 'afid', cookie: COOKIE_KEY.AFID },
  { query: 'connect_session_id', cookie: COOKIE_KEY.CONNECT_SESSION_ID },
  { query: 'serviceProvider', cookie: COOKIE_KEY.SERVICE_PROVIDER },
]

/**
 * App Scheme (토큰 갱신 요청용)
 */
export const APP_SCHEME = {
  BASE: 'flomusic',
  ACTION: {
    ACCESS_TOKEN: 'action/accessToken',
  },
} as const

/**
 * URL 파라미터에서 값 추출하여 쿠키로 저장
 */
export function initWebview(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const isWebview = isAppWebView()
  const hasTokenParam = params.has('token')

  // URL 파라미터를 쿠키로 저장
  QUERY_TO_COOKIE_MAP.forEach(({ query, cookie }) => {
    const value = params.get(query)
    if (value !== null && value !== '') {
      setCookie(cookie, value)
    }
  })

  // Webview 모드가 아닌 경우, URL에서 토큰 파라미터 제거 (보안)
  if (!isWebview && hasTokenParam) {
    params.delete('token')
    params.delete('refreshToken')
    const newSearch = params.toString()
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`
    window.history.replaceState(null, '', newUrl)
  }

  // URL 파라미터에 token이 없고 App 환경이며, 쿠키에도 토큰이 없는 경우
  if (!hasTokenParam && isApp() && !getAccessToken()) {
    requestAccessToken(
      (token) => {
        console.log('[initWebview] Token received from app:', token)
      },
      (error) => {
        console.warn('[initWebview] Failed to get token from app:', error)
      },
    )
  }
}

/**
 * App에 토큰 갱신 요청 (App Scheme 호출)
 */
export function requestAccessToken(
  onSuccess?: (token: string) => void,
  onFail?: (error: string) => void,
): void {
  if (typeof window === 'undefined') return

  const successCallbackName = 'flomusicCbSuccess'
  const failCallbackName = 'flomusicCbFail'

  window.flomusicCbSuccess = async (token: string) => {
    try {
      setAccessToken(token)

      try {
        const payload = decodeJwtPayload<FloJwtPayload>(token)
        actionLogger.setUserInfo({
          memberNo: payload.memberNo || '',
          characterNo: payload.characterNo || '',
          accessToken: token,
        })
      } catch (jwtError) {
        console.warn('[requestAccessToken] Failed to decode JWT:', jwtError)
        actionLogger.setUserInfo({
          accessToken: token,
        })
      }

      try {
        await actionLogger.send({
          pageId: `${window.location.origin}${window.location.pathname}`,
          categoryId: 'cbSuccess',
          actionId: 'appscheme_action-accessToken',
        })
      } catch (logError) {
        console.warn('[requestAccessToken] Failed to send action log:', logError)
      }

      onSuccess?.(token)
    } catch (error) {
      console.error('[requestAccessToken] Error in success callback:', error)
      onFail?.(error instanceof Error ? error.message : String(error))
    } finally {
      delete window.flomusicCbSuccess
      delete window.flomusicCbFail
    }
  }

  window.flomusicCbFail = async (error: string) => {
    try {
      try {
        await actionLogger.send({
          pageId: `${window.location.origin}${window.location.pathname}`,
          categoryId: 'cbFail',
          actionId: 'appscheme_action-accessToken',
        })
      } catch (logError) {
        console.warn('[requestAccessToken] Failed to send action log:', logError)
      }

      onFail?.(error)
    } catch (callbackError) {
      console.error('[requestAccessToken] Error in fail callback:', callbackError)
    } finally {
      delete window.flomusicCbSuccess
      delete window.flomusicCbFail
    }
  }

  window.location.href = `${APP_SCHEME.BASE}://${APP_SCHEME.ACTION.ACCESS_TOKEN}?success=${successCallbackName}&fail=${failCallbackName}`
}
