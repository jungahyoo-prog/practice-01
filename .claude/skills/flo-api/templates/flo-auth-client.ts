/**
 * FLO 인증 처리 클라이언트 예시 (TypeScript)
 *
 * 적용 범위:
 * - GET /auth/v1/token
 * - POST /auth/v1/sign/in/refresh
 *
 * 핵심 동작:
 * - 앱 시작 시 validateToken()으로 토큰/디바이스 상태 동기화
 * - 401 발생 시 refreshToken()으로 액세스/리프레시 재발급
 * - requestWithAutoRefresh()에서 원래 요청을 1회 재시도
 * - 401 응답이 동시에 몰릴 때 리프레시 호출을 단일 Promise로 병합
 *
 * 참고:
 * - 서버 파서 요구사항에 맞게 x-gm-device-model, x-gm-dvc-disp-nm은 Base64로 인코딩
 * - 재발급 실패 시 상위 레이어에서 tokenStore.clear()를 호출하고 로그아웃을 트리거하는 것을 권장
 */

/** FLO API 응답에서 사용하는 Y/N 플래그 타입. */
export type YnType = 'Y' | 'N'

/** `GET /auth/v1/token` 응답 페이로드. */
export interface TokenValidResponse {
  memberNo: number
  hashedMemberNo?: string
  characterNo: number
  viewSelectCharacterYn?: YnType
  popUpClauseYn?: YnType
}

/** `POST /auth/v1/sign/in/refresh` 응답 페이로드. */
export interface TokenResponse {
  memberNo: number
  hashedMemberNo?: string
  characterNo: number
  accessToken: string
  refreshToken: string
  viewSelectCharacterYn?: YnType
  popUpClauseYn?: YnType
}

/** 공통 백엔드 오류 envelope. */
export interface FloApiErrorBody {
  code?: string
  message?: string
}

/** 비-2xx 응답에 사용하는 오류 객체. */
export class FloApiError extends Error {
  readonly status: number
  readonly code?: string

  /** HTTP 상태 코드와 응답 바디로 타입이 지정된 API 오류를 생성한다. */
  constructor(status: number, code?: string, message?: string) {
    super(message ?? `FLO API error: ${status}`)
    this.name = 'FloApiError'
    this.status = status
    this.code = code
  }
}

/** FLO 인증 API 요청을 구성하는 GM 헤더. */
export interface GMHeaders {
  memberNo?: number
  characterNo?: number
  deviceNo?: number
  deviceId: string
  appName?: string
  appVersion?: string
  osType?: string
  osVersion?: string
  deviceModel?: string
  deviceDisplayName?: string
}

/** 스토리지 구현(메모리/localStorage 등)을 위한 토큰 저장소 인터페이스. */
export interface TokenStore {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(tokens: Pick<TokenResponse, 'accessToken' | 'refreshToken'>): void
  clear(): void
}

/** `FloAuthClient` 생성자 옵션. */
export interface FloAuthClientOptions {
  baseUrl: string
  headers: GMHeaders
  tokenStore: TokenStore
  fetchImpl?: typeof fetch
}

/**
 * FLO 인증 전용 HTTP 클라이언트.
 * 토큰 검증, 토큰 재발급, 401 응답 시 1회 재시도 플로우를 처리한다.
 */
export class FloAuthClient {
  private readonly baseUrl: string
  private readonly gm: GMHeaders
  private readonly tokenStore: TokenStore
  private readonly fetchImpl: typeof fetch
  private refreshPromise: Promise<TokenResponse> | null = null

  /** 새로운 FLO 인증 클라이언트 인스턴스를 생성한다. */
  constructor(options: FloAuthClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.gm = options.headers
    this.tokenStore = options.tokenStore
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  /** `GET /auth/v1/token`을 호출하여 현재 토큰을 검증하고 회원/디바이스 상태를 동기화한다. */
  async validateToken(): Promise<TokenValidResponse> {
    const headers = this.buildHeaders({
      requireSignInHeaders: true,
      includeAccessToken: true,
    })

    return this.request<TokenValidResponse>('GET', '/auth/v1/token', { headers })
  }

  /**
   * `POST /auth/v1/sign/in/refresh`를 호출하고 토큰 스토리지를 업데이트한다.
   * 이미 재발급이 진행 중이면 동일한 in-flight Promise를 반환한다.
   */
  async refreshToken(): Promise<TokenResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.tokenStore.getRefreshToken()
    if (!refreshToken) {
      throw new FloApiError(401, 'NO_REFRESH_TOKEN', 'refresh token is missing')
    }

    this.refreshPromise = this.doRefresh(refreshToken).finally(() => {
      this.refreshPromise = null
    })

    return this.refreshPromise
  }

  /**
   * 자동 재발급 동작이 포함된 임의의 요청을 전송한다.
   * 첫 응답이 401인 경우 재발급 성공 후 정확히 1회 재시도한다.
   */
  async requestWithAutoRefresh<T>(
    method: string,
    path: string,
    init?: { body?: unknown; headers?: Record<string, string> },
  ): Promise<T> {
    try {
      return await this.request<T>(method, path, {
        ...init,
        headers: {
          ...this.buildHeaders({ includeAccessToken: true }),
          ...(init?.headers ?? {}),
        },
      })
    } catch (error) {
      if (!(error instanceof FloApiError) || error.status !== 401) {
        throw error
      }

      await this.refreshToken()

      return this.request<T>(method, path, {
        ...init,
        headers: {
          ...this.buildHeaders({ includeAccessToken: true }),
          ...(init?.headers ?? {}),
        },
      })
    }
  }

  /** 실제 재발급 API 호출을 수행하는 내부 메서드. */
  private async doRefresh(refreshToken: string): Promise<TokenResponse> {
    const headers = this.buildHeaders({
      requireDeviceHeader: true,
      includeAccessToken: false,
    })

    const response = await this.request<TokenResponse>('POST', '/auth/v1/sign/in/refresh', {
      headers,
      body: { refreshToken },
    })

    this.tokenStore.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    })

    return response
  }

  /**
   * 각 요청에 맞는 GM 헤더를 구성한다.
   * 대상 API에 따라 필수 로그인/디바이스 헤더를 강제한다.
   */
  private buildHeaders(options?: {
    requireSignInHeaders?: boolean
    requireDeviceHeader?: boolean
    includeAccessToken?: boolean
  }): Record<string, string> {
    const requireSignInHeaders = options?.requireSignInHeaders ?? false
    const requireDeviceHeader = options?.requireDeviceHeader ?? false
    const includeAccessToken = options?.includeAccessToken ?? false

    if ((requireSignInHeaders || requireDeviceHeader) && !this.gm.deviceId) {
      throw new Error('x-gm-device-id is required')
    }

    if (requireSignInHeaders) {
      if (this.gm.memberNo == null) {
        throw new Error('x-gm-member-no is required')
      }
      if (this.gm.characterNo == null) {
        throw new Error('x-gm-character-no is required')
      }
      if (this.gm.deviceNo == null) {
        throw new Error('x-gm-device-no is required')
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-gm-device-id': this.gm.deviceId,
    }

    if (this.gm.memberNo != null) {
      headers['x-gm-member-no'] = String(this.gm.memberNo)
    }
    if (this.gm.characterNo != null) {
      headers['x-gm-character-no'] = String(this.gm.characterNo)
    }
    if (this.gm.deviceNo != null) {
      headers['x-gm-device-no'] = String(this.gm.deviceNo)
    }
    if (this.gm.appName) {
      headers['x-gm-app-name'] = this.gm.appName
    }
    if (this.gm.appVersion) {
      headers['x-gm-app-version'] = this.gm.appVersion
    }
    if (this.gm.osType) {
      headers['x-gm-os-type'] = this.gm.osType
    }
    if (this.gm.osVersion) {
      headers['x-gm-os-version'] = this.gm.osVersion
    }
    if (this.gm.deviceModel) {
      headers['x-gm-device-model'] = encodeBase64Utf8(this.gm.deviceModel)
    }
    if (this.gm.deviceDisplayName) {
      headers['x-gm-dvc-disp-nm'] = encodeBase64Utf8(this.gm.deviceDisplayName)
    }

    if (includeAccessToken) {
      const accessToken = this.tokenStore.getAccessToken()
      if (accessToken) {
        headers['x-gm-access-token'] = accessToken
      }
    }

    return headers
  }

  /** HTTP 요청을 전송하고 비-2xx 응답을 `FloApiError`로 변환한다. */
  private async request<T>(
    method: string,
    path: string,
    init?: { body?: unknown; headers?: Record<string, string> },
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: init?.headers,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    })

    if (!response.ok) {
      const body = (await this.safeJson(response)) as FloApiErrorBody | null
      throw new FloApiError(response.status, body?.code, body?.message)
    }

    return (await response.json()) as T
  }

  /** 응답 바디를 안전하게 JSON으로 파싱하고, 빈/잘못된 페이로드는 null을 반환한다. */
  private async safeJson(response: Response): Promise<unknown | null> {
    const text = await response.text()
    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }
}

/** Node.js와 브라우저 런타임 모두에서 UTF-8 텍스트를 Base64로 인코딩한다. */
function encodeBase64Utf8(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }

  if (typeof btoa !== 'undefined') {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
  }

  throw new Error('No base64 encoder available in this runtime')
}
