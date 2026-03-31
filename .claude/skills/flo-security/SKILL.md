---
name: flo-security
description: "프로젝트 코드가 생성형 AI Tool 안전 사용 가이드 체크리스트에 부합하는지 검사합니다. 하드코딩된 시크릿/API키/내부 IP 노출, .env 파일 gitignore 누락, 환경변수 방어 코드 미비, XSS 위험 코드 등을 탐지합니다. \"보안 점검\", \"security check\", \"취약점 확인\", \"민감정보 있어?\", \"env 잘 됐어?\", \"배포 전 점검\", \"보안 이슈 없어?\" 등 보안/안전성 관련 질문이나 배포 전 최종 확인 요청 시 사용합니다."
---

# AI Tool 안전 사용 가이드 - 코드 보안 점검 Skill

프로젝트 소스 코드를 `references/AI-TOOL-SECURITY.md` 가이드 기준으로 점검합니다.

## 실행 절차

### Step 1: 프로젝트 파일 스캔

아래 패턴에 해당하는 파일을 전체 프로젝트에서 검색합니다.

**검사 대상 파일:**

- `**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.jsx`
- `**/*.json` (package.json, tsconfig 등)
- `**/*.env*`, `**/.env*`
- `**/*.yaml`, `**/*.yml`
- `**/Dockerfile*`, `**/docker-compose*`
- `**/*.sh`
- `**/*.md` (README 등 문서)

**검사 제외:**

- `node_modules/`, `dist/`, `.next/`, `build/`
- `*.lock` 파일

### Step 2: 보안 위반 항목 검사

다음 카테고리별로 위반 사항을 검출합니다.

#### 2-1. 개인정보 노출 검사

- 하드코딩된 이메일 주소 (예시: `user@company.com`)
- 하드코딩된 전화번호 패턴 (예시: `010-1234-5678`, `02-1234-5678`)
- 하드코딩된 실명으로 보이는 한국어/영문 이름
- 주민등록번호, 생년월일 패턴
- **예외**: `example@example.com`, `test@test.com` 등 명백한 예시/테스트 값은 허용

#### 2-2. IT 인프라 정보 노출 검사

- `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- 소스 코드 내 하드코딩된 API 키, 시크릿 키, 토큰
  - 패턴: `API_KEY=`, `SECRET=`, `TOKEN=`, `PASSWORD=`, `PRIVATE_KEY=`
  - 패턴: `sk-`, `pk_live_`, `Bearer ey`, `ghp_`, `gho_`
- 하드코딩된 내부 IP 주소 (예시: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`)
- 하드코딩된 내부 URL/도메인 (예시: 사내 도메인, 내부 API 엔드포인트)
- 하드코딩된 DB 접속 정보 (connection string, host, port, username, password)
- **예외**: `localhost`, `127.0.0.1`, `0.0.0.0`, 환경변수 참조(`process.env.XXX`)는 허용

#### 2-3. 비즈니스 정보 노출 검사

- 소스 코드 주석에 프로젝트 일정, 협력사 실명, 내부 전략 정보
- README나 문서에 비공개 프로젝트 세부 정보

#### 2-4. AI 도구 안전 설정 검사

- `.gitignore`에 `.env`, `.env.local`, `.env.production` 포함 여부
- `.aiignore` 또는 `.claudeignore` 파일 존재 여부 확인
  - 존재하지 않으면 생성 권고
  - 존재하면 `.env*`, 인증 관련 파일, 설정 파일이 제외 목록에 있는지 확인
- 소스 코드에 주석으로 된 인증 정보 (예시: `// password: xxx`, `/* api key: xxx */`)

#### 2-5. NEXT_PUBLIC 환경변수 안전 검사 (WebView 전용)

- `NEXT_PUBLIC_CRYPTO_SECRET_KEY`, `NEXT_PUBLIC_MIXPANEL_TOKEN` 등 필수 환경변수에 null/undefined 방어 코드가 있는지 확인
  ```typescript
  // ✅ 올바른 패턴
  const KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY as string
  if (!KEY) throw new Error('NEXT_PUBLIC_CRYPTO_SECRET_KEY is required')

  // ❌ 위험한 패턴
  const KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY || ''
  ```
- `.env.local` 파일이 git에 추적되고 있지 않은지 확인 (`git ls-files --error-unmatch .env.local` 실행)
- `.env.example` 파일이 존재하는지 확인 (팀원 온보딩용)
- Docker build ARG에 `NEXT_PUBLIC_*` 변수가 누락되지 않았는지 `Dockerfile` 확인

#### 2-6. Cookie 보안 검사 (WebView 전용)

- Cookie에 `secure` 속성이 기본 활성화되어 있는지 확인
- Cookie `domain`이 `.music-flo.com`으로 제한되어 있는지 확인
- `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write` 사용 여부 검사 (XSS 방지)

### Step 3: 결과 리포트 출력

아래 형식으로 결과를 출력합니다.

```
================================================================
🔒 AI Tool 안전 사용 가이드 - 코드 보안 점검 결과
================================================================

📅 점검일시: {현재 날짜/시간}
📁 점검 대상: {프로젝트 이름}

────────────────────────────────────────────────────────────────
✅ 통과 항목 (Pass)
────────────────────────────────────────────────────────────────
  ✅ .env 파일이 .gitignore에 포함됨
  ✅ 하드코딩된 API 키 미발견
  ...

────────────────────────────────────────────────────────────────
⚠️  경고 항목 (Warning)
────────────────────────────────────────────────────────────────
  ⚠️  .aiignore 파일이 없습니다
     → 권고: .aiignore 파일을 생성하여 민감 파일을 AI 접근에서 제외하세요

────────────────────────────────────────────────────────────────
❌ 위반 항목 (Fail)
────────────────────────────────────────────────────────────────
  ❌ src/api/client.ts:15 - 하드코딩된 API 키 발견
     → `const API_KEY = "sk-abc123..."`
     → 수정: 환경변수 사용 (`process.env.API_KEY`)

  ❌ src/utils/config.ts:8 - 내부 IP 주소 노출
     → `const SERVER = "192.168.1.100:3000"`
     → 수정: 환경변수 사용 또는 '0.0.0.0' 으로 치환

────────────────────────────────────────────────────────────────
📊 요약
────────────────────────────────────────────────────────────────
  통과: {N}개  |  경고: {N}개  |  위반: {N}개

  {위반이 0이면}
  ✅ 프로젝트가 AI Tool 안전 사용 가이드를 준수합니다.

  {위반이 1개 이상이면}
  ❌ 위반 항목을 수정한 후 다시 점검해주세요.
================================================================
```

### Step 4: 자동 수정 제안

위반 항목이 발견되면 각 항목에 대해 구체적 수정 코드를 제안합니다:

- **하드코딩된 시크릿** → `process.env.XXX` 로 치환하는 코드 제안
- **내부 IP/URL** → 환경변수로 분리하는 코드 제안
- **`.aiignore` 미존재** → 권장 `.aiignore` 파일 내용 제안:
  ```
  .env
  .env.*
  *.pem
  *.key
  credentials.*
  secrets.*
  ```

## 중요 원칙

- 이 스킬은 **읽기 전용 검사**입니다. 자동으로 파일을 수정하지 않습니다.
- 위반 발견 시 수정 제안만 하고, 사용자 확인 후 적용합니다.
- `references/AI-TOOL-SECURITY.md` 가이드를 기준 문서로 참조합니다.
