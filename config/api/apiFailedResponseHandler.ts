import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { Response } from './apiInstance'
import { getCookie, COOKIE_KEY, deleteCookie } from '@/utils/cookie'
import { refreshAccessToken } from '@/services/authApi'
import { setDeviceId } from '@/utils/deviceId'
/**
 * API Response Interceptor Error Handler
 */
/**
 * 5000002: 서비스 점검
 * 4010001: 잘못된 토큰
 * 4010002: 만료된 토큰
 * 4010003: 완전히 토큰이 만료되거나 인증이 불가, 로컬내 모든 정보를 날림, refresh Token이 만료되었을 때
 * 4091001: 유효하지 않은 캐릭터 번호
 */
const CUSTOM_CODE = {
  MAINTENANCE: '5000002',
  WRONG_CREDENTIAL: '4010001',
  EXPIRED: '4010002',
  NOT_ALLOWED: '4010003',
  WRONG_CHARACTER_NO: '4091001',
}

let hasUnauthorizedFlag = false

export const failedResponseHandler = async (error: AxiosError<Response<unknown>>) => {
  const status = error.response?.status
  const header = error.response?.config.headers

  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

  // api call 재시도 하지 않았을 때
  if (!originalRequest?._retry) {
    // api call 중복요청 방지
    if (originalRequest) {
      originalRequest._retry = true
    }

    if (header?.['x-fe-refresh'] !== true && (status === 401 || status === 409 || status === 500)) {
      return await handleResponseError(error)
    } else if (error.code === 'ECONNABORTED') {
      return handleNetworkError(error)
    } else {
      return Promise.reject(error)
    }
  }
}

const handleResponseError = async (error: AxiosError<Response<unknown>>) => {
  const code = error.response?.data?.code ?? ''

  if (code === CUSTOM_CODE.MAINTENANCE) {
    deleteCookie(COOKIE_KEY.ACCESS_TOKEN)
    deleteCookie(COOKIE_KEY.REFRESH_TOKEN)
    // TODO: route to maintenance page
    return Promise.reject(error)
  } else if (code === CUSTOM_CODE.WRONG_CREDENTIAL || code === CUSTOM_CODE.EXPIRED) {
    await refreshToken(error)
  } else if (code === CUSTOM_CODE.NOT_ALLOWED || code === CUSTOM_CODE.WRONG_CHARACTER_NO) {
    if (code === CUSTOM_CODE.NOT_ALLOWED) {
      setDeviceId()
    }

    await handleRejectCaseError(error)
    return Promise.reject(error)
  } else {
    return Promise.reject(error)
  }
}

const handleRejectCaseError = async (error: AxiosError<Response<unknown>>) => {
  if (hasUnauthorizedFlag === false) {
    hasUnauthorizedFlag = true
    await refreshToken(error)
    return Promise.reject(error)
  }
  return Promise.reject(error)
}
const handleNetworkError = (error: AxiosError<Response<unknown>>) => {
  error.message = '인터넷 연결 혹은 서버연결이 원활하지 않습니다.<br>잠시 후 다시 시도해주세요'
  // TODO: handle network error
  return Promise.reject(error)
}
const refreshToken = async (error: AxiosError<Response<unknown>>) => {
  try {
    await refreshAccessToken()
    if (error.response) {
      error.response.config.headers['x-gm-access-token'] = getCookie(COOKIE_KEY.ACCESS_TOKEN)
      error.response.config.headers['x-fe-refresh'] = true
    }
  } catch (e) {
    const isExpired =
      (e as AxiosError<Response<unknown>>).response?.data?.code === CUSTOM_CODE.EXPIRED
    if (isExpired) {
      hasUnauthorizedFlag = true
      deleteCookie(COOKIE_KEY.ACCESS_TOKEN)
      deleteCookie(COOKIE_KEY.REFRESH_TOKEN)
      // TODO: route to signin page
      return Promise.reject(e)
    }

    await handleRejectCaseError(e as AxiosError<Response<unknown>>)

    return Promise.reject(e)
  }
}
