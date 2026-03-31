/**
 * FLO Action Log 모듈
 *
 * FLO 서비스의 Action Log를 전송하기 위한 독립 실행형 모듈입니다.
 * 정적 빌드(output: 'export') 환경에서는 Nginx 프록시를 통해 CORS를 우회합니다.
 *
 * @example
 * import { actionLogger } from '@/utils/actionLogger'
 *
 * // 로그인 후 사용자 정보 설정
 * actionLogger.setUserInfo({ memberNo: '12345', characterNo: '1' })
 *
 * // 로그 전송
 * actionLogger.send({
 *   pageId: '/home',
 *   categoryId: '/main',
 *   actionId: 'click_button',
 *   body: { buttonName: 'start' }
 * })
 */

// ============ 설정 ============

/**
 * 환경 감지
 * - 개발 환경: process.env.NODE_ENV === 'development'
 * - 프로덕션 환경: process.env.NODE_ENV === 'production'
 *
 * 정적 빌드에서는 빌드 시점의 NODE_ENV가 사용됩니다.
 * 런타임에서 환경을 구분하려면 window.location.hostname을 확인하세요.
 */
const getEnvironment = (): 'production' | 'stage' => {
  if (typeof window === 'undefined') return 'stage'

  // 프로덕션 도메인 목록 (필요에 따라 수정)
  const productionHosts = ['www.music-flo.com', 'music-flo.com', 'flo.com']

  if (productionHosts.includes(window.location.hostname)) {
    return 'production'
  }

  return 'stage'
}

const CONFIG = {
  stage: {
    // Nginx 프록시 경로 (정적 빌드용)
    // 개발 환경에서는 직접 호출 (CORS 허용 필요)
    endpoint: '/api/action-log/v1/action_log',
    directEndpoint: 'https://ingestion.qa.log.infra.music-flo.io/v1/action_log',
    token: 'e9d0fa4ae33728e5de74c6a9f6e640302f7d23b0',
  },
  production: {
    endpoint: '/api/action-log/v1/action_log',
    directEndpoint: 'https://ingestion.log.infra.music-flo.io/v1/action_log',
    token: 'a86c43e19ca7db5d98289ad7c9045e6222afdc3a',
  },
}

// ============ 유틸리티 함수 ============

/**
 * 타임스탬프 생성 (YYYYMMDDhhmmssMS 형식)
 */
function generateTimestamp(): string {
  const now = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
    `${pad(now.getMilliseconds(), 3)}`
  )
}

/**
 * UUID v4 생성
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * OS 정보 추출
 */
function getOSInfo(): { name: string; version: string } {
  if (typeof navigator === 'undefined') {
    return { name: 'Unknown', version: '' }
  }
  const ua = navigator.userAgent
  if (/Windows/.test(ua)) {
    return { name: 'Windows', version: ua.match(/Windows NT ([\d.]+)/)?.[1] || '' }
  }
  if (/Mac OS X/.test(ua)) {
    return {
      name: 'macOS',
      version: ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, '.') || '',
    }
  }
  if (/iPhone|iPad/.test(ua)) {
    return { name: 'iOS', version: ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '' }
  }
  if (/Android/.test(ua)) {
    return { name: 'Android', version: ua.match(/Android ([\d.]+)/)?.[1] || '' }
  }
  return { name: 'Unknown', version: '' }
}

/**
 * 브라우저 정보 추출
 */
function getBrowserInfo(): { name: string; version: string } {
  if (typeof navigator === 'undefined') {
    return { name: 'Unknown', version: '' }
  }
  const ua = navigator.userAgent
  if (/Chrome/.test(ua) && !/Chromium|Edge/.test(ua)) {
    return { name: 'Chrome', version: ua.match(/Chrome\/([\d.]+)/)?.[1] || '' }
  }
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    return { name: 'Safari', version: ua.match(/Version\/([\d.]+)/)?.[1] || '' }
  }
  if (/Firefox/.test(ua)) {
    return { name: 'Firefox', version: ua.match(/Firefox\/([\d.]+)/)?.[1] || '' }
  }
  if (/Edge/.test(ua)) {
    return { name: 'Edge', version: ua.match(/Edge\/([\d.]+)/)?.[1] || '' }
  }
  return { name: 'Unknown', version: '' }
}

/**
 * URL에서 UTM 파라미터 추출
 */
function getUTMData(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
    }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
  }
}

/**
 * camelCase를 snake_case로 변환
 */
function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

// ============ 세션 관리 ============

class SessionManager {
  private static CONNECT_SESSION_KEY = 'connectSessionId'
  private static ACTION_SESSION_KEY = 'FLO_ASI'
  private static ACTION_SESSION_TIME_KEY = 'FLO_ASI_T'

  /**
   * Connect Session ID 조회 (30분 유효)
   */
  static getConnectSessionId(): string {
    if (typeof sessionStorage === 'undefined') {
      return generateUUID()
    }

    let csid = sessionStorage.getItem(this.CONNECT_SESSION_KEY)

    if (!csid) {
      csid = generateUUID()
      sessionStorage.setItem(this.CONNECT_SESSION_KEY, csid)
    }

    return csid
  }

  /**
   * Action Session ID 조회 (3시간 유효)
   */
  static getActionSessionId(): string {
    if (typeof sessionStorage === 'undefined') {
      return `asi_v1_${generateUUID()}`
    }

    const prevId = sessionStorage.getItem(this.ACTION_SESSION_KEY)
    const prevTime = sessionStorage.getItem(this.ACTION_SESSION_TIME_KEY)

    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000

    if (prevId && prevTime && Number(prevTime) > threeHoursAgo) {
      sessionStorage.setItem(this.ACTION_SESSION_TIME_KEY, Date.now().toString())
      return prevId
    }

    const newId = `asi_v1_${generateUUID()}`
    sessionStorage.setItem(this.ACTION_SESSION_KEY, newId)
    sessionStorage.setItem(this.ACTION_SESSION_TIME_KEY, Date.now().toString())
    return newId
  }
}

// ============ 디바이스 ID 관리 ============

class DeviceManager {
  private static DEVICE_ID_KEY = 'FLO_DEVICE_ID'

  /**
   * 디바이스 ID 조회 (영구 저장)
   */
  static getDeviceId(): string {
    if (typeof localStorage === 'undefined') {
      return `web_${generateUUID().replace(/-/g, '')}`
    }

    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY)

    if (!deviceId) {
      deviceId = `web_${generateUUID().replace(/-/g, '')}`
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId)
    }

    return deviceId
  }
}

// ============ 타입 정의 ============

export interface ActionLogParams {
  /** 페이지 식별자 (예: '/home', '/player') */
  pageId: string
  /** 카테고리/섹션 식별자 (예: '/main', '/play_controller') */
  categoryId: string
  /** 액션 식별자 (예: 'click', 'play', 'enter') */
  actionId: string
  /** 이벤트 명칭 (Mixpanel 연동용, 선택) */
  eventName?: string
  /** 커스텀 데이터 */
  body?: Record<string, string | number | boolean | undefined | null>
}

export interface UserInfo {
  /** 회원 번호 */
  memberNo?: string
  /** 캐릭터 번호 */
  characterNo?: string
  /** 액세스 토큰 */
  accessToken?: string
}

export interface ActionLoggerOptions {
  /** 앱 이름 (로그에 포함됨) */
  appName?: string
  /** Nginx 프록시 사용 여부 (기본: true) */
  useProxy?: boolean
  /** 디버그 모드 (콘솔 로깅) */
  debug?: boolean
}

// ============ 메인 클래스 ============

class ActionLogger {
  private userInfo: UserInfo = {}
  private appName: string = 'FLO_WEB'
  private useProxy: boolean = true
  private debug: boolean = false

  /**
   * 옵션 설정
   */
  configure(options: ActionLoggerOptions): void {
    if (options.appName) this.appName = options.appName
    if (options.useProxy !== undefined) this.useProxy = options.useProxy
    if (options.debug !== undefined) this.debug = options.debug
  }

  /**
   * 사용자 정보 설정 (로그인 후 호출)
   */
  setUserInfo(info: UserInfo): void {
    this.userInfo = info
  }

  /**
   * 사용자 정보 초기화 (로그아웃 시 호출)
   */
  clearUserInfo(): void {
    this.userInfo = {}
  }

  /**
   * 앱 이름 설정
   */
  setAppName(name: string): void {
    this.appName = name
  }

  /**
   * Action Log 전송
   */
  async send({
    pageId,
    categoryId,
    actionId,
    eventName,
    body = {},
  }: ActionLogParams): Promise<void> {
    // SSR 환경에서는 전송하지 않음
    if (typeof window === 'undefined') {
      return
    }

    try {
      const env = getEnvironment()
      const config = CONFIG[env]
      const ts = generateTimestamp()
      const os = getOSInfo()
      const browser = getBrowserInfo()

      // Body 정규화
      const normalizedBody: Record<string, string> = {
        action_session_id: SessionManager.getActionSessionId(),
        ...getUTMData(),
      }

      Object.entries(body).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          normalizedBody[camelToSnake(key)] = String(value)
        }
      })

      // 빈 값 필터링
      const filteredBody = Object.fromEntries(
        Object.entries(normalizedBody).filter(
          ([, v]) => v !== '' && v !== 'null' && v !== 'undefined',
        ),
      )

      const payload = [
        {
          // 시간
          base_time: ts,
          local_time: ts,

          // 플랫폼
          log_lib_version: `web-${this.appName}`,
          os_name: os.name,
          os_version: os.version,
          browser_name: browser.name,
          browser_version: browser.version,

          // 화면
          resolution: `${screen.width}*${screen.height}`,
          screen_width: screen.width,
          screen_height: screen.height,
          language_code: navigator.language,

          // 인증
          token: config.token,
          device_id: DeviceManager.getDeviceId(),
          access_token: this.userInfo.accessToken || '',
          member_no: this.userInfo.memberNo || '',
          character_no: this.userInfo.characterNo || '',

          // 페이지
          referrer: document.referrer,
          url: location.href,
          document_title: document.title,

          // 로그 식별
          page_id: pageId,
          category_id: categoryId,
          action_id: actionId,
          event_name: eventName,

          // 세션
          connect_session_id: SessionManager.getConnectSessionId(),

          // 커스텀 데이터
          body: filteredBody,
        },
      ]

      // 디버그 모드
      if (this.debug) {
        console.log('[ActionLogger] Sending:', { pageId, categoryId, actionId, body: filteredBody })
      }

      // 엔드포인트 결정 (프록시 또는 직접 호출)
      const endpoint = this.useProxy ? config.endpoint : config.directEndpoint

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      // 로그 전송 실패는 사용자 경험에 영향을 주지 않도록 무시
      if (this.debug) {
        console.error('[ActionLogger] Failed to send log:', error)
      }
    }
  }
}

// ============ 싱글톤 인스턴스 ============

export const actionLogger = new ActionLogger()
