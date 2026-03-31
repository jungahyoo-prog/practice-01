# 전체 구현 예제

> 목차: [유틸리티](#유틸리티) | [Hook](#hook) | [컴포넌트](#컴포넌트) | [사용 예시](#사용-예시) | [프록시 설정](#프록시-설정)

## 유틸리티

### utils/imageCapture.ts

```typescript
import html2canvas from 'html2canvas'

type CleanupFn = () => void

/**
 * background-image CORS 문제 해결
 */
export const handleBackgroundImages = async (container: HTMLElement): Promise<CleanupFn[]> => {
  const cleanups: CleanupFn[] = []

  for (const el of Array.from(container.querySelectorAll('[style*="background-image"]'))) {
    const htmlEl = el as HTMLElement
    const match = htmlEl.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/)
    if (!match?.[1]?.startsWith('http')) continue

    try {
      const proxyUrl = process.env.NODE_ENV === 'development'
        ? `/api/cdn-proxy${match[1].replace(/^https?:\/\/[^/]+/, '')}`
        : `https://corsproxy.io/?${encodeURIComponent(match[1])}`

      const blobUrl = URL.createObjectURL(await (await fetch(proxyUrl)).blob())
      const img = document.createElement('img')
      img.src = blobUrl
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:0;'

      const originalBg = htmlEl.style.backgroundImage
      htmlEl.style.backgroundImage = 'none'
      htmlEl.insertBefore(img, htmlEl.firstChild)

      cleanups.push(() => {
        htmlEl.contains(img) && htmlEl.removeChild(img)
        htmlEl.style.backgroundImage = originalBg
        URL.revokeObjectURL(blobUrl)
      })
    } catch (err) {
      console.error('배경 이미지 처리 실패:', err)
    }
  }

  return cleanups
}

/**
 * text-overflow ellipsis 처리
 */
export const handleTextEllipsis = (container: HTMLElement): CleanupFn => {
  const restores: Array<{ el: HTMLElement; text: string }> = []

  container.querySelectorAll('*').forEach((el) => {
    const style = window.getComputedStyle(el)
    if (style.textOverflow !== 'ellipsis' || style.overflow !== 'hidden') return

    const htmlEl = el as HTMLElement
    const original = htmlEl.textContent || ''
    if (htmlEl.scrollWidth <= htmlEl.clientWidth) return

    let low = 0, high = original.length, best = original
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      htmlEl.textContent = original.slice(0, mid) + '...'
      if (htmlEl.scrollWidth > htmlEl.clientWidth) high = mid - 1
      else { best = htmlEl.textContent; low = mid + 1 }
    }

    htmlEl.textContent = best
    restores.push({ el: htmlEl, text: original })
  })

  return () => restores.forEach(({ el, text }) => { el.textContent = text })
}

/**
 * CORS + Ellipsis 처리 후 캡처
 */
export const captureWithFixes = async (
  element: HTMLElement,
  options: { scale?: number; backgroundColor?: string } = {}
): Promise<Blob> => {
  const corsCleanups = await handleBackgroundImages(element)
  const restoreEllipsis = handleTextEllipsis(element)

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: options.backgroundColor ?? '#ffffff',
      scale: options.scale ?? 2,
      useCORS: true,
      logging: false,
    })

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Blob 생성 실패')), 'image/png')
    })
  } finally {
    corsCleanups.forEach((fn) => fn())
    restoreEllipsis()
  }
}
```

## Hook

### hooks/useImageCapture.ts

```typescript
'use client'

import { useRef, useState, useCallback } from 'react'
import { captureWithFixes } from '../utils/imageCapture'

interface Options {
  scale?: number
  backgroundColor?: string
}

export const useImageCapture = <T extends HTMLElement = HTMLDivElement>(options: Options = {}) => {
  const ref = useRef<T>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const capture = useCallback(async (): Promise<Blob> => {
    if (!ref.current) throw new Error('캡처 대상 없음')

    setIsCapturing(true)
    setError(null)

    try {
      return await captureWithFixes(ref.current, options)
    } catch (err) {
      const e = err instanceof Error ? err : new Error('캡처 실패')
      setError(e)
      throw e
    } finally {
      setIsCapturing(false)
    }
  }, [options])

  return { ref, capture, isCapturing, error }
}
```

## 컴포넌트

### components/Capturable.tsx

```typescript
'use client'

import { useImageCapture } from '../hooks/useImageCapture'

interface Props {
  children: React.ReactNode
  onCapture?: (blob: Blob) => void
  buttonLabel?: string
  scale?: number
}

export const Capturable = ({ children, onCapture, buttonLabel = '캡처', scale = 2 }: Props) => {
  const { ref, capture, isCapturing, error } = useImageCapture<HTMLDivElement>({ scale })

  const handleClick = async () => {
    try {
      const blob = await capture()
      onCapture?.(blob)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div ref={ref}>{children}</div>
      <button onClick={handleClick} disabled={isCapturing}>
        {isCapturing ? '캡처 중...' : buttonLabel}
      </button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  )
}
```

## 사용 예시

```typescript
'use client'

import { Capturable } from '../components/Capturable'
import { downloadImage } from '../utils/imageShare' // flo-share-image

export default function Page() {
  return (
    <Capturable
      onCapture={(blob) => downloadImage(blob, 'my-card.png')}
      buttonLabel="이미지로 저장"
      scale={3}
    >
      <div className="card" style={{ padding: 20, background: '#f0f0f0' }}>
        <h1>캡처될 콘텐츠</h1>
        <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: 200 }}>
          이 텍스트는 잘릴 수 있지만 캡처에서는 올바르게 표시됩니다...
        </p>
      </div>
    </Capturable>
  )
}
```

## 프록시 설정

### Next.js API Route (app/api/cdn-proxy/[...path]/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: { path: string[] } }) {
  const cdnUrl = `https://cdn.example.com/${params.path.join('/')}`
  const res = await fetch(cdnUrl)

  return new NextResponse(await res.blob(), {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
```

### Vite 설정 (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api/cdn-proxy': {
        target: 'https://cdn.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cdn-proxy/, ''),
      },
    },
  },
})
```
