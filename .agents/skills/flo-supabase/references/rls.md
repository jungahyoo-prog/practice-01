# RLS (Row Level Security) 패턴

> **전제**: 이 프로젝트는 Supabase Auth를 사용하지 않습니다.
> `auth.uid()`는 항상 NULL을 반환합니다.
> **RLS는 항상 활성화** — 비활성화(`DISABLE ROW LEVEL SECURITY`)는 금지입니다.
>
> RLS 일반 원칙 및 성능 최적화는 `../supabase-postgres-best-practices/references/security-rls-basics.md`를 참조하세요.

---

## 기본 RLS 패턴 (비로그인 환경)

누구나 조회/삽입 가능, 수정/삭제는 차단 (관리자 MCP만 가능).

```sql
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- 누구나 조회
CREATE POLICY "누구나 조회 가능" ON public.scores
  FOR SELECT USING (true);

-- 누구나 삽입 (검증은 앱 레벨에서)
CREATE POLICY "누구나 삽입 가능" ON public.scores
  FOR INSERT WITH CHECK (true);

-- 수정/삭제 정책 없음 = 차단 (Supabase Dashboard 또는 CLI로만 가능)
```

> **주의**: anon INSERT가 열려 있어 임의 데이터 삽입이 가능합니다.
> 단순 공개 데이터(점수, 이벤트 참여 등)에는 허용 가능한 수준입니다.

---

## 정책 관리

```sql
-- 특정 정책 삭제
DROP POLICY IF EXISTS "누구나 조회 가능" ON public.scores;

-- 현재 정책 조회
SELECT * FROM pg_policies WHERE tablename = 'scores';
```

---

## 주의사항

- RLS를 활성화하면 정책이 없는 경우 **모든 접근이 차단**됩니다.
- `service_role` 키는 RLS를 우회합니다 — 클라이언트 코드에 절대 포함 금지.
- Publishable Key(구 anon key)는 RLS 정책의 적용을 받습니다.

---

## Auth 연동 시 (추후)

Supabase Auth를 연동할 경우 `auth.uid()` 기반 정책으로 전환합니다.
해당 시점에 이 섹션을 확장하세요.
