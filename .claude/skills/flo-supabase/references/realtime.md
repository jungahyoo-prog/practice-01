# 실시간 구독 패턴

## 기본 구독

```typescript
import { useEffect } from 'react'
import { supabase } from '@/db/client'

useEffect(() => {
  const channel = supabase
    .channel('posts-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
      console.log('변경 감지:', payload)
      // 상태 업데이트
      fetchItemList()
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

---

## 이벤트별 구독

```typescript
// INSERT만 감지
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
  setItemList((prev) => [payload.new as Item, ...prev])
})

// UPDATE만 감지
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
  setItemList((prev) => prev.map((item) => item.id === payload.new.id ? payload.new as Item : item))
})

// DELETE만 감지
.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
  setItemList((prev) => prev.filter((item) => item.id !== payload.old.id))
})
```

---

## 필터 조건 추가

```typescript
// 특정 행만 감지
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'posts',
  filter: 'status=eq.published'
}, handler)
```

---

## Realtime 활성화 (Supabase Dashboard)

테이블에 Realtime이 활성화되어 있어야 합니다.

```
Supabase Dashboard → Database → Replication → supabase_realtime publication에 테이블 추가
```

또는 SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
```
