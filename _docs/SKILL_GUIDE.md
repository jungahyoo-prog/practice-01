# Claude Code Skills for FE Projects

이 프로젝트는 Claude Code를 위한 커스텀 스킬들이 포함되어 있습니다.

## 📁 설치된 Skills (총 16개)

### FLO 커스텀 Skills
- **flo-plan** - 기획 문서(PRD.md)를 분석하여 TASKS.md 자동 생성/갱신
- **flo-api** - FLO 인증 토큰 라이프사이클 처리 (검증/갱신/재시도)
- **flo-app-scheme** - FLO 앱 딥링크 스킴 코드 생성
- **flo-commit** - Music-flo 커밋 컨벤션 메시지 생성
- **flo-supabase** - Supabase DB 작업 (Supabase 선택 프로젝트에만 포함)
- **flo-image-capture** - DOM을 PNG 이미지로 캡처
- **flo-share-image** - 이미지 공유 기능 구현
- **flo-share-link** - URL/링크 공유 (Web Share API + WebView 폴백)
- **flo-logs** - FLO 액션 로그와 Mixpanel 이벤트 추가
- **flo-security** - AI 안전 사용 가이드 보안 점검

### 코드리뷰 전용 Skills (개발자 전용 — 일반 사용 안함)
- **react-best-practices** - React 성능 최적화 패턴
- **next-best-practices** - Next.js best practices
- **composition-patterns** - React composition 패턴
- **supabase-postgres-best-practices** - Supabase Postgres 성능 최적화
- **web-design-guidelines** - 웹 UI 가이드라인 검토

### 문서 조회
- **context7** - 라이브러리/프레임워크 공식 문서 자동 조회

## 🚀 주요 스킬 사용 방법

### 1. flo-commit - Git 커밋 메시지 생성

**사용 시점:** 변경사항을 커밋할 때

**명령어:**
```bash
/flo-commit
```

또는 자연어로 "커밋해줘", "commit"

**기능:**
- 현재 브랜치에서 Jira 티켓 코드 자동 추출
- Music-flo 컨벤션에 맞는 커밋 메시지 생성
- 한국어/영어 모두 지원

**예시:**
```
feat(FQ-18265): 외부 로그인 서비스 연동 추가
fix(MFL-9527): 결제 완료 페이지 리다이렉션 오류 수정
```

---

### 2. flo-security - 보안 점검

**사용 시점:** 커밋 전 / 배포 전

**명령어:**
```bash
/flo-security
```

**기능:**
- 개인정보, 인프라 정보, 비즈니스 정보 노출 검사
- .gitignore / .aiignore 설정 검사
- 하드코딩된 시크릿 탐지
- 위반 항목별 수정 제안

---

### 3. context7 - 공식 문서 조회

**사용 시점:** 새로운 라이브러리/프레임워크를 사용할 때

**명령어:**
```bash
/context7
```

**기능:**
- 최신 공식 문서 자동 조회
- Next.js, React, TypeScript 등 지원
- AI가 자동으로 판단하여 필요 시 호출

---

## 💡 팁

1. **스킬 확인:** `/skills` 명령어로 사용 가능한 스킬 목록 확인
2. **컨텍스트 유지:** Claude는 프로젝트 컨텍스트를 이해하고 있으므로 자연스럽게 대화하듯 요청 가능
3. **커스터마이징:** 각 스킬의 `SKILL.md` 파일을 수정하여 팀 컨벤션에 맞게 조정 가능
4. **프로젝트 타입:** 이 프로젝트는 Next.js 15 CSR (Static Export) 기반입니다
5. **비개발자 친화:** 모호한 요청 시 선택지 제시, 변경 계획 설명 등 적극적 안내 제공

## 🔧 스킬 추가하기

새로운 스킬을 추가하려면:

1. `.claude/skills/` 폴더에 새 디렉토리 생성
2. `SKILL.md` 파일 작성 (frontmatter + 설명)
3. Claude 재시작

**예시 구조:**
```
.claude/skills/my-skill/
└── SKILL.md
```

**SKILL.md 템플릿:**
```markdown
---
name: my-skill
description: 스킬 설명
---

# 스킬 이름

스킬에 대한 상세 설명 및 사용 방법...
```

## 📚 참고 자료

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)
- [Skills 작성 가이드](https://docs.anthropic.com/claude/docs/skills)
