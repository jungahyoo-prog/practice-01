# CRUD 패턴

## 기본 설정

```typescript
import { supabase } from '@/db/client'
```

---

## 조회

```typescript
// 목록 조회
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })

// 단건 조회
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', id)
  .single()

// 페이지네이션 (OFFSET 방식 — 소규모 데이터에 적합)
// ⚠️ 데이터가 많아지면 성능 저하 가능. 대용량 시 커서 기반 페이지네이션 권장:
// 참조: ../supabase-postgres-best-practices/references/data-pagination.md
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(0, 9)  // 첫 번째 10개

// 조건 필터
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .gte('score', 100)
  .order('score', { ascending: false })
  .limit(50)
```

---

## 생성

```typescript
// 단건 생성
const { data, error } = await supabase
  .from('posts')
  .insert({ title, content })
  .select()
  .single()

// 다수 생성
const { data, error } = await supabase
  .from('posts')
  .insert([
    { title: '첫 번째', content: '내용 1' },
    { title: '두 번째', content: '내용 2' },
  ])
  .select()
```

---

## 수정

```typescript
// 조건부 수정
const { data, error } = await supabase
  .from('posts')
  .update({ title, content })
  .eq('id', id)
  .select()
  .single()

// upsert (없으면 생성, 있으면 수정)
const { data, error } = await supabase
  .from('scores')
  .upsert({ nickname, score }, { onConflict: 'nickname' })
  .select()
  .single()
```

---

## 삭제

```typescript
// 조건부 삭제
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', id)
```

---

## 에러 처리 패턴

```typescript
const fetchItemList = async () => {
  setLoading(true)
  try {
    const { data, error } = await supabase.from('items').select('*')
    if (error) throw error
    setItemList(data ?? [])
  } finally {
    setLoading(false)
  }
}
```

---

## 타입 안전 사용

```typescript
import type { Database } from '@/db/types/database'

type Item = Database['public']['Tables']['items']['Row']

const { data } = await supabase.from('items').select('*')
// data는 Item[] 타입으로 추론됨
```

---

## 테이블 생성 SQL 패턴

```sql
-- 비로그인(익명) 버전 기본 테이블
CREATE TABLE public.items (
  id         bigserial   PRIMARY KEY,
  title      text        NOT NULL,
  content    text,
  created_at timestamptz DEFAULT now()
);
```
