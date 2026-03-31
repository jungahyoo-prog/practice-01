---
name: flo-supabase
description: 'Supabase, 데이터베이스, SQL, 데이터 영속성과 관련된 모든 작업에 사용한다. 데이터를 저장하거나 불러오는 기능, 테이블 생성, 마이그레이션, RLS 설정, 실시간 구독, 파일 스토리지가 필요할 때 즉시 로드한다. 랭킹/점수/방명록/댓글/투표/예약/좋아요/조회수 등 사용자 데이터가 유지되어야 하는 모든 기능, supabase CLI, realtime, storage 요청에도 사용한다. 데이터 관련 기능을 구현하려 한다면 망설이지 말고 이 스킬을 먼저 로드할 것.'
---

# Supabase Skill

## 이 프로젝트의 Supabase 원칙

**CSR 전용**: 이 프로젝트는 `output: 'export'`로 서버 런타임이 없다. Supabase 클라이언트는 브라우저에서 직접 호출한다. `@supabase/ssr`, `createServerClient`, Server Actions는 빌드 단계에서 에러를 낸다.

**CLI 마이그레이션**: 테이블/스키마 변경은 Supabase CLI로만 진행한다. Dashboard SQL Editor는 이력이 남지 않아 AI 협업 환경에서 현재 스키마 상태를 추론할 수 없게 만든다.

`.env.local` 파일을 읽어 아래 4개 값이 **실제 값**으로 설정되어 있는지 확인합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_PROJECT_REF=<project-id>
SUPABASE_ACCESS_TOKEN=sbp_...
```

4개 모두 실제 값이면 → **Step 0 전체를 건너뛰고** 개발 서버 재시작 안내 후 Step 1로 진행.
하나라도 없거나 빈 값이면 → **누락된 항목에 해당하는 스텝부터** 순서대로 진행한다.

> **핵심 규칙: 한 스텝에 하나만 안내한다.**
> 여러 스텝의 안내를 한 번에 출력하지 않는다. 사용자가 현재 스텝에 응답한 뒤 다음 스텝을 안내한다.

---

#### Step 0-A: Supabase 프로젝트 생성 안내

`NEXT_PUBLIC_SUPABASE_URL`이 없거나 빈 값일 때만 실행.

아래 안내를 **그대로 출력한다. 요약·생략 절대 금지.**

---

데이터를 저장하려면 Supabase 프로젝트가 필요합니다.

**Supabase 프로젝트 만들기** (이미 있으면 "있어요"라고 알려주세요)

1. https://supabase.com → 로그인 → **"New Project"** 클릭
2. 프로젝트 이름 입력, 지역: **Northeast Asia (Seoul)** 선택
3. **"Create new project"** 클릭 → 1~2분 대기

> 잘 모르겠으면 가이드 위키를 참고하세요: https://music-flo.atlassian.net/wiki/spaces/FEBusiness/pages/4707483863/Supabase

준비되면 알려주세요!

---

> ⚠️ 사용자가 응답하기 전까지 Step 0-B로 진행하지 않는다.

---

#### Step 0-B: Project URL 받기

사용자가 프로젝트가 있다고 하면, 아래를 **그대로 출력한다.**

---

Supabase 대시보드에서 **Project URL**을 알려주세요.

**찾는 방법:** 프로젝트 대시보드 → 상단 **프로젝트 이름** 하위에 있는 **URL 복사**

예: `https://abcdefghij.supabase.co`

이 값은 공개되어도 안전하므로 **여기 대화창에 그대로 붙여넣기** 하면 됩니다.

---

사용자가 URL을 제공하면:

1. 형식 검증: `https://` 로 시작하고 `.supabase.co`로 끝나는지 확인
2. URL에서 Project ID(= `SUPABASE_PROJECT_REF`)를 자동 추출 (예: `https://abcdefghij.supabase.co` → `abcdefghij`)
3. `.env.local`에 아래 값을 **AI가 직접 작성**한다 (`Write` 또는 `Edit` 도구 사용). 파일이 없으면 새로 생성하고, 있으면 누락된 키만 추가한다:
   - `NEXT_PUBLIC_SUPABASE_URL=<사용자가 제공한 URL>`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` (빈 값 — Step 0-C에서 채움)
   - `SUPABASE_PROJECT_REF=<추출한 Project ID>`
   - `SUPABASE_ACCESS_TOKEN=` (빈 값 — Step 0-D에서 사용자가 직접 입력)
4. "저장했습니다"를 알리고 **바로 Step 0-C를 안내한다** (사용자 응답을 기다리지 않음).

> ⚠️ Step 0-C 이후의 스텝은 출력하지 않는다.

---

#### Step 0-C: Publishable Key 받기

아래를 **그대로 출력한다.**

---

이번엔 **Publishable Key**를 알려주세요.

**찾는 방법:** 프로젝트 좌측 메뉴 → **Project Settings** → **API Keys** → **Project API key** 복사

예: `sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

> ⚠️ `anon` 키나 `service_role` 키가 아닌 반드시 **Publishable** 키(`sb_publishable_`로 시작)를 사용하세요.

이 값도 공개되어도 안전하므로 **여기 대화창에 그대로 붙여넣기** 하면 됩니다.

---

사용자가 키를 제공하면:

1. 형식 검증: `sb_publishable_`로 시작하는지 확인
2. `.env.local`에 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<사용자가 제공한 키>`를 **AI가 직접 작성**한다
3. "저장했습니다"를 알리고 **바로 Step 0-D를 안내한다** (사용자 응답을 기다리지 않음).

> ⚠️ Step 0-D 이후의 스텝은 출력하지 않는다.

---

#### Step 0-D: Personal Access Token (PAT) 안내

> 🚨 **이 스텝은 반드시 가장 마지막에 안내한다.**

아래를 **그대로 출력한다. 요약·생략 절대 금지.**

---

마지막으로 **Personal Access Token (PAT)** 을 설정해야 합니다.

> 🚨 **PAT는 비밀 키입니다. 절대로 이 대화창에 붙여넣지 마세요.**
> 반드시 `.env.local` 파일을 직접 열어서 입력해야 합니다.

**이전에 발급한 PAT가 있는 경우:**

이전에 만든 다른 프로젝트의 `.env.local` 파일을 열어서 `SUPABASE_ACCESS_TOKEN=` 값을 복사해 오세요. 모든 프로젝트에서 동일한 토큰을 재사용할 수 있습니다.

**처음이라 PAT가 없는 경우:**

1. https://supabase.com/dashboard/account/tokens 접속
2. **"Generate new token"** 클릭
3. 토큰 이름은 **본인 회사 영어 닉네임** 입력 (예: `john`, `hazel`)
4. 생성된 토큰 복사 (이 화면을 벗어나면 다시 볼 수 없으니 꼭 복사하세요)

**입력 방법:**

1. 이 프로젝트의 `.env.local` 파일을 에디터에서 연다
2. `SUPABASE_ACCESS_TOKEN=` 뒤에 복사한 토큰을 붙여넣고 저장

> - **토큰 분실·만료 시**: https://supabase.com/dashboard/account/tokens 에서 기존 토큰 삭제 → "Generate new token" → 동일 닉네임으로 재발급
> - 이 값은 AI Agent가 CLI로 DB에 접근할 때만 사용합니다. 절대 git에 올리지 마세요.

입력 완료 후 **"완료했어요"** 라고 알려주세요.

---

> ⚠️ 사용자가 완료를 알리기 전까지 Step 1 이후로 진행하지 않는다.

---

#### Step 0-E: 최종 확인

사용자가 완료를 알리면:

1. `.env.local`을 읽어 4개 값이 모두 실제 값으로 설정되어 있는지 확인한다.
2. 누락된 값이 있으면 해당 스텝을 다시 안내한다.
3. 4개 모두 확인되면, 개발 서버가 실행 중인 경우 재시작을 안내한다:

```
개발 서버를 재시작해주세요: Ctrl+C → npm run dev
```

> **이유**: `next.config.mjs`의 `Content-Security-Policy`는 `NEXT_PUBLIC_SUPABASE_URL` 유무에 따라
> Supabase 도메인(`*.supabase.co`, `wss://*.supabase.co` 등)을 자동으로 허용합니다.
> 환경변수는 서버 시작 시점에 읽히므로 추가 후 반드시 재시작해야 반영됩니다.

재시작 확인 후 Step 1로 진행합니다.

---

### Step 1. Supabase CLI 설치 확인

`supabase --version` 으로 설치 여부를 확인합니다.

미설치 시 OS를 자동 감지해 설치합니다:

| OS      | 설치 명령                            |
| ------- | ------------------------------------ |
| macOS   | `brew install supabase/tap/supabase` |
| Windows | `winget install Supabase.CLI`        |
| Linux   | `brew install supabase/tap/supabase` |

---

### Step 2. .env.local 인증 정보 확인

`.env.local`에 아래 두 값이 **실제 값**으로 설정되어 있는지 확인합니다.

```
SUPABASE_ACCESS_TOKEN=...     # CLI 로그인용 (비공개 — NEXT_PUBLIC_ 없음)
SUPABASE_PROJECT_REF=...      # 프로젝트 연결용
```

플레이스홀더(`your-token-here` 등)가 있으면 **미설정**으로 간주합니다.

**SUPABASE_ACCESS_TOKEN 없을 때:**

```
https://supabase.com/dashboard/account/tokens 접속
→ 본인 이름(영어 닉네임)으로 된 토큰이 이미 있으면 그 값을 복사하세요.
→ 없거나 분실·만료된 경우: 기존 토큰 삭제 후 "Generate new token" → 토큰 이름은 본인 회사 영어 닉네임으로 입력 (예: john, hazel) → 복사
→ .env.local에 SUPABASE_ACCESS_TOKEN=값 으로 추가해주세요.
```

**SUPABASE_PROJECT_REF 없거나 형식이 잘못된 경우:**

```
Supabase 대시보드 URL https://[이 부분].supabase.co 에서
'이 부분'(영문+숫자, 20자 내외)만 복사해 .env.local에 추가해주세요.

❌ 잘못된 예: SUPABASE_PROJECT_REF=https://yiuarnpcjgmjdopfejki.supabase.co
✅ 올바른 예: SUPABASE_PROJECT_REF=yiuarnpcjgmjdopfejki
```

> **형식 검증**: `SUPABASE_PROJECT_REF` 값에 `https://` 또는 `.supabase.co`가 포함되어 있으면 잘못된 값입니다. 사용자에게 수정을 요청하고 진행을 중단합니다.

**`NEXT_PUBLIC_SUPABASE_URL` 형식 검증:**

> 값이 `https://`로 시작하고 `.supabase.co`로 끝나야 합니다.
> `SUPABASE_PROJECT_REF`와 URL의 project ID 부분이 일치하는지 확인합니다.

두 값 확인 후 자동 실행:

```bash
supabase login --token <SUPABASE_ACCESS_TOKEN>
supabase link --project-ref <SUPABASE_PROJECT_REF>
```

> ⚠️ `SUPABASE_ACCESS_TOKEN`과 `SUPABASE_PROJECT_REF`는 서버 전용 시크릿입니다.
> `.env.local`이 `.gitignore`에 포함되어 있는지 반드시 확인하세요.

---

### Step 3. supabase/ 폴더 초기화 확인

`supabase/config.toml`이 없으면 자동 실행:

```bash
supabase init
```

---

### Step 4. db/ 레이어 확인

`db/client.ts`가 없으면 아래 내용으로 자동 생성:

```typescript
// db/client.ts — 수정 금지
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)
```

`db/types/database.ts`가 없으면 아래 명령으로 생성:

```bash
supabase gen types typescript --linked > db/types/database.ts
```

**`supabase gen types` 실패 시:**

- `supabase link` 연결이 안 된 경우 → Step 2 재확인
- `db/types/` 폴더가 없으면 먼저 생성 후 재실행

---

### Step 5. 앱 환경변수 확인

`.env.local`에 아래 값이 설정되어 있는지 확인합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

미설정 시 → **Step 0의 3단계**를 참고하세요.
(대시보드 → Project Settings ⚙️ → API 탭 → Project URL & Publishable key 복사)

---

## 가드레일

데이터 손실은 되돌릴 수 없다. 아래 구분에 따라 작업한다.

### 사용자 확인 필수

```
DROP TABLE / DROP SCHEMA
DELETE (WHERE 없음)
UPDATE (WHERE 없음)
DISABLE ROW LEVEL SECURITY
TRUNCATE
SUPABASE_ACCESS_TOKEN 코드 하드코딩
```

확인 예시: "이 작업은 되돌릴 수 없습니다. 백업이 있나요? 계속할까요?"

### 미리보기 후 실행 (SQL 보여주고 1회 확인)

컬럼 삭제/타입 변경, 마이그레이션 실행, RLS 정책 변경/삭제, 외래 키 제약 삭제

### 확인 없이 즉시 실행 가능

새 테이블/컬럼/인덱스 추가, RLS 정책 신규 추가, 코드 파일 생성, 타입 재생성

---

## 작업 흐름

### 시작

1. `supabase/migrations/`에서 현재 테이블 구조 파악
2. `db/` 폴더에서 기존 구현 확인
3. 중복 테이블/컬럼이 있으면 사용자에게 알리고 새 이름 제안

   ```
   db/
   ├── client.ts          # supabase 클라이언트 (수정 금지)
   ├── types/
   │   └── database.ts    # supabase gen types 산출물 (수정 금지)
   └── eventClicks.ts     # ← 테이블별 CRUD 함수 여기에 작성
   ```

   ```typescript
   // db/eventClicks.ts — 올바른 패턴
   import { supabase } from './client'
   import type { Database } from './types/database'

   type EventClickRow = Database['public']['Tables']['event_clicks']['Row']
   type EventClickInsert = Database['public']['Tables']['event_clicks']['Insert']

   export const getEventClickCount = async (): Promise<number> => {
     const { count, error } = await supabase
       .from('event_clicks')
       .select('*', { count: 'exact', head: true })
     if (error) throw error
     return count ?? 0
   }

   export const insertEventClick = async (sessionId: string): Promise<void> => {
     const { error } = await supabase
       .from('event_clicks')
       .insert({ session_id: sessionId } satisfies EventClickInsert)
     if (error) throw error
   }
   ```

   컴포넌트/페이지에서는 이 함수만 import해서 사용:

   ```typescript
   // components/EventCounter.tsx — 올바른 패턴
   import { getEventClickCount, insertEventClick } from '@/db/eventClicks'
   ```

### 실행 전

1. **미리보기 제공**: 마이그레이션 SQL 파일 내용을 코드 블록으로 먼저 보여준다.
2. **영향 범위 설명**: "이 SQL을 실행하면 어떤 일이 일어나는지" 간단히 설명한다.
3. **위험 작업 경고**: 데이터 손실 가능성이 있으면 명확히 경고한다.

### 실행 후

1. **결과 확인**: `supabase db push` 성공/실패 여부를 사용자에게 알린다.
2. **다음 단계 안내**: 테이블 생성 후 → RLS 확인 → 타입 재생성 → 코드 생성 순서로 안내한다.
3. **타입 재생성**: 스키마 변경 후 자동으로 실행:
   ```bash
   supabase gen types typescript --linked > db/types/database.ts
   ```
4. **에러 발생 시 흔한 케이스:**

   | 에러                                                                            | 원인                         | 조치                                    |
   | ------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------- |
   | `relation already exists`                                                       | 테이블이 이미 존재           | 사용자에게 알리고 새 이름으로 생성 제안 |
   | `permission denied`                                                             | RLS 정책 누락                | SELECT 정책 추가                        |
   | `invalid input syntax for type uuid`                                            | UUID 형식 오류               | `gen_random_uuid()` 기본값 확인         |
   | `supabase: not linked`                                                          | `supabase link` 미실행       | Step 2 재실행                           |
   | `gen types` 빈 파일 생성                                                        | 테이블이 없거나 링크 오류    | `supabase db push` 후 재실행            |
   | `Invalid token` / `Unauthorized` / `token is expired` / `authentication failed` | `SUPABASE_ACCESS_TOKEN` 만료 | 아래 **PAT 만료 처리** 절차 따르기      |

   **PAT 만료 처리 절차:**

   CLI 실행 중 인증 오류(`Invalid token`, `Unauthorized`, `expired`, `authentication failed` 등)가 발생하면 즉시 중단하고 아래 안내 전문을 그대로 출력한다. 요약·생략 절대 금지.

   ***

   **Supabase Access Token이 만료되었습니다. 새 토큰을 발급해주세요.**

   **① 기존 토큰 삭제 후 재발급**

   https://supabase.com/dashboard/account/tokens → 목록에서 **본인 이름으로 된 토큰 삭제** → **"Generate new token"** → 토큰 이름은 **본인 회사 영어 닉네임**으로 입력 (예: `john`, `hazel`) → 복사

   **② `.env.local` 업데이트**

   ```
   SUPABASE_ACCESS_TOKEN=새로_발급받은_토큰
   ```

   **③ 완료 후 "토큰 갱신 완료"라고 알려주세요.** 이후 작업을 이어서 진행하겠습니다.

   ***

   > ⚠️ 사용자가 완료를 알리기 전까지 작업을 재개하지 않는다.

   완료 알림을 받으면 `.env.local`에서 새 토큰 값을 읽어 다음 명령으로 재인증한 뒤 중단된 작업을 이어서 진행한다:

   ```bash
   supabase login --token <새_SUPABASE_ACCESS_TOKEN>
   supabase link --project-ref <SUPABASE_PROJECT_REF>
   ```

---

## 마이그레이션 파일 작성 원칙

```sql
-- Migration: create_[tablename]_table
CREATE TABLE IF NOT EXISTS public.[tablename] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS는 신규 테이블 생성 즉시 활성화
-- 비활성 상태로 배포하면 인증 없이 모든 데이터가 공개된다
ALTER TABLE public.[tablename] ENABLE ROW LEVEL SECURITY;
```

- `IF NOT EXISTS` 항상 명시 (재실행 안전성)
- 직접 트랜잭션 제어(`BEGIN/COMMIT`) 금지
- CRUD 패턴 및 db/ 레이어 코드 예시 → `references/crud.md`

### 실행 후

```bash
supabase db push
supabase gen types typescript --linked > db/types/database.ts
```

스키마 변경 후 항상 타입을 재생성한다. 타입 불일치는 런타임에서 조용히 실패하는 버그를 만든다.

---

## 자주 발생하는 에러

| 에러                      | 원인                       | 조치                   |
| ------------------------- | -------------------------- | ---------------------- |
| `relation already exists` | 테이블 이미 존재           | 새 이름 제안           |
| `permission denied`       | RLS 정책 누락              | SELECT 정책 추가       |
| `supabase: not linked`    | link 미실행                | setup.md Step 2 재실행 |
| `gen types` 빈 파일       | 테이블 없음 또는 링크 오류 | `db push` 후 재실행    |

---

## References

| 파일                                     | 내용                                       | 언제 로드                          |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------- |
| `references/setup.md`                    | 환경변수 설정, CLI 초기화, db/ 레이어 생성 | 체크리스트 항목 미충족 시          |
| `references/crud.md`                     | CRUD 패턴, db/ 레이어 코드 예시            | 테이블 조회/삽입/수정/삭제 구현 시 |
| `references/rls.md`                      | RLS 정책 패턴                              | 권한 설정이 필요할 때              |
| `references/realtime.md`                 | 실시간 구독 패턴                           | 실시간 기능 구현 시                |
| `references/storage.md`                  | 파일 스토리지 패턴                         | 파일 업로드/다운로드 시            |
| `references/postgrest-query-patterns.md` | 고급 쿼리 패턴                             | 복잡한 필터/조인/집계 필요 시      |
