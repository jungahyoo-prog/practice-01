# Next.js CSR Starter (Vibe Project)

Next.js 15 App Router + TypeScript + Tailwind CSS + Zustand + Mixpanel
`output: 'export'` (CSR 전용 정적 빌드) | WebView 연동 포함 (환경변수로 활성화)

> **⚠️ 이 프로젝트는 순수 CSR 정적 빌드입니다.**
> Next.js 서버 기능(Server Component, Route Handler, SSR, ISR, Middleware)은 사용하지 않습니다.
> 데이터 패칭은 클라이언트에서 직접 Supabase SDK 또는 외부 API를 호출하는 방식만 허용됩니다.

> **⚠️ 이 프로젝트는 배포 시 AI 실험실 앱의 하위 라우트로 서비스됩니다.**
> `basePath`가 URL prefix를 처리하므로, 앱 내부 라우팅은 항상 `/`를 시작점으로 설계합니다.
> 예: 메인 화면 → `/`, 상세 화면 → `/detail`, `/[id]` 등. `/sub/main` 같은 네임스페이스 중첩 불필요.

---

## 주요 파일

| 파일                             | 역할                                               |
| -------------------------------- | -------------------------------------------------- |
| `components/WebviewProvider.tsx` | WebView 초기화 — URL params → 쿠키 저장, 토큰 검증 |
| `store/memberStore.ts`           | 회원 상태 — actionLogger 자동 동기화               |
| `types/window.d.ts`              | App Scheme 콜백 타입                               |
| `utils/webview.ts`               | WebView 초기화, App Scheme 통신                    |
| `utils/navigation.ts`            | 디바이스 환경 감지 (앱/웹 분기)                    |
| `utils/floLog.ts`                | 통합 로그 인터페이스 (프로젝트별 수정 필요)        |
| `utils/actionLogger.ts`          | Action Log 전송 엔진                               |

---

## Agentic Vibe Coding Workflow

### 온보딩 스킬 — `/flo-start`

> **비어있는 레포에서 처음 시작할 때** 사용하는 스킬. `.claude/skills/flo-start/SKILL.md` 참조.

`_docs/PRD.md`가 비어있거나 placeholder 상태일 때 자동으로 트리거한다.
티키타카 방식으로 사용자의 아이디어를 끌어내어 PRD를 함께 작성하고,
Supabase 필요 여부 확인, `/flo-plan` 연계까지 온보딩 전 과정을 커버한다.

**트리거 키워드:** "뭐부터 해", "어떻게 시작해", "처음인데", "PRD 없어", "막막해", `/flo-start`

---

### Session Start — 필수 프로토콜 (매 세션마다)

세션을 시작할 때 **반드시** 아래 순서를 따른다:

1. `.env.local` 읽기 → `NEXT_PUBLIC_SUPABASE_URL`이 실제 값으로 설정되어 있으면, 사용자에게 DB 사용 여부를 묻지 않고 `.claude/skills/flo-supabase/SKILL.md`의 세션 시작 체크리스트를 즉시 실행한다
2. `_docs/PRD.md` 읽기 → 기획 원문 파악
3. `_docs/TASKS.md` 읽기 → 현재 진행 상황 파악
4. 아래 형식으로 현황 보고:

```
📊 진행 현황: 완료 M / 전체 N (X%)

🔄 현재 작업 중: [FN] 기능명
   완료: M/N개 태스크

⏭ 다음 할 일: "서브태스크명"

무엇부터 시작할까요?
```

5. `_docs/TASKS.md`가 초기화되지 않은 경우 (파일이 비어있거나 placeholder 상태):
   - `_docs/PRD.md`를 읽고 `/vibe-plan` 로직을 즉시 실행하여 `_docs/TASKS.md`를 자동 생성한다
   - 생성 후 위 형식으로 현황 보고

### Feature Development Iteration

코드를 바로 작성하지 않는다. 기능 목록 / 구현 순서 / 예상 결과물을 정리 후 "이 순서로 진행할게요. 맞나요?"로 확인한 뒤 구현 시작.

### \_docs/TASKS.md 업데이트 규칙 (항상)

작업 중 **즉시** 업데이트한다:

| 상황            | 액션                       |
| --------------- | -------------------------- |
| 서브태스크 완료 | `[ ]` → `[x]` 변경         |
| 기능 전체 완료  | Status → `✅ 완료`         |
| 기능 시작       | Status → `🔄 진행 중`      |
| 진행 현황 표    | 완료/진행/예정 수 업데이트 |
| 모든 기능 완료  | 아래 완료 메시지 출력      |

**완료 시 메시지:**

```
🎉 모든 기능 구현 완료!

다음 단계를 진행할까요?
1. 배포 준비
```

### 새 기능 요청 시 (구현 전 필수)

사용자가 새 기능을 요청하면, 구현 **전에** 반드시:

1. `_docs/TASKS.md` 기능 목록 끝에 새 섹션 추가:
   - Status: `⏳ 예정`
   - 목표: 1문장 (사용자 관점)
   - 서브태스크: 3~7개
2. 진행 현황 표의 "전체 기능" 수 업데이트
3. 사용자에게 확인: "이렇게 추가할게요. 맞나요?" → 확인 후 구현

### 비개발자 안내 모드

이 프로젝트는 비개발자와 작업한다. 아래 상황에서 적극 안내한다.

| 상황                                | AI 행동                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 기능 단위 완성 또는 큰 코드 변경 후 | 커밋 권유 — "문제가 생기면 되돌릴 수 있도록 여기서 커밋해둘까요?"                                              |
| 위험한 작업                         | 영향도 경고 후 확인                                                                                            |
| 작업 완료                           | 검증 방법 안내 (어디서 뭘 확인하면 되는지)                                                                     |
| 에러/오류 발생                      | 에러 메시지 원문은 그대로 노출하지 않는다. 반드시 **"왜 이 에러가 났는지 → 해결책"** 순서로 한국어로 설명한다. |

---

## Rules

### MUST

- **Supabase/DB 관련 작업은 코드 한 줄 쓰기 전에 `flo-supabase` 스킬을 반드시 로드한다. 판단하지 않는다. 무조건.**
- import는 `@/` 경로 별칭 사용
- 의존성은 `npm install`로만 추가
- 외부 리소스(폰트, 이미지, 스크립트 등) 추가 시 `next.config.mjs`의 CSP 정책도 함께 업데이트
- `next.config.mjs`에 `output: 'export'`, `basePath`, `assetPrefix` 반드시 유지
- **모든 페이지 라우트는 루트 URL(`/`)부터 설계** — `basePath`가 배포 prefix를 처리하므로 앱 내부에서 경로를 중첩할 필요 없음. 메인 페이지는 반드시 `app/page.tsx` (`/`)
- **Typography는 반드시 `<Text>` 컴포넌트 또는 `typography` 토큰 사용** (`components/ui/Text.tsx`)
- **Button은 반드시 `<Button>` 컴포넌트 사용** (`components/ui/Button.tsx`)
- **Card 레이아웃은 반드시 `<Card>` 컴포넌트 사용** (`components/ui/Card.tsx`)
- **로딩 표시는 반드시 `<Spinner>` 컴포넌트 사용** (`components/ui/Spinner.tsx`)
- **SNS 공유 아이콘은 반드시 `<IconButtonPack>` 또는 `<IconButton>` 컴포넌트 사용** (`components/ui/IconButtonPack.tsx`)
- **닫기 버튼은 반드시 `<CloseButton>` 컴포넌트 사용** — 앱/웹 환경별 분기 로직 내장 (`components/ui/CloseButton.tsx`)
- **`NEXT_PUBLIC_*` 환경변수는 빌드 시점에 치환되므로 반드시 존재 여부 검증 후 사용**
- API 계층: `services/` → 순수 API 함수 / `utils/axiosClient.ts` → axios 인스턴스 / `hooks/` → useQuery·useMutation 훅
- 새 패키지 사용 / App Router 기능 / 복잡한 훅 조합 시 `/context7`으로 공식문서 먼저 확인

### MUST NOT

- **임의의 `.md` 파일 생성 금지** — 마이그레이션 가이드, 작업 계획서, 설계 문서 등 새 MD 파일을 자의적으로 만들지 않는다. 처음부터 존재하는 MD 파일(`_docs/PRD.md`, `_docs/TASKS.md` 등)만 수정한다.
- index.ts 배럴 파일 생성 금지
- **임의의 font-size, font-weight, line-height 직접 지정 금지**
- **정의되지 않은 Typography variant 사용 금지**
- `getServerSideProps`, API Routes (`pages/api/`, `app/api/`), ISR (`revalidate`), Middleware 사용 금지 → `output: 'export'`에서 빌드 단계 에러
- **`'use server'` 지시어, Server Component, Server Action 사용 금지** — 이 프로젝트는 서버 런타임 없음
- **`dark:` 접두사, `prefers-color-scheme: dark` 미디어 쿼리 사용 금지** — Samsung Browser 등이 기기 다크모드 설정을 강제 적용하는 것을 막기 위해 `color-scheme: only light`가 이미 설정되어 있음. 여기에 dark 스타일을 추가하면 충돌함

---

## WebView 아키텍처

> **이 섹션은 `.env.local`에 WebView 환경변수(`NEXT_PUBLIC_CRYPTO_SECRET_KEY`, `NEXT_PUBLIC_MIXPANEL_TOKEN`, `NEXT_PUBLIC_FLO_ENV`)를 설정한 경우에만 해당됩니다.**
> 환경변수가 없으면 WebView 관련 기능(인증, 로깅, Mixpanel)은 자동으로 비활성화됩니다.

### 초기화 흐름

```
App (URL params) → WebviewProvider → initWebview() → 쿠키 저장
                                   → initDeviceEnvironment() → 환경 분류
                                   → verifyToken() → memberStore 동기화
                                   → Mixpanel 식별
```

### Cookie 암호화

- `FLO_AUT` (Access Token) 과 `FLO_RFT` (Refresh Token)은 CryptoJS AES 암호화
- 키: `NEXT_PUBLIC_CRYPTO_SECRET_KEY` 환경변수 (fe-flo-web과 동일)
- `setCookie()` / `getCookie()`가 자동으로 암복호화 처리

### 환경 변수 (WebView 사용 시 필수)

| 변수                            | 용도                                                     |
| ------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_CRYPTO_SECRET_KEY` | 쿠키 AES 암호화 키 (없으면 암호화 skip)                  |
| `NEXT_PUBLIC_MIXPANEL_TOKEN`    | Mixpanel 프로젝트 토큰 (없으면 Mixpanel 비활성)          |
| `NEXT_PUBLIC_FLO_ENV`           | API 환경 (dev/qa/alpha/production, 없으면 프록시 비활성) |

---

## 데이터베이스 (Supabase)

> **🚫 하드 게이트 — 예외 없음**
>
> Supabase, DB, 데이터 저장, 테이블, 마이그레이션, RLS, 스토리지, 실시간, 랭킹/점수/댓글/투표/예약 등
> **데이터 영속성이 필요한 모든 작업은 코드를 한 줄도 쓰기 전에 `flo-supabase` 스킬을 로드한다.**
>
> "이 경우엔 안 해도 되겠지" 판단 금지. 의심스러우면 로드한다.

### 환경 변수 (Supabase 사용 시 필수)

| 변수                                   | 용도                                                |
| -------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable Key (공개 가능, anon key 아님) |

### Supabase 설정 확인 (세션 시작 시)

`.env.local`에 아래 두 값이 **실제 값**으로 있는지 확인한다.

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- **설정됨** → CLI 상태 확인 (`supabase --version`, `.env.local`에 `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF`)
- **미설정** → 새 프로젝트 생성 권고 먼저, 현 프로젝트 수동 설정은 차선책
  → 상세 안내: `.claude/skills/flo-supabase/SKILL.md` Step 0

### 주요 파일 (Supabase 사용 시)

| 파일                                   | 역할                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `.claude/skills/flo-supabase/SKILL.md` | **Supabase 작업 전 반드시 읽기** — CLI 체크리스트, 가드레일, CRUD 패턴 |
| `db/client.ts`                         | Supabase 클라이언트 싱글턴                                             |
| `db/types/database.ts`                 | DB 타입 정의 (`supabase gen types` 산출물)                             |
| `db/[tableName].ts`                    | 테이블별 CRUD 함수 — 컴포넌트에 직접 작성 금지                         |
| `supabase/migrations/`                 | CLI 마이그레이션 파일 (테이블 생성/수정 이력)                          |

### 핵심 원칙

- **RLS는 항상 활성화** — `DISABLE ROW LEVEL SECURITY` 금지
- **모든 DB 작업은 반드시 `flo-supabase` 스킬 사용** — 테이블 생성·스키마 변경·타입 생성 모두 해당
- **Supabase Dashboard SQL Editor 직접 실행 금지** — 마이그레이션 파일 생성 → `supabase db push` 방식만 허용
- **CLI 없이는 테이블 생성·스키마 변경 불가** — mock/임시 코드 대체 진행 금지
- `service_role` 키를 클라이언트 코드에 포함 금지

---

## FLO Design System (필수)

스타일링 시 `tailwind.config.js`와 `globals.css`에서 토큰을 확인하세요.

### 색상/토큰 사용 우선순위

1. **Semantic 토큰 우선** — `bg-surface`, `text-fg-*`, `border`, `shadow-*` 등
2. **Semantic에 없는 경우만 FLO Palette** — `blue-800`, `red-700`, `gray-*` 등
3. **Tailwind 기본값·임의 색상 금지** — `text-sm font-bold`, `bg-[#hex]`, `text-[#333]` 등

---

## 관리자 전용

**README.md를 수정했다면**, 작업 완료 후 반드시 사용자에게 아래를 안내할 것:

> Confluence 페이지도 함께 업데이트해야 합니다.
> https://music-flo.atlassian.net/wiki/spaces/FEBusiness/pages/4663541827/FLO+Vibe+Starter+-
