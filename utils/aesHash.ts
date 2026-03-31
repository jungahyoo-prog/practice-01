/**
 * AES-128-CBC 기반 해시 생성 (FLO 서버 로직과 동일)
 *
 * Go 서버의 createHashWithAES 함수를 JavaScript로 구현
 * - MD5로 키 생성 (plaintext의 MD5 해시 16바이트)
 * - IV는 키와 동일
 * - AES-128-CBC 암호화
 * - PKCS5 패딩
 * - Base64 인코딩
 */

import CryptoJS from 'crypto-js'

/**
 * PKCS5 패딩 적용 (AES block size: 16바이트)
 */
function pkcs5Padding(data: CryptoJS.lib.WordArray, blockSize: number): CryptoJS.lib.WordArray {
  const paddingLength = blockSize - (data.sigBytes % blockSize)
  const paddingWord =
    (paddingLength << 24) | (paddingLength << 16) | (paddingLength << 8) | paddingLength
  const paddingWords = []

  for (let i = 0; i < paddingLength; i += 4) {
    paddingWords.push(paddingWord)
  }

  const padding = CryptoJS.lib.WordArray.create(paddingWords, paddingLength)
  return data.concat(padding)
}

/**
 * AES-128-CBC 해시 생성 (FLO 서버 로직과 동일)
 *
 * @param plainText - 암호화할 평문
 * @returns Base64 인코딩된 암호문
 */
export function createHashWithAES(plainText: string): string {
  if (!plainText) {
    return ''
  }

  try {
    const md5Hash = CryptoJS.MD5(plainText)
    const key = md5Hash
    const iv = md5Hash

    const plainTextWordArray = CryptoJS.enc.Utf8.parse(plainText)
    const paddedPlainText = pkcs5Padding(plainTextWordArray, 16)

    const encrypted = CryptoJS.AES.encrypt(paddedPlainText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.NoPadding,
    })

    return encrypted.ciphertext.toString(CryptoJS.enc.Base64)
  } catch (error) {
    console.error('[aesHash] Failed to create hash:', error)
    return ''
  }
}

/**
 * 테스트 함수 (개발 환경 전용)
 */
export function testAESHash(input: string): void {
  console.group('🔐 AES Hash Test')
  console.log('Input:', input)
  console.log('Input length:', input.length)

  const hash = createHashWithAES(input)
  console.log('Output (Base64):', hash)
  console.log('Output length:', hash.length)

  console.groupEnd()
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).testAESHash = testAESHash
}
