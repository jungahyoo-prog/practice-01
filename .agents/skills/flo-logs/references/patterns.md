# 코드 패턴 레퍼런스

## floLog.ts 기본 템플릿

Action Log와 Mixpanel을 하나의 파일로 관리한다. `PAGE_ID`는 프로젝트에 맞게 수정.

```typescript
// utils/floLog.ts
import { actionLogger } from '@/utils/actionLogger'
import { trackEvent } from '@/utils/mixpanel'

const PAGE_ID = '/promotion/cms/PROJECT_NAME'

export const logAction = {
  pageEnter() {
    actionLogger.send({
      pageId: PAGE_ID,
      categoryId: '/main',
      actionId: '',
      body: { trace_refer: document.referrer },
    })
  },
  clickButton() {
    actionLogger.send({
      pageId: PAGE_ID,
      categoryId: '/main',
      actionId: 'click_button',
    })
  },
}

export const logMixpanel = {
  pageView(pageName: string) {
    trackEvent('view_page_PROJECT_NAME', { page_name: pageName })
  },
  buttonClick(btnName: string) {
    trackEvent('select_btn_page_PROJECT_NAME', { btn_name: btnName })
  },
}
```

## 페이지 뷰 로깅 (useEffect 패턴)

마운트 시 한 번만 실행되어야 하므로 deps는 `[]`.

```tsx
'use client'
import { useEffect } from 'react'
import { logAction, logMixpanel } from '@/utils/floLog'

export default function IntroPage() {
  useEffect(() => {
    // seq 1: 화면 진입
    logAction.pageEnter()
    logMixpanel.pageView('main')
  }, [])

  return <div>...</div>
}
```

## 클릭 액션 로깅

액션이 성공한 뒤에 로그를 찍는다. 기존 핸들러가 없으면 새로 만들어 래핑한다.

```tsx
import { logAction } from '@/utils/floLog'

// 동기 액션
const handleStart = () => {
  onStart()
  // seq 2: 시작 버튼 클릭
  logAction.clickStart()
}

// 비동기 액션
const handleShare = async () => {
  await navigator.clipboard.writeText(url)
  // seq 5: 결과 공유 버튼 클릭
  logAction.shareResult()
}
```

## 컴포넌트에서 import

```tsx
import { logAction, logMixpanel } from '@/utils/floLog'
```

상대 경로(`../utils/floLog`, `../lib/logger` 등)는 사용하지 않는다.
