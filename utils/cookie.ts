/**
 * Cookie 유틸리티 (FLO WebView 환경용)
 *
 * Webview 환경에서 App으로부터 전달받은 토큰을 관리합니다.
 * FLO_AUT, FLO_RFT 쿠키는 CryptoJS AES로 암호화/복호화됩니다.
 */

import { AES, enc } from 'crypto-js'

// 암호화 키 (fe-flo-web과 동일) — 키가 없으면 암호화를 skip하고 평문 저장
const CRYPTO_SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY as string

// 암호화 대상 쿠키 키
const ENCRYPTED_KEYS: string[] = ['FLO_AUT', 'FLO_RFT']

// JWT HS256 헤더의 Base64 인코딩 값
const JWT_HS256_HEADER = 'eyJhbGciOiJIUzI1NiJ9'

const DEBUG = process.env.NODE_ENV === 'development'

function debugLog(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[CookieUtils] ${message}`, data || '')
  }
}

/**
 * 평문 토큰인지 확인 (이미 복호화된 상태인지)
 */
function isPlaintextToken(name: string, value: string): boolean {
  if (!value) return false

  if (name === 'FLO_AUT') {
    const isJwt = value.startsWith(JWT_HS256_HEADER) && value.split('.').length === 3
    debugLog(`isPlaintextToken(${name}): ${isJwt}`, value.substring(0, 50))
    return isJwt
  }

  if (name === 'FLO_RFT') {
    const isHex = /^[a-fA-F0-9]{32}$/.test(value)
    debugLog(`isPlaintextToken(${name}): ${isHex}`, value)
    return isHex
  }

  return false
}

function decryptString(encryptedText: string): string {
  try {
    const bytes = AES.decrypt(encryptedText, CRYPTO_SECRET_KEY)
    const decrypted = bytes.toString(enc.Utf8)

    if (!decrypted) {
      throw new Error('Decryption resulted in empty string')
    }

    debugLog('decryptString success', {
      encrypted: encryptedText.substring(0, 30),
      decrypted: decrypted.substring(0, 50),
    })

    return decrypted
  } catch (error) {
    debugLog('decryptString failed', {
      encrypted: encryptedText.substring(0, 30),
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

function encryptString(plainText: string): string {
  const encrypted = AES.encrypt(plainText, CRYPTO_SECRET_KEY).toString()
  debugLog('encryptString', {
    plain: plainText.substring(0, 50),
    encrypted: encrypted.substring(0, 30),
  })
  return encrypted
}

export const COOKIE_KEY = {
  ACCESS_TOKEN: 'FLO_AUT',
  REFRESH_TOKEN: 'FLO_RFT',
  MODE: 'mode',
  OS_TYPE: 'osType',
  IS_APP: 'isApp',
  APP_VERSION: 'appVersion',
  DEVICE_ID: 'deviceId',
  DEVICE_MODEL: 'deviceModel',
  OS_VERSION: 'osVersion',
  AFID: 'afid',
  CONNECT_SESSION_ID: 'connect_session_id',
  SERVICE_PROVIDER: 'serviceProvider',
} as const

export type CookieKey = (typeof COOKIE_KEY)[keyof typeof COOKIE_KEY]

interface CookieOptions {
  domain?: string
  path?: string
  expires?: number | Date
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

const DEFAULT_DOMAIN = '.music-flo.com'
const MAX_EXPIRES_DAYS = 365

/**
 * 쿠키 설정
 */
export function setCookie(key: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return

  if (!value) {
    debugLog(`setCookie(${key}): empty value, skipping`)
    return
  }

  // 암호화 대상 쿠키 처리 (CRYPTO_SECRET_KEY 없으면 평문 저장)
  let storedValue = value
  if (CRYPTO_SECRET_KEY && ENCRYPTED_KEYS.includes(key)) {
    if (isPlaintextToken(key, value)) {
      debugLog(`setCookie(${key}): plaintext detected, encrypting`)
      storedValue = encryptString(value)
    } else {
      debugLog(`setCookie(${key}): already encrypted or unknown format, storing as-is`)
      storedValue = value
    }
  }

  const {
    domain = DEFAULT_DOMAIN,
    path = '/',
    expires = MAX_EXPIRES_DAYS,
    secure = true,
    sameSite = 'Lax',
  } = options

  let expiresStr = ''
  if (typeof expires === 'number') {
    const date = new Date()
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000)
    expiresStr = `expires=${date.toUTCString()};`
  } else if (expires instanceof Date) {
    expiresStr = `expires=${expires.toUTCString()};`
  }

  const secureStr = secure ? 'secure;' : ''
  const sameSiteStr = `SameSite=${sameSite};`

  const cookieString = `${key}=${encodeURIComponent(
    storedValue,
  )};${expiresStr}path=${path};domain=${domain};${secureStr}${sameSiteStr}`

  debugLog(`setCookie(${key}): setting cookie`, {
    domain,
    path,
    encrypted: ENCRYPTED_KEYS.includes(key),
  })

  document.cookie = cookieString
}

/**
 * 쿠키 조회 (FLO_AUT, FLO_RFT는 자동 복호화)
 */
export function getCookie(key: string): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [cookieKey, cookieValue] = cookie.trim().split('=')
    if (cookieKey === key) {
      const value = decodeURIComponent(cookieValue || '')

      if (!value) {
        debugLog(`getCookie(${key}): empty value`)
        return null
      }

      // 암호화 대상 쿠키는 복호화 (CRYPTO_SECRET_KEY 없으면 skip)
      if (CRYPTO_SECRET_KEY && ENCRYPTED_KEYS.includes(key)) {
        if (isPlaintextToken(key, value)) {
          debugLog(`getCookie(${key}): already plaintext`)
          return value
        }

        try {
          const decrypted = decryptString(value)
          debugLog(`getCookie(${key}): decrypted successfully`)
          return decrypted
        } catch (error) {
          console.error(
            `[CookieUtils] Failed to decrypt ${key}. This might indicate the cookie is corrupted or uses a different encryption key.`,
            {
              encryptedValue: value.substring(0, 50),
              error: error instanceof Error ? error.message : String(error),
            },
          )
          return null
        }
      }

      debugLog(`getCookie(${key}): ${value}`)
      return value
    }
  }

  debugLog(`getCookie(${key}): not found`)
  return null
}

/**
 * 쿠키 삭제
 */
export function deleteCookie(key: string, domain: string = DEFAULT_DOMAIN): void {
  if (typeof document === 'undefined') return

  document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain};`
}

/**
 * Access Token 조회
 */
export function getAccessToken(): string | null {
  return getCookie(COOKIE_KEY.ACCESS_TOKEN)
}

/**
 * Access Token 설정
 */
export function setAccessToken(token: string): void {
  setCookie(COOKIE_KEY.ACCESS_TOKEN, token)
}

/**
 * App 환경 여부 (isApp 쿠키 기반)
 */
export function isApp(): boolean {
  const isAppCookie = getCookie(COOKIE_KEY.IS_APP)
  return isAppCookie === 'Y' || isAppCookie === 'true'
}

/**
 * Webview 모드 여부 (mode 쿠키 기반)
 */
export function isWebviewMode(): boolean {
  return getCookie(COOKIE_KEY.MODE) === 'webview'
}

/**
 * OS 타입 조회 ('A' | 'I' | 'MOBILE_WEB' | 'PC_WEB')
 */
export function getOsType(): string | null {
  return getCookie(COOKIE_KEY.OS_TYPE)
}

/**
 * 쿠키 디버그 정보 출력 (개발 환경 전용)
 *
 * @example
 * // 브라우저 콘솔에서 실행
 * debugCookies()
 */
export function debugCookies(): void {
  if (typeof document === 'undefined') {
    console.log('[CookieUtils] Not in browser environment')
    return
  }

  console.group('[CookieUtils] Cookie Debug Info')

  const cookies = document.cookie.split(';')
  const cookieMap = new Map<string, string>()

  cookies.forEach((cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      cookieMap.set(key, decodeURIComponent(value))
    }
  })

  Object.entries(COOKIE_KEY).forEach(([name, key]) => {
    const rawValue = cookieMap.get(key)

    if (!rawValue) {
      console.log(`${name} (${key}):`, '❌ Not found')
      return
    }

    if (CRYPTO_SECRET_KEY && ENCRYPTED_KEYS.includes(key)) {
      const isPlaintext = isPlaintextToken(key, rawValue)

      if (isPlaintext) {
        console.log(`${name} (${key}):`, '✅ Plaintext', rawValue.substring(0, 50))
      } else {
        try {
          const decrypted = decryptString(rawValue)
          console.log(
            `${name} (${key}):`,
            '🔓 Encrypted (decryptable)',
            `\n  Raw: ${rawValue.substring(0, 50)}...\n  Decrypted: ${decrypted.substring(
              0,
              50,
            )}...`,
          )
        } catch {
          console.log(
            `${name} (${key}):`,
            '❌ Encrypted (decryption failed)',
            rawValue.substring(0, 50),
          )
        }
      }
    } else {
      console.log(`${name} (${key}):`, rawValue)
    }
  })

  console.groupEnd()
}

/**
 * 전역에 debugCookies 함수 노출 (개발 환경 전용)
 */
if (typeof window !== 'undefined' && DEBUG) {
  ;(window as unknown as { debugCookies: () => void }).debugCookies = debugCookies
}
