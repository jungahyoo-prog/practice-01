export type FloEnv = 'dev' | 'qa' | 'prod'

// NEXT_PUBLIC_APP_ENV는 서버와 클라이언트 모두에서 사용 가능
export const FLO_ENV: FloEnv = (process.env.NEXT_PUBLIC_FLO_ENV as FloEnv) ?? 'dev'

const API_BASE_URL_MAP: Record<FloEnv, string> = {
  dev: 'https://api.dev.music-flo.com',
  qa: 'https://api.qa.music-flo.com',
  prod: 'https://api.music-flo.com',
}
export const FLO_API_BASE_URL = API_BASE_URL_MAP[FLO_ENV]
