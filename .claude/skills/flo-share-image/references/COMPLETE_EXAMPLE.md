# 전체 구현 예제

> 목차: [유틸리티](#유틸리티) | [Hook](#hook) | [컴포넌트](#컴포넌트) | [캡처와 통합](#캡처와-통합)

## 유틸리티

### utils/imageShare.ts

```typescript
/**
 * 이미지 다운로드
 */
export const downloadImage = (blob: Blob, fileName = 'image.png'): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * 브라우저 공유 기능 확인
 */
export const getShareCapabilities = () => {
  const testFile = new File([''], 'test.png', { type: 'image/png' })
  const hasShareApi = 'share' in navigator
  const canShareFiles = 'canShare' in navigator && navigator.canShare({ files: [testFile] })

  return {
    canShareFiles,                           // 모바일 파일 공유
    canShareUrl: hasShareApi && !canShareFiles,  // URL만 공유
    downloadOnly: !hasShareApi,              // 다운로드만
  }
}

export type ShareResult = 'shared' | 'url-shared' | 'downloaded' | 'cancelled'

interface ShareOptions {
  blob: Blob
  fileName?: string
  title?: string
  text?: string
  fallbackUrl?: string
}

/**
 * 공유 시도 → 실패 시 다운로드 폴백
 */
export const shareOrDownload = async ({
  blob,
  fileName = 'image.png',
  title = '공유',
  text = '',
  fallbackUrl,
}: ShareOptions): Promise<ShareResult> => {
  const file = new File([blob], fileName, { type: 'image/png' })

  // 1. 파일 공유 (모바일)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled'
    }
  }

  // 2. URL 공유 (데스크톱)
  if (navigator.share && fallbackUrl) {
    try {
      await navigator.share({ title, text, url: fallbackUrl })
      return 'url-shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled'
    }
  }

  // 3. 다운로드 폴백
  downloadImage(blob, fileName)
  return 'downloaded'
}

/**
 * 파일 공유만 (다운로드 폴백 없음)
 */
export const shareImage = async ({
  blob,
  fileName = 'share.png',
  title,
  text,
}: Omit<ShareOptions, 'fallbackUrl'>): Promise<boolean> => {
  const file = new File([blob], fileName, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text })
      return true
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('공유 실패:', err)
    }
  }
  return false
}
```

## Hook

### hooks/useImageShare.ts

```typescript
'use client'

import { useState, useCallback, useMemo } from 'react'
import { shareOrDownload, downloadImage, getShareCapabilities, ShareResult } from '../utils/imageShare'

interface Options {
  fileName?: string
  title?: string
  text?: string
}

export const useImageShare = (options: Options = {}) => {
  const [isSharing, setIsSharing] = useState(false)
  const [lastResult, setLastResult] = useState<ShareResult | null>(null)
  const capabilities = useMemo(() => getShareCapabilities(), [])

  const share = useCallback(async (blob: Blob): Promise<ShareResult> => {
    setIsSharing(true)
    try {
      const result = await shareOrDownload({
        blob,
        fileName: options.fileName,
        title: options.title,
        text: options.text,
        fallbackUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      })
      setLastResult(result)
      return result
    } finally {
      setIsSharing(false)
    }
  }, [options])

  const download = useCallback((blob: Blob) => {
    downloadImage(blob, options.fileName)
    setLastResult('downloaded')
  }, [options.fileName])

  return { share, download, isSharing, lastResult, capabilities }
}
```

## 컴포넌트

### components/ShareButton.tsx

```typescript
'use client'

import { useState } from 'react'
import { useImageShare } from '../hooks/useImageShare'

interface Props {
  getBlob: () => Promise<Blob>
  fileName?: string
  title?: string
  text?: string
  children?: React.ReactNode
}

export const ShareButton = ({ getBlob, fileName, title, text, children }: Props) => {
  const [error, setError] = useState<string | null>(null)
  const { share, isSharing, capabilities } = useImageShare({ fileName, title, text })

  const handleClick = async () => {
    setError(null)
    try {
      const blob = await getBlob()
      await share(blob)
    } catch (err) {
      setError('공유 실패')
      console.error(err)
    }
  }

  const label = isSharing ? '공유 중...'
    : capabilities.canShareFiles ? '📤 공유하기'
    : capabilities.canShareUrl ? '🔗 공유하기'
    : '💾 저장하기'

  return (
    <div>
      <button onClick={handleClick} disabled={isSharing}>
        {children ?? label}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

### components/AdaptiveShareUI.tsx

```typescript
'use client'

import { getShareCapabilities, shareOrDownload, downloadImage } from '../utils/imageShare'

interface Props {
  blob: Blob
  fileName?: string
}

export const AdaptiveShareUI = ({ blob, fileName = 'image.png' }: Props) => {
  const caps = getShareCapabilities()

  if (caps.canShareFiles) {
    return (
      <button onClick={() => shareOrDownload({ blob, fileName })}>
        📤 친구에게 공유
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {caps.canShareUrl && (
        <button onClick={() => shareOrDownload({ blob, fileName, fallbackUrl: location.href })}>
          🔗 링크 공유
        </button>
      )}
      <button onClick={() => downloadImage(blob, fileName)}>
        💾 저장
      </button>
    </div>
  )
}
```

## 캡처와 통합

flo-image-capture와 함께 사용하는 예시:

```typescript
'use client'

import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { ShareButton } from '../components/ShareButton'

export default function CaptureAndSharePage() {
  const targetRef = useRef<HTMLDivElement>(null)

  const captureToBlob = useCallback(async (): Promise<Blob> => {
    if (!targetRef.current) throw new Error('대상 없음')

    const canvas = await html2canvas(targetRef.current, { scale: 2, useCORS: true })
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Blob 실패')), 'image/png')
    })
  }, [])

  return (
    <div>
      <div ref={targetRef} style={{ padding: 20, background: '#f0f0f0' }}>
        <h1>공유할 콘텐츠</h1>
        <p>이 영역이 이미지로 캡처되어 공유됩니다.</p>
      </div>

      <ShareButton
        getBlob={captureToBlob}
        fileName="my-card.png"
        title="내 카드 공유"
        text="이 카드를 확인해보세요!"
      />
    </div>
  )
}
```
