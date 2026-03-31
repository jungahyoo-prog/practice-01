export interface JwtHeader {
  alg: string
  typ?: string
  [key: string]: unknown
}

export interface JwtPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  [key: string]: unknown
}

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
}

/**
 * Base64URL 문자열을 일반 문자열로 디코딩
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }

  if (typeof window !== 'undefined') {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
  }

  return Buffer.from(base64, 'base64').toString('utf-8')
}

/**
 * JWT 문자열을 디코딩 (서명 검증 없음)
 */
export function decodeJwt(token: string): DecodedJwt {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid JWT: token must be a non-empty string')
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    throw new Error('Invalid JWT: token must have 3 parts separated by dots')
  }

  const [headerPart, payloadPart, signaturePart] = parts

  try {
    const header = JSON.parse(base64UrlDecode(headerPart)) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as JwtPayload

    return {
      header,
      payload,
      signature: signaturePart,
    }
  } catch (err) {
    throw new Error(
      `Invalid JWT: failed to decode - ${err instanceof Error ? err.message : 'unknown error'}`,
    )
  }
}

/**
 * JWT payload만 디코딩 (간편 버전)
 */
export function decodeJwtPayload<T extends JwtPayload = JwtPayload>(token: string): T {
  return decodeJwt(token).payload as T
}

/**
 * JWT가 만료되었는지 확인
 */
export function isJwtExpired(token: string): boolean {
  try {
    const { payload } = decodeJwt(token)

    if (!payload.exp) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  } catch {
    return true
  }
}

/**
 * JWT 만료까지 남은 시간 (초)
 */
export function getJwtTimeToExpiry(token: string): number | null {
  try {
    const { payload } = decodeJwt(token)

    if (!payload.exp) {
      return null
    }

    const now = Math.floor(Date.now() / 1000)
    return payload.exp - now
  } catch {
    return null
  }
}
