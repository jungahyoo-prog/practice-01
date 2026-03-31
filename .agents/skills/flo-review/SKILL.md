---
name: flo-review
description: >
  next-best-practices, react-best-practices, flo-security, ESLint, Prettier 5가지 리뷰어를
  서브에이전트로 병렬 실행하여 통합 코드 리뷰 리포트를 테이블 형식으로 제공합니다.
  "코드 리뷰", "review", "리뷰해줘", "전체 리뷰", "배포 전 리뷰", "/flo-review",
  "코드 검토", "품질 점검", "lint 돌려줘", "prettier 확인" 요청 시 즉시 사용합니다.
  코드 변경 완료 후 커밋/PR 전 최종 점검이 필요할 때도 사용합니다.
---

# flo-review: 통합 코드 리뷰

5가지 리뷰어를 **서브에이전트로 병렬 실행**하고, 결과를 통합 테이블로 집계합니다.
Majority(과반수) 항목은 우선 수정 대상으로 표기됩니다.

## 리뷰어 구성

| # | 리뷰어 | 역할 | 실행 방식 |
|---|--------|------|-----------|
| N | next-best-practices | Next.js 파일 컨벤션, 비동기 패턴, 번들링 | 스킬 기반 분석 |
| R | react-best-practices | React 성능 최적화 57개 규칙 | 스킬 기반 분석 |
| S | flo-security | 보안 취약점, 환경변수 노출, XSS | 스킬 기반 분석 |
| E | ESLint | 정적 코드 분석, 규칙 위반 | CLI 실행 |
| P | Prettier | 코드 포맷 일관성 검사 | CLI 실행 |

---

## Step 1: 5개 서브에이전트 병렬 실행

Agent 도구를 사용해 **단일 메시지에서 동시에** 5개 서브에이전트를 스폰한다.
모든 에이전트가 완료될 때까지 기다린 뒤 Step 2로 진행한다.

각 에이전트는 발견한 이슈를 아래 JSON 구조로 반환해야 한다:

```json
{
  "reviewer": "next | react | security | eslint | prettier",
  "issues": [
    {
      "severity": "❌ 위반 | ⚠️ 경고 | ℹ️ 정보",
      "category": "카테고리명",
      "file": "상대경로:라인번호 (없으면 프로젝트 전체)",
      "description": "한 줄 설명",
      "suggestion": "수정 방향 (선택)"
    }
  ],
  "pass_count": 0,
  "warn_count": 0,
  "fail_count": 0
}
```

### 에이전트 1 — next-best-practices

```
역할: Next.js 코드 패턴 리뷰어
스킬 파일: .claude/skills/next-best-practices/SKILL.md 를 Read 도구로 읽고 지침을 따른다.

작업:
1. next-best-practices 스킬 지침에 따라 프로젝트 코드를 검사한다.
2. 발견된 모든 이슈(위반/경고/정보)를 수집한다.
3. 위 JSON 구조로 결과를 반환한다. reviewer 값은 "next".

검사 집중 영역:
- app/ 디렉토리 파일 컨벤션
- RSC/Client Component 경계
- async params/searchParams 패턴
- Image, Font 최적화
- 번들링 및 barrel import
- Hydration 에러 가능성
```

### 에이전트 2 — react-best-practices

```
역할: React 성능 최적화 리뷰어
스킬 파일: .claude/skills/react-best-practices/SKILL.md 를 Read 도구로 읽고 지침을 따른다.

작업:
1. react-best-practices 스킬 지침에 따라 프로젝트 코드를 검사한다.
2. 발견된 모든 이슈(위반/경고/정보)를 수집한다.
3. 위 JSON 구조로 결과를 반환한다. reviewer 값은 "react".

검사 집중 영역:
- 불필요한 리렌더링 (useCallback, useMemo, memo)
- 데이터 패칭 워터폴
- 번들 사이즈 (dynamic import, code splitting)
- 이벤트 리스너 누수
- 상태 관리 패턴
```

### 에이전트 3 — flo-security

```
역할: 보안 취약점 리뷰어
스킬 파일: .claude/skills/flo-security/SKILL.md 를 Read 도구로 읽고 지침을 따른다.

작업:
1. flo-security 스킬 지침에 따라 프로젝트 코드를 검사한다.
2. 발견된 모든 이슈(위반/경고/정보)를 수집한다.
3. 위 JSON 구조로 결과를 반환한다. reviewer 값은 "security".

검사 집중 영역:
- 하드코딩된 API 키/시크릿
- .env 파일 gitignore 처리
- XSS 위험 패턴 (dangerouslySetInnerHTML 등)
- 환경변수 방어 코드
- 내부 IP/도메인 노출
```

### 에이전트 4 — ESLint

```
역할: ESLint 정적 분석 실행기

작업:
1. 아래 명령어를 순서대로 실행한다:
   - npx eslint . --ext .ts,.tsx,.js,.jsx --format json 2>/dev/null
   - 실패 시: npm run lint -- --format json 2>/dev/null
   - JSON 출력이 없으면: npx eslint . --ext .ts,.tsx 2>&1 (텍스트 파싱)

2. ESLint 결과를 파싱하여 위 JSON 구조로 반환한다. reviewer 값은 "eslint".

심각도 매핑:
- ESLint severity 2 (error) → "❌ 위반"
- ESLint severity 1 (warning) → "⚠️ 경고"

eslint 설정 파일이 없으면:
- issues: [{ severity: "⚠️ 경고", category: "설정", file: "프로젝트 루트", description: "ESLint 설정 파일이 없습니다 (.eslintrc 또는 eslint.config.js)" }]
- 위 JSON 구조로 반환
```

### 에이전트 5 — Prettier

```
역할: Prettier 포맷 검사 실행기

작업:
1. 아래 명령어를 순서대로 실행한다:
   - npx prettier --check "**/*.{ts,tsx,js,jsx,json,css}" 2>&1
   - 실패 시: npm run format:check 2>&1

2. 포맷 불일치 파일 목록을 파싱하여 위 JSON 구조로 반환한다. reviewer 값은 "prettier".

심각도 매핑:
- 포맷 불일치 파일 → "⚠️ 경고"
- 각 불일치 파일마다 별도 이슈 항목 생성

prettier 설정 파일이 없으면:
- issues: [{ severity: "ℹ️ 정보", category: "설정", file: "프로젝트 루트", description: "Prettier 설정 파일이 없습니다 (.prettierrc 또는 prettier.config.js)" }]
- 위 JSON 구조로 반환
```

---

## Step 2: Majority 분석

모든 에이전트 결과를 수집한 후, 동일하거나 관련된 이슈를 찾아 Majority를 계산한다.

**Majority 기준: 5개 리뷰어 중 3개 이상이 같은 파일/패턴을 지적한 경우**
(2개 리뷰어가 지적한 경우는 "중복 지적"으로 별도 표기)

**Majority 판단 기준:**
- 동일한 파일을 여러 리뷰어가 지적한 경우
- 동일한 패턴(예: `dangerouslySetInnerHTML`)을 여러 리뷰어가 지적한 경우
- 같은 코드 위치에서 서로 다른 문제를 여러 리뷰어가 발견한 경우

**예시:**
- `dangerouslySetInnerHTML` → react(렌더링 안전성) + security(XSS) + eslint(규칙 위반) = 3개 → 🔴 Majority
- barrel import → next(번들링) + react(bundle-barrel-imports) = 2개 → 🟠 중복

---

## Step 3: 통합 리포트 출력

아래 형식으로 출력한다.

### 리포트 헤더

```
================================================================
🔍 flo-review 통합 코드 리뷰 리포트
================================================================
📅 리뷰일시: {날짜}
📁 대상: {프로젝트명}
```

### 리뷰어별 요약 테이블

| 리뷰어 | 역할 | ❌ 위반 | ⚠️ 경고 | ℹ️ 정보 |
|--------|------|:------:|:------:|:------:|
| N · next-best-practices | Next.js 패턴 | N | N | N |
| R · react-best-practices | React 성능 | N | N | N |
| S · flo-security | 보안 | N | N | N |
| E · ESLint | 정적 분석 | N | N | N |
| P · Prettier | 코드 포맷 | N | N | N |
| **합계** | | **N** | **N** | **N** |

### 전체 이슈 테이블

심각도 내림차순(❌→⚠️→ℹ️)으로 정렬한다.

| # | 심각도 | 카테고리 | 파일:라인 | 설명 | N | R | S | E | P | Majority |
|---|:------:|----------|-----------|------|:-:|:-:|:-:|:-:|:-:|:--------:|
| 1 | ❌ | 보안 | src/api.ts:10 | API 키 하드코딩 | | | ❌ | ❌ | | 🟠 |
| 2 | ❌ | 번들 | components/index.ts | barrel import 사용 | ❌ | ❌ | | ❌ | | 🔴 |
| 3 | ⚠️ | 포맷 | src/utils/helper.ts | Prettier 포맷 불일치 | | | | | ⚠️ | |

> 🔴 **Majority (3개+)**: 복합 문제 — 즉시 수정 권장
> 🟠 **중복 지적 (2개)**: 여러 관점에서 문제 확인 — 수정 권장

### 수정 가이드

위반(❌) 항목을 Majority 우선으로 정렬하여, 각 항목의 수정 방향을 제시한다.

```
[1] 🔴 barrel import — components/index.ts
    · Next.js: 번들 최적화를 위해 직접 import 사용
    · React: bundle-barrel-imports 규칙 위반
    · ESLint: no-restricted-imports 규칙 위반
    → 수정: import { Component } from '@/components/Component' 직접 경로 사용

[2] 🟠 API 키 하드코딩 — src/api.ts:10
    · Security: 소스 코드에 시크릿 노출
    · ESLint: no-hardcoded-credentials 규칙 위반
    → 수정: process.env.NEXT_PUBLIC_API_KEY 환경변수로 교체
```

### 최종 판정

```
────────────────────────────────────────────────────────────────
📊 최종 요약
────────────────────────────────────────────────────────────────
  ❌ 위반: N개  |  ⚠️ 경고: N개  |  🔴 Majority: N개

  {위반 0, 경고 0이면}
  ✅ 모든 리뷰어 통과 — 배포 준비 완료

  {위반 1개 이상이면}
  ❌ 위반 항목을 수정한 후 다시 /flo-review 를 실행하세요.
================================================================
```

---

## 주의사항

- 이 스킬은 **읽기 전용 검사**입니다. 코드를 자동으로 수정하지 않습니다.
- 자동 수정이 필요하면 Prettier는 `npx prettier --write .`, ESLint는 `npx eslint . --fix` 사용을 사용자에게 안내합니다.
- 스킬 파일이 없는 리뷰어는 건너뛰고 테이블에서 해당 컬럼을 `-` 로 표시합니다.
