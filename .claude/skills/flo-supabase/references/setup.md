# Supabase 환경 설정 가이드

DB 작업 전 아래 Step을 순서대로 진행한다.

---

## Step 0. 앱 환경변수 확인

`.env.local`을 읽어 아래 두 값이 **실제 값**으로 설정되어 있는지 확인한다:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`.env.local`이 없거나 값이 플레이스홀더 상태면 아래 템플릿으로 즉시 생성한다:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Supabase CLI (서버 전용 — git에 올리지 마세요)
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
```

생성 후 아래 안내를 출력한다:

---

**.env.local 파일을 생성했습니다. 아래 안내에 따라 4개 값을 채워주세요.**

아직 Supabase 프로젝트가 없다면 먼저 만들어야 합니다:

**① Supabase 프로젝트 만들기** (이미 있으면 건너뛰기)

1. https://supabase.com → 로그인 → **"New Project"** 클릭
2. 프로젝트 이름 입력, 지역: **Northeast Asia (Seoul)** 선택
3. **"Create new project"** 클릭 → 1~2분 대기

**② `NEXT_PUBLIC_SUPABASE_URL` 값 가져오기**

대시보드 → **Project Settings (⚙️)** → **API** 탭 → **Project URL** 복사

예: `https://abcdefghij.supabase.co`

**③ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 값 가져오기**

같은 API 탭 → **Publishable** 키 복사 (`sb_publishable_`로 시작하는 것)

> ⚠️ `anon` 키나 `service_role` 키가 아닌 **Publishable** 키를 사용한다.

**④ `SUPABASE_ACCESS_TOKEN` 값 가져오기**

https://supabase.com/dashboard/account/tokens → **"Generate new token"** → 복사

> 이 값은 Claude가 CLI로 DB에 접근할 때만 사용한다. 절대 git에 올리지 않는다.

**⑤ `SUPABASE_PROJECT_REF` 값 가져오기**

대시보드 URL `https://supabase.com/dashboard/project/[여기]`에서 **[여기]** 부분만 복사

예: `abcdefghij` (20자 내외 영문+숫자)

---

4개를 모두 채운 뒤 **"완료했어요"** 라고 알려주세요. 사용자가 완료를 알리기 전까지 Step 1 이후로 진행하지 않는다.

4개 값이 모두 설정되어 있고 개발 서버가 실행 중이면 재시작을 안내한다:

```
개발 서버를 재시작해주세요: Ctrl+C → npm run dev
```

> `next.config.mjs`의 CSP는 `NEXT_PUBLIC_SUPABASE_URL` 유무에 따라 Supabase 도메인을 자동으로 허용/차단한다. 환경변수는 서버 시작 시점에 읽히므로 추가 후 반드시 재시작해야 한다.

---

## Step 1. Supabase CLI 설치 확인

```bash
supabase --version
```

미설치 시 OS에 맞게 설치한다:

| OS | 설치 명령 |
|----|----------|
| macOS | `brew install supabase/tap/supabase` |
| Windows | `winget install Supabase.CLI` |
| Linux | `brew install supabase/tap/supabase` |

---

## Step 2. CLI 인증 & 프로젝트 연결

`.env.local`에서 아래 두 값을 확인한다:

```
SUPABASE_ACCESS_TOKEN=...
SUPABASE_PROJECT_REF=...
```

**형식 검증:**
- `SUPABASE_PROJECT_REF` 값에 `https://` 또는 `.supabase.co`가 포함되어 있으면 잘못된 값
  - ❌ `https://yiuarnpcjgmjdopfejki.supabase.co`
  - ✅ `yiuarnpcjgmjdopfejki`
- `NEXT_PUBLIC_SUPABASE_URL`의 project ID와 `SUPABASE_PROJECT_REF`가 일치해야 한다

값 확인 후 자동 실행:

```bash
supabase login --token <SUPABASE_ACCESS_TOKEN>
supabase link --project-ref <SUPABASE_PROJECT_REF>
```

---

## Step 3. supabase/ 폴더 초기화

`supabase/config.toml`이 없으면 실행:

```bash
supabase init
```

---

## Step 4. db/ 레이어 확인 및 생성

`db/client.ts`가 없으면 아래 내용으로 자동 생성:

```typescript
// db/client.ts — 수정 금지
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

`db/types/database.ts`가 없으면 타입 생성:

```bash
# db/types/ 폴더가 없으면 먼저 생성
mkdir -p db/types
supabase gen types typescript --linked > db/types/database.ts
```

**`supabase gen types` 실패 시:**
- `supabase link` 연결이 안 된 경우 → Step 2 재확인
- DB에 테이블이 없는 경우 → 마이그레이션 후 재실행
