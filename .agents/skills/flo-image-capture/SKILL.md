---
name: flo-image-capture
description: "DOM 요소를 고품질 PNG 이미지(Blob)로 캡처한다. '이 div를 이미지로', '카드를 PNG로 저장', 'DOM을 캡처', '이미지로 만들어줘', '스크린샷', 'html2canvas' 키워드가 나오면 이 스킬을 사용한다. CORS 문제, CSS ellipsis 렌더링 깨짐, Tailwind 레이아웃 충돌, Android/iOS WebView 다운로드 이슈가 발생했을 때도 이 스킬을 먼저 확인할 것. 캡처한 이미지를 공유하거나 다운로드하려면 flo-share-image 스킬과 함께 사용한다."
---

# DOM 이미지 캡처

DOM 요소를 html2canvas로 캡처해 Blob을 반환한다.

> 공유/다운로드가 필요하면 [flo-share-image](../flo-share-image/SKILL.md) 스킬과 함께 사용한다.

## 설치

```bash
npm install html2canvas
```

html2canvas는 클라이언트 전용 라이브러리다. 사용하는 컴포넌트에 `'use client'` 지시어가 있어야 한다.

## 기본 캡처

```typescript
'use client'
import html2canvas from 'html2canvas'

const captureToBlob = async (element: HTMLElement): Promise<Blob> => {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,        // 고해상도 (레티나)
    useCORS: true,   // CORS 이미지 허용
    logging: false,
  })
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}
```

## 알려진 문제와 해결책

| 문제 | 원인 | 해결 |
|------|------|------|
| 외부 CDN 이미지 CORS 에러 | `background-image` URL이 다른 도메인 | `references/patterns.md` — CORS 처리 |
| text-overflow ellipsis 안 보임 | html2canvas가 CSS ellipsis 미지원 | `references/patterns.md` — Ellipsis 처리 |
| Tailwind 적용 후 텍스트 밀림 | Preflight CSS 충돌 | `references/patterns.md` — html-to-image 대안 |
| Android에서 다운로드 안 됨 | WebView의 `download` 속성 미지원 | `references/patterns.md` — Android/iOS 분기 |
| iOS Safari Blob URL 실패 | Safari의 Blob URL 다운로드 제한 | `references/patterns.md` — Base64 변환 |
| 이미지 저품질 | scale 기본값 | scale 값 증가 (2 → 3) |

---

## References

| 파일 | 내용 | 언제 로드 |
|------|------|----------|
| `references/patterns.md` | CORS 처리, Ellipsis 처리, Hook, Tailwind 충돌, Android/iOS 분기 코드 | 고급 처리가 필요할 때 |
| `references/COMPLETE_EXAMPLE.md` | 모든 기능이 통합된 전체 구현 | 처음부터 완성된 코드가 필요할 때 |
