# 예제: attach-logs 워크플로우

## 입력

사용자가 로그 정의 테이블의 스크린샷/이미지를 붙여넣습니다.

## Step 1: 추출된 로그 테이블 (이미지로부터)

| seq | page_id | category_id | action_id | label |
|-----|---------|------------|-----------|-------|
| 1 | /promotion/cms/flog_lucky | /phase1 | (empty) | trace_refer |
| 2 | /promotion/cms/flog_lucky | (empty) | click_start | - |
| 3 | /promotion/cms/flog_lucky | /phase2 | (empty) | trace_refer |
| 4 | /promotion/cms/flog_lucky | (empty) | play | - |
| 5 | /promotion/cms/flog_lucky | (empty) | share_result | - |
| 6 | /promotion/cms/flog_lucky | /share_page | share_x | - |
| 7 | /promotion/cms/flog_lucky | /share_page | share_kt | - |
| 8 | /promotion/cms/flog_lucky | /share_page | copy_link | - |

## Step 2: 추출된 Mixpanel 테이블

| seq | event_name | event_properties |
|-----|-----------|-----------------|
| 1 | view_page_flog_lucky_P1 | character_no |
| 3 | view_page_flog_lucky_P2 | character_no |

## Step 3: 컴포넌트 매핑 (버튼/요소 텍스트 기준)

| seq | action | 매칭된 컴포넌트 | 매칭된 요소 | 매칭 이유 |
|-----|--------|-------------------|-----------------|--------------|
| 1 | /phase1 view | Intro.tsx | 컴포넌트 마운트 | Log Definition의 P1 화면 |
| 2 | click_start | Intro.tsx | `<button>` with `alt="운세 확인하기"` | 시작 버튼 텍스트 |
| 3 | /phase2 view | Result.tsx | 컴포넌트 마운트 | Log Definition의 P3 화면 |
| 4 | play | Result.tsx | `<button className="play-icon-btn">` | 재생 버튼 |
| 5 | share_result | Result.tsx | `<button className="result-share-btn-card">` | 공유 버튼 |
| 6 | share_x | - | - | **미구현** (X 공유 버튼 없음) |
| 7 | share_kt | - | - | **미구현** (KT 공유 버튼 없음) |
| 8 | copy_link | Result.tsx | handleShare 내 클립보드 복사 | 링크 복사 액션 |

## Step 4: 코드 변경

### 페이지 뷰 로그 (useEffect 패턴)

```tsx
// 변경 전
const Intro = ({ onStart }: { onStart: () => void }) => {
    return ( ... );
};

// 변경 후
import { useEffect } from 'react'
import { logAction, logMixpanel } from '../utils/logger'

const Intro = ({ onStart }: { onStart: () => void }) => {
    useEffect(() => {
        // seq 1: P1 화면 진입
        logAction({ categoryId: '/phase1', label: 'trace_refer' })
        logMixpanel({ eventName: 'view_page_flog_lucky_P1', properties: { character_no: '' } })
    }, [])
    return ( ... );
};
```

### 클릭 액션 로그 (핸들러 래퍼 패턴)

**중요: 액션 성공 후 로그**

```tsx
// 변경 전 — 직접 prop 호출
<button onClick={onStart}>

// 변경 후 — 로그 핸들러로 래핑 (액션 먼저, 그 다음 로그)
const handleStart = () => {
    onStart()
    // seq 2: 시작 버튼 클릭
    logAction({ actionId: 'click_start' })
}
<button onClick={handleStart}>
```

### 기존 핸들러 확장 패턴

**중요: 비동기 액션 성공 후 로그**

```tsx
// 변경 전 — 기존 핸들러
const handleShare = async () => {
    await navigator.clipboard.writeText(url)
    alert('링크가 복사되었습니다!')
}
<button onClick={handleShare}>

// 변경 후 — 비동기 액션 성공 후 로그
const handleShareAndCopy = async () => {
    await navigator.clipboard.writeText(url)
    // seq 5: 결과 공유 버튼 클릭
    logAction({ actionId: 'share_result' })
    // seq 8: 링크 복사
    logAction({ categoryId: '/share_page', actionId: 'copy_link' })
    alert('링크가 복사되었습니다!')
}
<button onClick={handleShareAndCopy}>
```

## Step 5: 최종 보고

### 구현 완료
- seq 1: phase1 page view → `Intro.tsx` 마운트
- seq 2: click_start → `Intro.tsx` "운세 확인하기" 버튼
- seq 3: phase2 page view → `Result.tsx` 마운트
- seq 4: play → `Result.tsx` 재생 버튼
- seq 5: share_result → `Result.tsx` 공유 버튼
- seq 8: copy_link → `Result.tsx` 클립보드 복사

### 미구현 (매칭되는 UI 요소 없음)
- seq 6: share_x — X 공유 버튼 없음
- seq 7: share_kt — KT 공유 버튼 없음
