/**
 * FLO API 타입 정의
 */

// ============ Auth API ============

export interface SignInRefreshRequest {
  refreshToken: string
  requestChannelType: string
}

export interface MemberTokenVo {
  accessToken?: string
  refreshToken?: string
  memberNo?: number | string
  hashedMemberNo?: string
  characterNo?: number | string
}

export interface CommonApiResponse<T> {
  data?: T
  error?: {
    code?: string
    message?: string
  }
}

export type RefreshTokenResponse = CommonApiResponse<MemberTokenVo>

// ============ Request Headers ============

export interface FloApiHeaders {
  'x-gm-access-token'?: string
  'x-gm-app-name'?: string
  'x-gm-app-version'?: string
  'x-gm-device-id'?: string
  'x-gm-device-model'?: string
  'x-gm-dvc-disp-nm'?: string
  'x-gm-os-type'?: OsType
  'x-gm-os-version'?: string
}

export type OsType =
  | 'ALL'
  | 'AOS'
  | 'IOS'
  | 'IOS_CATALYST'
  | 'MAC_CATALYST'
  | 'WEB'
  | 'TIZEN'
  | 'GOOGLE_DEVICE'
  | 'IOS_WATCH'
  | 'AOS_WATCH'
  | 'NUGU'
  | 'TMAP_NUGU'
