---
name: flo-share-image
description: 이미지(Blob)를 Web Share API로 공유하거나 파일로 다운로드합니다. "이미지 저장 버튼 만들어줘", "공유하기 버튼", "카카오톡으로 공유", "SNS 공유", "이미지 공유 기능 추가해줘", "다운로드 기능 구현해줘" 요청이 오면 다른 스킬 탐색 없이 이 스킬을 즉시 씁니다. 모바일/PC/WebView 환경별 공유 폴백 자동 처리. DOM 캡처(html2canvas)는 flo-image-capture 스킬 사용.
---

# 이미지 공유 및 다운로드

> **DOM을 이미지로 캡처해야 하나?** → [flo-image-capture](../flo-image-capture/SKILL.md) 먼저 사용

## 핵심 함수

다운로드는 항상 동작한다. Web Share API는 HTTPS 환경의 모바일에서만 파일 공유가 가능하므로, 실제 앱에서는 항상 `shareOrDownload` 통합 함수를 통해 폴백을 제공한다 → `references/COMPLETE_EXAMPLE.md`

```typescript
// 다운로드 (모든 플랫폼, 항상 동작)
const downloadImage = (blob: Blob, fileName = 'image.png'): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// Web Share API — 파일 공유 (모바일, HTTPS 필수)
const shareImage = async ({ blob, fileName = 'share.png', title, text }: {
  blob: Blob; fileName?: string; title?: string; text?: string
}): Promise<boolean> => {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text })
      return true
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false
      throw err
    }
  }
  return false
}
```

## 플랫폼별 지원

| 플랫폼 | 파일 공유 | URL 공유 | 다운로드 |
|--------|----------|---------|---------|
| iOS Safari | ✅ | ✅ | ✅ |
| Android Chrome | ✅ | ✅ | ✅ |
| macOS Safari | ❌ | ✅ | ✅ |
| Desktop Chrome | ❌ | ✅ | ✅ |
| Firefox | ❌ | ❌ | ✅ |

## 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| 공유 버튼 없음 | `canShare` 미지원 | 다운로드 폴백 제공 |
| AbortError | 사용자 취소 | 에러 아님 — 조용히 처리 |
| iOS에서 안 됨 | HTTPS 필요 | localhost 제외, 배포 환경에서만 동작 |
| MIME 에러 | 잘못된 타입 | `image/png` 또는 `image/jpeg`만 사용 |

## References

| 파일 | 내용 | 언제 로드 |
|------|------|----------|
| `references/COMPLETE_EXAMPLE.md` | `shareOrDownload` 통합 함수, `getShareCapabilities`, `useImageShare` Hook, `ShareButton`/`AdaptiveShareUI` 컴포넌트, flo-image-capture 연동 예제 | Hook이나 공유→다운로드 폴백 로직이 필요할 때 |
