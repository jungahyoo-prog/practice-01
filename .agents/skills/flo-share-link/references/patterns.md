# 링크 공유 — 고급 패턴

## React Hook (useShareLink)

상태 관리가 필요한 경우 훅으로 분리한다. `isSharing`과 `lastResult`를 통해 버튼 UI를 제어할 수 있다.

```typescript
import { useState, useCallback } from 'react'
import { isAppWebView } from '@/utils/navigation'

interface ShareLinkOptions {
  title?: string
  text?: string
  url?: string
}

type ShareResult = 'shared' | 'copied' | 'failed' | 'cancelled'

const shareLink = async (options: ShareLinkOptions = {}): Promise<ShareResult> => {
  const shareUrl = options.url ?? window.location.href
  const shareTitle = options.title ?? document.title

  if (navigator.share && !isAppWebView()) {
    try {
      await navigator.share({ title: shareTitle, text: options.text, url: shareUrl })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export const useShareLink = (defaultOptions: ShareLinkOptions = {}) => {
  const [isSharing, setIsSharing] = useState(false)
  const [lastResult, setLastResult] = useState<ShareResult | null>(null)

  const share = useCallback(async (overrides: ShareLinkOptions = {}) => {
    setIsSharing(true)
    try {
      const result = await shareLink({ ...defaultOptions, ...overrides })
      setLastResult(result)

      // 성공 상태는 2초 후 자동 리셋
      if (result === 'copied' || result === 'shared') {
        setTimeout(() => setLastResult(null), 2000)
      }

      return result
    } finally {
      setIsSharing(false)
    }
  }, [defaultOptions])

  return { share, isSharing, lastResult }
}
```

## 컴포넌트 예제 (ShareButton)

```tsx
'use client'

import { useShareLink } from '@/hooks/useShareLink'
import { Button } from '@/components/ui/Button'

export default function ShareButton() {
  const { share, isSharing, lastResult } = useShareLink({
    title: '페이지 공유',
  })

  const handleClick = async () => {
    const result = await share()
    if (result === 'failed') {
      alert('공유에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const label =
    lastResult === 'copied' ? '링크 복사됨!' :
    lastResult === 'shared' ? '공유 완료!' :
    '공유하기'

  return (
    <Button onClick={handleClick} disabled={isSharing}>
      {label}
    </Button>
  )
}
```

## 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| Android WebView에서 공유 안 됨 | WebView는 Web Share API 미지원 | `isAppWebView()` 분기 후 클립보드 복사 |
| 클립보드 복사 실패 | HTTP 환경 또는 WebView 권한 제한 | HTTPS 확인, 실패 시 `alert`으로 URL 직접 안내 |
| AbortError 발생 | 사용자가 공유 시트를 닫음 | 에러 아님, 무시 처리 |
| PC에서 공유 시트 안 뜸 | 데스크톱 브라우저 대부분 미지원 | 클립보드 복사로 자동 폴백 — 정상 동작 |
| share() 후 아무 반응 없음 | iOS에서 HTTPS가 아닌 경우 | HTTPS 환경에서 테스트 |
