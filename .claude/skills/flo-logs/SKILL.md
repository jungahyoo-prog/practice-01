---
name: flo-logs
description: >
  로그 추가, 로그 붙여줘, logging 해줘, 이벤트 추적 요청이 오면 즉시 이 스킬을 사용한다.
  로그 테이블(텍스트 표 또는 이미지)을 파싱하여 React 컴포넌트에 FLO 액션 로그와
  Mixpanel 이벤트를 추가한다. "/flo-logs", 로그 테이블 텍스트 복붙, 이미지 첨부와
  함께 로그 요청이 올 때도 트리거한다.
---

# flo-logs

로그 정의 테이블을 파싱하여 React 컴포넌트에 로그를 붙인다.

## 입력 형식

**텍스트 표** — 탭(`\t`) 또는 다중 공백 구분. `-`·빈 문자열 → null.

```
Seq    page_id    category_id    action_id    label(body)
1      /promotion/test    -          -          trace_refer
2      /promotion/test    /intro     click_start    -
```

**이미지** — 테이블 구조를 인식해 동일하게 파싱.

## 모드 판단

`utils/floLog.ts`를 읽는다.

- **비어있거나 TODO만 있음** → Setup 모드: `logAction`/`logMixpanel` 객체를 새로 생성
- **이미 함수가 있음** → Add 모드: 기존 함수 보존, 새 이벤트만 추가

## 워크플로우

### 1단계 · 파싱 후 확인

파싱 결과를 표로 출력하고 "맞나요?" 확인을 받는다.
category_id가 `/`로 시작하지 않으면 자동 보정 후 알린다.

### 2단계 · 컴포넌트 매칭

`app/` 디렉터리를 탐색한다. 버튼 텍스트·className·핸들러명 등 **내부 텍스트를 기준**으로 매칭한다. 시각적 디자인만으로는 매칭하지 않는다.

- 화면 흐름으로 페이지·상태 머신 식별
- action_id 의미로 보조 추론 (`click_start` → 시작 버튼, `play` → 재생 버튼)

### 3단계 · 로깅 적용

코드 삽입 패턴은 `references/patterns.md` 참고.

- 페이지 뷰(action_id 없음, label=trace_refer) → `useEffect(callback, [])` 안에 삽입
- 클릭 액션 → 액션 성공 후 로그. 직접 호출보다 핸들러 래핑을 선호
- 모든 로그 호출 위에 `// seq N: 설명` 주석 추가
- logger는 클라이언트 전용 → `'use client'` 컴포넌트에서만 import

### 4단계 · 결과 보고

```
## 구현 완료
- seq 1: trace_refer → IntroPage.tsx useEffect
- seq 2: click_start → IntroPage.tsx 시작 버튼

## 미구현
- seq 3: share_result — 공유 버튼 없음
```

## 핵심 규칙

- import 경로는 `@/utils/floLog` (상대 경로 사용 금지)
- `// seq N: 설명` 주석 위치: 로그 호출 바로 위
- `useEffect` 의존성: 페이지 뷰 `[]`, 데이터 의존 `[prop]`
- Mixpanel seq가 Action Log seq와 같으면 같은 위치에서 함께 호출
- `body.trace_refer`는 항상 `document.referrer`
- category_id는 항상 `/`로 시작

## References

- [references/patterns.md](references/patterns.md) — floLog.ts 템플릿, 페이지 뷰·클릭 패턴 코드
- [references/action-log-api.md](references/action-log-api.md) — actionLogger API 시그니처, 환경별 엔드포인트, Request Body 구조
- [references/example-workflow.md](references/example-workflow.md) — 실제 프로젝트 적용 예시 (이미지 파싱 → 컴포넌트 매핑 → 코드 변경 → 보고)
