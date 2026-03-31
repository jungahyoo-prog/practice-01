---
name: flo-push
description: 바이브 코더의 GitHub 업로드/푸쉬 요청을 처리하는 스킬. vibe-flo 조직(https://github.com/vibe-flo) 내 레포지토리 URL을 받아 remote를 설정하고, flo-commit으로 의미있는 커밋을 만든 뒤 push까지 완료해줌. "깃헙에 올려줘", "github에 업로드해줘", "푸쉬해줘", "레포에 올려줘", "깃에 올려줌", "github에 푸쉬해줘", "코드 올려줘", "배포해줘" 등 GitHub 업로드·푸쉬 요청이 오면 반드시 사용.
---

# flo-push

바이브 코더가 GitHub에 코드를 올릴 수 있도록 remote 설정 → 커밋 → push 전 과정을 안내한다.

## 워크플로우

### Step 1. Remote 확인

```bash
git remote -v
```

- **remote가 있으면** → Step 3으로 건너뜀
- **remote가 없으면** → Step 2로 이동

### Step 2. 레포지토리 URL 요청

remote가 설정되지 않은 경우, 사용자에게 레포 주소를 물어본다:

```
어떤 레포에 올릴까요?
https://github.com/vibe-flo/ 뒤에 레포 이름을 알려주세요.
(예: https://github.com/vibe-flo/my-project)
```

URL을 받으면 remote를 등록한다:

```bash
git remote add origin <받은_URL>
```

### Step 3. 커밋되지 않은 변경사항 확인

```bash
git status
```

- **변경사항이 있으면** → flo-commit 스킬을 호출해 커밋을 완료한다
  - flo-commit은 변경사항을 의미 단위로 분류하고 conventional commit 형식의 한글 메시지를 추천한다
  - 사용자 승인 후 커밋이 완료될 때까지 기다린다
- **변경사항이 없으면(이미 모두 커밋된 상태)** → Step 4로 바로 이동

### Step 4. Push 실행

현재 브랜치를 확인하고 push한다:

```bash
git branch --show-current
git push -u origin <현재_브랜치명>
```

push가 완료되면 결과를 안내한다:

```
✅ https://github.com/vibe-flo/<레포명>/tree/<브랜치명> 에 올라갔어요!
```

## 주의사항

- push 전 반드시 사용자에게 확인을 받는다 ("이 레포에 올릴까요?" 또는 "push할게요?")
- force push (`--force`) 는 사용자가 명시적으로 요청하지 않는 한 실행하지 않는다
