/**
 * Mixpanel 초기화 및 유틸리티 모듈
 *
 * @example
 * import { initMixpanel, trackEvent, identifyUser } from '@/utils/mixpanel'
 *
 * initMixpanel()
 * identifyUser('hashed_member_no_123')
 * trackEvent('card_selected', { card_id: 1 })
 */

import mixpanel from 'mixpanel-browser'

// ============ 설정 ============

const isProduction = process.env.NODE_ENV === 'production'

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN

// ============ 상태 ============

let isInitialized = false

// ============ 타입 정의 ============

export interface MixpanelSuperProperties {
  entry_path?: string
  action_location?: string
  character_no?: string | number
  app_name?: string
}

export type MixpanelEventProperties = Record<string, string | number | boolean | undefined | null>

// ============ 초기화 ============

/**
 * Mixpanel 초기화 (앱 시작 시 한 번만 호출)
 *
 * TODO: app_name을 프로젝트에 맞게 변경하세요
 */
export function initMixpanel(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!MIXPANEL_TOKEN) {
    return
  }

  if (isInitialized) {
    return
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: !isProduction,
      track_pageview: false,
      persistence: 'localStorage',
      ignore_dnt: true,
    })

    // TODO: app_name을 프로젝트에 맞게 변경
    mixpanel.register({
      app_name: 'FLO_PROJECT_NAME',
      platform: 'web',
    })

    isInitialized = true

    if (!isProduction) {
      console.log('[Mixpanel] Initialized successfully')
    }
  } catch (error) {
    console.error('[Mixpanel] Failed to initialize:', error)
  }
}

// ============ 사용자 식별 ============

export function identifyUser(distinctId: string): void {
  if (!isInitialized || typeof window === 'undefined') {
    return
  }

  try {
    mixpanel.identify(distinctId)
  } catch (error) {
    console.error('[Mixpanel] Failed to identify user:', error)
  }
}

export function resetUser(): void {
  if (!isInitialized || typeof window === 'undefined') {
    return
  }

  try {
    mixpanel.reset()
  } catch (error) {
    console.error('[Mixpanel] Failed to reset user:', error)
  }
}

// ============ Super Properties ============

export function registerSuperProperties(properties: MixpanelSuperProperties): void {
  if (!isInitialized || typeof window === 'undefined') {
    return
  }

  try {
    mixpanel.register(properties)
  } catch (error) {
    console.error('[Mixpanel] Failed to register super properties:', error)
  }
}

// ============ 이벤트 트래킹 ============

export function trackEvent(eventName: string, properties?: MixpanelEventProperties): void {
  if (!isInitialized || typeof window === 'undefined') {
    return
  }

  try {
    const filteredProperties = properties
      ? Object.fromEntries(
          Object.entries(properties).filter(([, v]) => v !== null && v !== undefined),
        )
      : undefined

    mixpanel.track(eventName, filteredProperties)
  } catch (error) {
    console.error('[Mixpanel] Failed to track event:', error)
  }
}

// ============ 유틸리티 ============

export function isMixpanelInitialized(): boolean {
  return isInitialized
}

export function getMixpanelInstance(): typeof mixpanel | null {
  if (!isInitialized) {
    return null
  }
  return mixpanel
}
