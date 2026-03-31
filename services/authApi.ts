import { apiInstance, Response } from '@/config/api/apiInstance'
import { FLO_API_BASE_URL } from '@/config/env'
import { RefreshTokenResponse } from '@/types/api'
import { getCookie, setAccessToken, setCookie, COOKIE_KEY } from '@/utils/cookie'
import { getDeviceId } from '@/utils/deviceId'
import { AxiosError } from 'axios'
import { saveMemberInfo } from '@/services/memberApi'

/**
 * Refresh Token으로 Access Token 갱신
 */
export async function refreshAccessToken(): Promise<void> {
  const refreshToken = getCookie(COOKIE_KEY.REFRESH_TOKEN)
  if (!refreshToken) {
    throw new Error('Refresh token is not available')
  }

  try {
    const { data } = await apiInstance.post<RefreshTokenResponse>(
      `${FLO_API_BASE_URL}/auth/v1/sign/in/refresh`,
      { refreshToken },
    )

    if (data.data?.accessToken && data.data?.refreshToken) {
      setAccessToken(data.data?.accessToken)
      setCookie(COOKIE_KEY.REFRESH_TOKEN, data.data?.refreshToken)
    } else {
      throw new Error('Invalid refresh token')
    }
  } catch (error) {
    return Promise.reject(error as AxiosError<Response<unknown>>)
  }
}

/**
 * 토큰 검증 API
 */
export async function verifyToken(accessToken: string): Promise<string> {
  try {
    if (!accessToken) {
      throw new Error('Access token is required')
    }

    const { data } = await apiInstance.get(`${FLO_API_BASE_URL}/auth/v1/token`, {
      headers: {
        'x-gm-access-token': accessToken,
        'x-gm-device-id': getDeviceId(),
      },
    })

    if (data.data) {
      await saveMemberInfo(data)
    }

    return accessToken
  } catch (error) {
    return Promise.reject(error as AxiosError<Response<unknown>>)
  }
}
