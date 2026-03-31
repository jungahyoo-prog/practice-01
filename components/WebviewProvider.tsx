'use client'

import { useEffect } from 'react'
import { initWebview, requestAccessToken } from '@/utils/webview'
import { getAccessToken } from '@/utils/cookie'
import { actionLogger } from '@/utils/actionLogger'
import { verifyToken } from '@/services/authApi'
import { syncMemberStoreToActionLogger } from '@/store/memberStore'
import { initDeviceEnvironment } from '@/utils/navigation'
import { identifyUser, registerSuperProperties } from '@/utils/mixpanel'

/**
 * Webview 환경 초기화 Provider
 *
 * App에서 전달받은 URL 파라미터(token, mode 등)를 쿠키로 저장하고,
 * memberStore를 통해 actionLogger에 사용자 정보를 자동 동기화합니다.
 *
 * @example
 * // layout.tsx
 * <WebviewProvider />
 */
export function WebviewProvider() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY) return // WebView 미사용 시 skip

    // 1. URL 파라미터 → 쿠키 저장
    initWebview()

    // 2. 디바이스 환경 분류 (APP_AOS / APP_IOS / MOBILE_WEB / PC_WEB)
    initDeviceEnvironment()

    // 3. 토큰 확인 및 사용자 정보 설정
    let setupAttempts = 0
    const MAX_SETUP_ATTEMPTS = 3

    const setupUserInfo = async () => {
      setupAttempts++

      if (setupAttempts > MAX_SETUP_ATTEMPTS) {
        console.error(
          '[WebviewProvider] Max setup attempts reached, stopping to prevent infinite loop',
        )
        return
      }

      const accessToken = getAccessToken()

      if (accessToken) {
        try {
          const validToken = await verifyToken(accessToken)
          syncMemberStoreToActionLogger()
          actionLogger.setUserInfo({ accessToken: validToken })

          // Mixpanel 사용자 식별
          const { useMemberStore } = await import('@/store/memberStore')
          const { hashedMemberNo, characterNo } = useMemberStore.getState()
          if (hashedMemberNo) {
            identifyUser(hashedMemberNo)
            registerSuperProperties({ character_no: characterNo })
          }
        } catch (error) {
          console.error('[WebviewProvider] Failed to verify/refresh token:', error)

          if (!getAccessToken() || setupAttempts >= MAX_SETUP_ATTEMPTS) {
            requestAccessToken(
              () => {
                setupUserInfo()
              },
              (tokenError) => {
                console.error('[WebviewProvider] Failed to get token from app:', tokenError)
              },
            )
          } else {
            actionLogger.setUserInfo({ accessToken })
          }
        }
      } else {
        // accessToken이 없을 경우 App Scheme을 통해 토큰 요청
        requestAccessToken(
          () => {
            setupUserInfo()
          },
          (error) => {
            console.error('[WebviewProvider] Failed to get token from app:', error)
          },
        )
      }
    }

    setupUserInfo()
  }, [])

  return null
}
