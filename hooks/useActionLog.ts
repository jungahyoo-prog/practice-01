'use client'

import { useCallback, useEffect } from 'react'
import { actionLogger, type ActionLogParams, type UserInfo } from '@/utils/actionLogger'

/**
 * Action Log 전송을 위한 React Hook
 *
 * @example
 * const { sendLog, setUser } = useActionLog()
 *
 * // 버튼 클릭 시
 * const handleClick = () => {
 *   sendLog({
 *     pageId: '/home',
 *     categoryId: '/main',
 *     actionId: 'click_button',
 *   })
 * }
 */
export function useActionLog() {
  /**
   * Action Log 전송
   */
  const sendLog = useCallback((params: ActionLogParams) => {
    actionLogger.send(params)
  }, [])

  /**
   * 사용자 정보 설정
   */
  const setUser = useCallback((info: UserInfo) => {
    actionLogger.setUserInfo(info)
  }, [])

  /**
   * 사용자 정보 초기화
   */
  const clearUser = useCallback(() => {
    actionLogger.clearUserInfo()
  }, [])

  return {
    sendLog,
    setUser,
    clearUser,
  }
}

/**
 * 페이지 진입 로그를 자동으로 전송하는 Hook
 *
 * @example
 * // 컴포넌트 마운트 시 자동으로 페이지 진입 로그 전송
 * usePageEnterLog('/home', '/main')
 */
export function usePageEnterLog(
  pageId: string,
  categoryId: string,
  body?: ActionLogParams['body'],
) {
  useEffect(() => {
    actionLogger.send({
      pageId,
      categoryId,
      actionId: 'enter',
      body,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- body는 의존성에서 제외 (변경 시 재전송 방지)
  }, [pageId, categoryId])
}

/**
 * 페이지 진입 로그 전송 (useEffect 내에서 직접 사용)
 *
 * @example
 * useEffect(() => {
 *   sendPageEnterLog('/home', '/main')
 * }, [])
 */
export function sendPageEnterLog(
  pageId: string,
  categoryId: string,
  body?: ActionLogParams['body'],
) {
  actionLogger.send({
    pageId,
    categoryId,
    actionId: 'enter',
    body,
  })
}

/**
 * 클릭 로그 전송
 *
 * @example
 * <button onClick={() => sendClickLog('/home', '/main', 'start_button')}>
 *   시작하기
 * </button>
 */
export function sendClickLog(
  pageId: string,
  categoryId: string,
  actionId: string,
  body?: ActionLogParams['body'],
) {
  actionLogger.send({
    pageId,
    categoryId,
    actionId,
    body,
  })
}

/**
 * Action Logger 설정
 *
 * @example
 * // 앱 초기화 시 호출
 * configureActionLogger({
 *   appName: 'MY_APP',
 *   debug: process.env.NODE_ENV === 'development',
 * })
 */
export function configureActionLogger(options: {
  appName?: string
  useProxy?: boolean
  debug?: boolean
}) {
  actionLogger.configure(options)
}
