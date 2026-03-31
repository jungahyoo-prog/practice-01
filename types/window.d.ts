/**
 * FLO App Scheme 콜백을 위한 Window 확장 타입
 */
interface Window {
  flomusicCbSuccess?: (token: string) => void | Promise<void>
  flomusicCbFail?: (error: string) => void | Promise<void>
}
