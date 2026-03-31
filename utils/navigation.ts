import { isApp, getCookie, setCookie, COOKIE_KEY } from './cookie'
import { APP_SCHEME } from './webview'

/**
 * FLO Music 홈 URL
 */
export const FLO_HOME_URL = 'https://m.music-flo.com'

// ============ UA 기반 감지 ============

/**
 * 모바일 디바이스 여부 (User Agent 기반)
 */
export function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod|Android/i.test(ua)
}

/**
 * App Webview 환경 감지
 */
export function isAppWebView(): boolean {
  if (typeof window === 'undefined') return false

  // 1. 쿠키 기반 (initWebview 이후 세팅됨, 가장 신뢰)
  const isAppCookie = getCookie(COOKIE_KEY.IS_APP)
  if (isAppCookie === 'Y' || isAppCookie === 'true') return true

  // 2. URL 쿼리 파라미터에서 mode=webview 확인
  const params = new URLSearchParams(window.location.search)
  if (params.get('mode') === 'webview') return true

  // 3. URL 쿼리에서 osType 확인 (A 또는 I이면 앱)
  const osTypeParam = params.get('osType')
  if (osTypeParam === 'A' || osTypeParam === 'I') return true

  // 4. User Agent 기반 감지 (fallback)
  const ua = navigator.userAgent.toLowerCase()
  return (
    ua.includes('musicflo') ||
    ua.includes('flo/') ||
    (ua.includes('android') && ua.includes('wv')) ||
    (ua.includes('iphone') && !ua.includes('safari')) ||
    (ua.includes('ipad') && !ua.includes('safari'))
  )
}

// ============ 쿠키 기반 환경 판별 (initWebview 이후 사용) ============

export function isAOS(): boolean {
  return getCookie(COOKIE_KEY.OS_TYPE) === 'A'
}

export function isIOS(): boolean {
  return getCookie(COOKIE_KEY.OS_TYPE) === 'I'
}

export function isPcWeb(): boolean {
  return getCookie(COOKIE_KEY.OS_TYPE) === 'PC_WEB'
}

export function isMobileWeb(): boolean {
  return getCookie(COOKIE_KEY.OS_TYPE) === 'MOBILE_WEB'
}

export type DeviceEnv = 'APP_AOS' | 'APP_IOS' | 'MOBILE_WEB' | 'PC_WEB'

export function getDeviceEnv(): DeviceEnv {
  const osType = getCookie(COOKIE_KEY.OS_TYPE)
  if (osType === 'A') return 'APP_AOS'
  if (osType === 'I') return 'APP_IOS'
  if (osType === 'MOBILE_WEB') return 'MOBILE_WEB'
  return 'PC_WEB'
}

// ============ 디바이스 환경 초기화 ============

/**
 * 디바이스 환경을 감지하여 쿠키에 저장
 *
 * initWebview() 이후에 호출되어야 함 (URL 쿼리 → 쿠키 저장 이후)
 */
export function initDeviceEnvironment(): void {
  if (typeof window === 'undefined') return

  const osType = getCookie(COOKIE_KEY.OS_TYPE)
  const isAppEnv = isAppWebView()

  // 1. 앱 환경 설정
  setCookie(COOKIE_KEY.IS_APP, isAppEnv ? 'Y' : 'N')

  // 2. osType이 앱에서 세팅되지 않았으면 UA 기반 분류
  if (!osType || osType === '') {
    if (isMobileUA()) {
      setCookie(COOKIE_KEY.OS_TYPE, 'MOBILE_WEB')
    } else {
      setCookie(COOKIE_KEY.OS_TYPE, 'PC_WEB')
    }
  } else if (osType === 'A' || osType === 'I') {
    // 앱에서 세팅한 osType 유지
  } else if (!['MOBILE_WEB', 'PC_WEB'].includes(osType)) {
    if (isMobileUA()) {
      setCookie(COOKIE_KEY.OS_TYPE, 'MOBILE_WEB')
    } else {
      setCookie(COOKIE_KEY.OS_TYPE, 'PC_WEB')
    }
  }
}

/**
 * 페이지 닫기 또는 홈으로 이동
 *
 * App 환경: app scheme을 통해 webview 닫기
 * Web 환경: FLO Music 홈으로 리다이렉트
 */
export function closeOrNavigateHome(): void {
  if (isApp()) {
    setTimeout(() => {
      window.location.href = `${APP_SCHEME.BASE}://action/close`
    }, 0)
  } else {
    window.location.href = FLO_HOME_URL
  }
}
