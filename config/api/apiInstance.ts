import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { failedResponseHandler } from './apiFailedResponseHandler'

export interface Response<T> {
  code: string
  data: T
  traceId: string
  message?: string
  fallback?: string
}

export const apiInstance = axios.create({
  baseURL: '/',
  timeout: 10000,
})

apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // TODO: DiffieHellman 암호화 헤더 처리
    // if (config.url) {
    //   const [, url] = config.url.split('api/')

    //   if (ENCRYPT_API_URL_LIST.includes(url || '')) {
    //     await decryption.initDefinitionKey()
    //     decryption.generateMasterSharingKey()

    //     config.headers['x-gm-enc-key'] = decryption.masterSharingKey
    //     config.headers['x-gm-enc-version'] = decryption.version
    //   }
    // }
    return Promise.resolve(config)
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

apiInstance.interceptors.response.use(
  async (response) => {
    // TODO: DiffieHellman 암호화 헤더 처리
    // if ('x-gm-enc-key' in response.headers) {
    //   decryption.generateDecryptedKey(response.headers['x-gm-enc-key'] as string)
    //   const result = await decryption.getDecryptedData({ binaryBase64Data: response.data.data })
    //   response.data.data = JSON.parse(result)
    // }
    return response
  },
  (error: AxiosError<Response<unknown>>) => {
    console.error('[http] [response.use]', error)

    if (error.message?.indexOf('timeout') > -1) {
      // TODO: handle timeout
      // route to error page?
    }

    return failedResponseHandler(error)
      .then(() => error.response?.config && apiInstance(error.response?.config))
      .catch((error) => Promise.reject(error))
  },
)

export default apiInstance
