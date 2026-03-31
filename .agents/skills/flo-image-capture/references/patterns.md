# Image Capture 고급 패턴

---

## CORS 처리 (외부 CDN 이미지)

`background-image`의 외부 URL은 CORS로 실패한다. 캡처 전에 `<img>` 태그로 임시 교체한다.

```typescript
const handleBackgroundImages = async (container: HTMLElement) => {
  const bgElements = container.querySelectorAll('[style*="background-image"]')
  const cleanups: Array<() => void> = []

  for (const el of Array.from(bgElements)) {
    const htmlEl = el as HTMLElement
    const match = htmlEl.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/)
    if (!match?.[1]?.startsWith('http')) continue

    const proxyUrl = process.env.NODE_ENV === 'development'
      ? `/api/cdn-proxy${match[1].replace(/^https?:\/\/[^/]+/, '')}`
      : `https://corsproxy.io/?${encodeURIComponent(match[1])}`

    const response = await fetch(proxyUrl)
    const blobUrl = URL.createObjectURL(await response.blob())

    const img = document.createElement('img')
    img.src = blobUrl
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;'

    const originalBg = htmlEl.style.backgroundImage
    htmlEl.style.backgroundImage = 'none'
    htmlEl.insertBefore(img, htmlEl.firstChild)

    cleanups.push(() => {
      htmlEl.removeChild(img)
      htmlEl.style.backgroundImage = originalBg
      URL.revokeObjectURL(blobUrl)
    })
  }

  return cleanups
}
```

**Next.js API Route 프록시** (`app/api/cdn-proxy/[...path]/route.ts`):

```typescript
export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const res = await fetch(`https://cdn.example.com/${params.path.join('/')}`)
  return new Response(await res.blob(), {
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'image/png' }
  })
}
```

---

## Ellipsis 렌더링 처리

html2canvas는 CSS `text-overflow: ellipsis`를 지원하지 않는다. 이진 탐색으로 실제 "..." 문자를 삽입하고 캡처 후 복원한다.

```typescript
const handleTextEllipsis = (container: HTMLElement) => {
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
```

---

## 통합 캡처 함수 (CORS + Ellipsis 함께 처리)

```typescript
const captureWithFixes = async (element: HTMLElement): Promise<Blob> => {
  const corsCleanups = await handleBackgroundImages(element)
  const restoreEllipsis = handleTextEllipsis(element)

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png')
    })
  } finally {
    corsCleanups.forEach((fn) => fn())
    restoreEllipsis()
  }
}
```

---

## React Hook

```typescript
import { useRef, useState, useCallback } from 'react'

const useImageCapture = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const capture = useCallback(async (): Promise<Blob> => {
    if (!ref.current) throw new Error('캡처 대상 없음')
    setIsCapturing(true)
    try {
      return await captureWithFixes(ref.current)
    } finally {
      setIsCapturing(false)
    }
  }, [])

  return { ref, capture, isCapturing }
}
```

---

## Tailwind CSS Preflight 충돌 → html-to-image 대안

Tailwind Preflight의 `img { display: block }` 때문에 캡처 레이아웃이 깨지는 경우 `html-to-image` 라이브러리를 사용한다.

```bash
npm install html-to-image
```

```typescript
import { toBlob } from 'html-to-image'

const captureToBlob = async (element: HTMLElement): Promise<Blob> => {
  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
    filter: (node: HTMLElement) => !node.classList?.contains('no-capture'),
  })
  if (!blob) throw new Error('캡처 실패')
  return blob
}
```

---

## Android / iOS 분기 처리

Android WebView는 `download` 속성과 `navigator.share()` File 공유가 모두 제한된다.

```typescript
import { isAOS, isIOS } from '@/utils/navigation'

const handleSave = async (element: HTMLElement) => {
  const blob = await captureToBlob(element)

  if (isAOS()) {
    // Android: 이미지 모달로 보여주고 스크린 캡처 유도
    const url = URL.createObjectURL(blob)
    setModalImageUrl(url)
    setShowImageModal(true)
    return
  }

  if (isIOS()) {
    // iOS Safari: Base64로 변환 후 다운로드
    const reader = new FileReader()
    reader.onloadend = () => {
      const link = document.createElement('a')
      link.href = reader.result as string
      link.download = 'result.png'
      link.click()
    }
    reader.readAsDataURL(blob)
    return
  }

  // PC / Mobile Web: 일반 다운로드
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'result.png'
  link.click()
  URL.revokeObjectURL(url)
}
```
