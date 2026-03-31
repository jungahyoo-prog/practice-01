'use client'

import { useEffect } from 'react'
import { initMixpanel, registerSuperProperties } from '@/utils/mixpanel'

/**
 * Mixpanel 초기화 Provider
 *
 * 앱 시작 시 Mixpanel을 초기화하고 기본 Super Properties를 등록합니다.
 *
 * @example
 * // app/layout.tsx
 * <MixpanelProvider />
 */
export function MixpanelProvider() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return // Mixpanel 미사용 시 skip

    initMixpanel()

    registerSuperProperties({
      entry_path: document.referrer || '',
      action_location: window.location.pathname,
    })
  }, [])

  return null
}
