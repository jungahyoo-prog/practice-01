/**
 * FLO App Scheme 콜백을 위한 Window 확장 타입
 */
interface Window {
  flomusicCbSuccess?: (token: string) => void | Promise<void>
  flomusicCbFail?: (error: string) => void | Promise<void>
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string
          scope: string
          callback: (response: { access_token?: string }) => void
          error_callback?: (error?: { type?: string }) => void
        }) => google.accounts.oauth2.TokenClient
        revoke: (token: string) => void
      }
    }
  }
}

declare namespace google {
  namespace accounts.oauth2 {
    type TokenClient = {
      requestAccessToken: (options?: { prompt?: '' | 'consent' }) => void
    }
  }
}
