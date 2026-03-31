---
name: flo-share-link
description: 링크/URL 공유 기능을 즉시 구현합니다. "링크 공유", "URL 공유", "공유하기 버튼", "share 기능", "공유 버튼 추가해줘" 요청이 오면 다른 스킬 탐색 없이 이 스킬을 바로 씁니다. 이미지 공유는 flo-share-image 스킬을 사용합니다.
---

# FLO 링크 공유 (Share Link)

## 환경별 전략

FLO 앱 WebView는 `navigator.share()`를 지원하지 않는다. 공유 시트가 뜨지 않는 것이 버그가 아니라 WebView 자체의 제약이다. 그래서 WebView에서는 처음부터 클립보드 복사를 기본 전략으로 사용한다.

| 환경 | 1차 | 2차 폴백 |
|------|-----|---------|
| 모바일 브라우저 (Safari, Chrome) | `navigator.share()` | 클립보드 복사 |
| PC 브라우저 | `navigator.share()` (Chrome만) | 클립보드 복사 |
| FLO 앱 WebView (Android/iOS) | 클립보드 복사 | — |

## 핵심 구현 패턴

`shareLink` 함수 하나로 모든 환경을 처리한다. WebView 분기가 필요하면 `isAppWebView()`를 조합한다.

```typescript
import { isAppWebView } from '@/utils/navigation'

interface ShareLinkOptions {
  title?: string
  text?: string
  url?: string
}

const shareLink = async ({
  title,
  text,
  url,
}: ShareLinkOptions = {}): Promise<'shared' | 'copied' | 'failed' | 'cancelled'> => {
  const shareUrl = url ?? window.location.href
  const shareTitle = title ?? document.title

  // WebView는 navigator.share()를 지원하지 않아 바로 클립보드로
  if (navigator.share && !isAppWebView()) {
    try {
      await navigator.share({ title: shareTitle, text, url: shareUrl })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // share 실패 시 클립보드로 폴백
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  } catch {
    return 'failed'
  }
}
```

React Hook / ShareButton 컴포넌트 예제는 [references/patterns.md](./references/patterns.md)를 참고한다.

## 주의사항

- `navigator.clipboard`는 HTTPS 또는 localhost에서만 동작한다
- `AbortError`는 사용자가 공유 시트를 취소한 것이므로 에러 처리 불필요
- `isAppWebView()`는 프로젝트의 `@/utils/navigation`에 이미 구현되어 있다 — 직접 구현하지 않는다

## References

- [고급 패턴 (Hook / 컴포넌트 / 트러블슈팅)](./references/patterns.md)
- [이미지 공유가 필요한 경우](../flo-share-image/SKILL.md)
