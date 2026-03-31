---
name: flo-app-scheme
description: "FLO 앱 딥링크 스킴 코드를 생성합니다. 앱 내 화면 이동, 음악 재생, 로그인 이동, 웹뷰 호출, 외부 URL 열기 등 web↔앱 인터랙션이 필요한 모든 기능에 사용합니다. '스킴', '딥링크', 'deeplink', 'app scheme', '앱스킴', '화면이동', '앱으로 이동', '앱에서 재생', 'web-mobile 연동' 키워드가 나오면 즉시 이 스킬을 사용할 것. WebView 환경에서 앱 기능을 호출해야 할 때도 동일하게 적용된다."
---

# FLO App Scheme Helper

FLO 앱 딥링크 스킴 코드를 생성한다.

## 워크플로우

### 1. APP_SCHEME 상수 확인

```bash
grep -r "APP_SCHEME" --include="*.ts" --include="*.tsx" -l .
```

- 있으면 해당 파일에서 import해서 사용
- 없으면 `constants/app.ts`에 추가:

```typescript
export const APP_SCHEME = {
  BASE: 'flomusic',
} as const
```

### 2. 스킴 찾기

사용자가 원하는 화면/기능을 파악하고 `references/deeplink-spec.md`에서 매칭되는 스킴을 찾는다.

### 3. 코드 생성

```typescript
// 기본 패턴
window.location.href = `${APP_SCHEME.BASE}://{path}?{params}`

// 파라미터가 있으면 항상 URL 인코딩
window.location.href = `${APP_SCHEME.BASE}://view/fullWeb?url=${encodeURIComponent(url)}`
```

카테고리별 코드 예시 → `references/patterns.md` 참조

### 4. 코드 삽입

사용자가 지정한 파일에 삽입하거나 적절한 위치를 제안한다.

---

## 핵심 규칙

- `APP_SCHEME.BASE` 사용 — `'flomusic'` 문자열 하드코딩 금지 (상수가 변경될 수 있다)
- 파라미터 값은 항상 `encodeURIComponent()` — 한글, 특수문자, URL이 포함된 값은 반드시 인코딩
- `references/deeplink-spec.md`에 있는 스킴만 사용 — 레퍼런스에 없는 스킴은 만들어내지 않는다

---

## contentType 빠른 참조

`view/content?type=X&id=Y` 형식에서 사용하는 type 값:

| type | 설명 |
|------|------|
| CHNL | 일반 채널 |
| ALBUM | 앨범 |
| ARTIST | 아티스트 |
| CHART | 차트 |
| TRACK | 곡 상세 |
| GENRE | 장르 상세 |
| PLAYLIST | 플레이리스트 |
| CREATOR | 크리에이터 상세 |
| SITTN | 상황별 |
| MOOD | 분위기별 |
| MY_CHNL | 마이 채널 |
| CREATOR_PLAYLIST | 크리에이터 플레이리스트 |
| PRI_PLAYLIST | AI 추천 플레이리스트 |

> `view/content`의 `id`는 필수값. id가 불필요한 화면이라도 `id=0`을 전달한다.

---

## References

| 파일 | 내용 | 언제 로드 |
|------|------|----------|
| `references/deeplink-spec.md` | 전체 스킴 규격 및 파라미터 정의 | 스킴 찾을 때 |
| `references/patterns.md` | 카테고리별 TypeScript 코드 예시 | 코드 작성 시 |
