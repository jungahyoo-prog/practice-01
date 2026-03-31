---
name: flo-commit
description: Git 커밋 메시지를 분석하고 추천하는 스킬. staged 변경사항을 논리적 그룹으로 분류하여 conventional commit 형식의 한글 커밋 메시지를 제안하고 사용자 승인 후 커밋 실행. "커밋", "commit", "커밋 만들어", "커밋해줘", "변경사항 정리해줘", "이거 커밋해", "git 정리", "커밋 메시지 추천", "저장해줘", "저장해", "코드 저장해줘" 등 커밋 관련 요청이나 커밋 전략 질문 시 사용.
---

# Louis Commit

staged 변경사항을 분석하여 그룹별로 커밋 메시지를 추천한다. 실제 커밋은 사용자 승인 후 진행.

## 커밋 메시지 형식

```
type(티켓ID): 한글 설명
```

### 타입 (type)

| 타입     | 용도                                 |
| -------- | ------------------------------------ |
| feat     | 새로운 기능 추가, UI 변경, 동작 변경 |
| fix      | 버그 수정, 오류 해결                 |
| refactor | 코드 리팩토링 (동작 변경 없음)       |
| chore    | 빌드, 설정, 의존성 변경              |
| docs     | 문서 수정                            |
| style    | 코드 포맷팅 (로직 변경 없음)         |
| test     | 테스트 추가/수정                     |

### 티켓 ID

브랜치명에서 티켓 ID 추출:

- `louis/WFE-2112/update-ceo-name` → `WFE-2112`
- `feature/FQ-18424/fix-popup` → `FQ-18424`
- 패턴: `(WFE|FQ)-\d+`

티켓 ID가 없으면 scope 생략: `feat: 설명`

### 설명 작성 규칙

1. **간결한 한글** 사용
2. **목적형 표현**: "~되도록 수정", "~하도록 처리"
3. **괄호로 부연설명**: 이유나 맥락 추가 `(기존 A -> 변경 B)`
4. **화살표(->)**: 변경 전후 관계 표현

### 예시

```
feat(WFE-2036): T멤버십 리뉴얼 퍼블리싱
feat(WFE-2036): 3초마다 자동 슬라이딩 기능 추가
feat(FQ-17563): 플레이어 가상 스크롤 도입
feat(FQ-17563): 풀 플레이어 가상 스크롤 적용 (편집모드 제외 -> DnD와 충돌하여 사이드 다수)
fix(WFE-2103): BTN_PURCHASE_PASS(linkType=PASS) 시 잘못된 promotionMangId 전달 방지
fix(WFE-2100): 제거된 메서드 복구 및 린트 에러 해결
refactor(WFE-2036): categoryId 변수화
```

## 워크플로우

1. `git diff --cached --name-only`로 staged 파일 목록 확인
2. **staged가 있으면** → `git diff --cached`로 변경 내용 분석 후 Step 4로
3. **staged가 없으면** → `git diff --name-only`로 unstaged 파일 확인
   - unstaged도 없으면: "커밋할 변경사항이 없습니다" 안내 후 종료
   - unstaged가 있으면: `git diff`로 변경 내용 분석 후 Step 4로 (add는 승인 후 실행)
4. `git branch --show-current`로 브랜치명에서 티켓 ID 추출
5. 변경사항을 논리적 그룹으로 분류
6. 그룹 수에 따라 적절한 형식으로 커밋 메시지 추천
7. 사용자 검토 대기 (커밋 실행하지 않음)

## 그룹 분리 기준

- **기능 단위**: 서로 다른 기능/컴포넌트 변경은 별도 그룹
- **타입 단위**: feat/fix/refactor 등 타입이 다르면 별도 그룹
- **연관성**: 같은 목적으로 변경된 파일들은 하나의 그룹

## 출력 형식

### 단일 커밋 (그룹이 1개일 때)

테이블 없이 간결하게 출력:

```
**추천 커밋 메시지**

feat(WFE-1234): 컴포넌트 기능 추가

대상 파일: src/components/A.vue, src/components/B.vue
```

### 다중 커밋 (그룹이 2개 이상일 때)

리스트로 출력:

```
**그룹 1** — feat(WFE-1234): 컴포넌트 기능 추가
대상 파일: src/components/A.vue, src/components/B.vue

**그룹 2** — refactor(WFE-1234): 유틸 함수 리팩토링
대상 파일: src/utils/helper.ts
```

## 주의사항

- 커밋을 직접 실행하지 않음 (추천만 제공)
- 사용자가 승인하면 그때 커밋 진행
  - staged 기반: `git commit -m "..."`
  - unstaged 기반: `git add <대상 파일들> && git commit -m "..."` (다중 커밋이면 그룹별로 순차 실행)
- 관련 없는 변경사항은 별도 그룹으로 분리
- **출력 형식은 그룹 수에 맞게 선택** (1개면 심플, 2개 이상이면 리스트)
