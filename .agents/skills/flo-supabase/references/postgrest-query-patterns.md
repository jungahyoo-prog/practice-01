# PostgREST 고급 쿼리 패턴

> Supabase JS SDK는 내부적으로 PostgREST를 사용합니다.
> 참조: https://docs.postgrest.org/en/v14/

---

## 관계 조회 (JOIN)

```typescript
// posts와 users 조인 (users가 posts의 외래 키)
const { data } = await supabase
  .from('posts')
  .select('*, author:users(name, avatar_url)')

// 중첩 관계
const { data } = await supabase
  .from('posts')
  .select('*, comments(*, author:users(name))')
```

---

## 고급 필터

```typescript
// OR 조건
const { data } = await supabase
  .from('posts')
  .select('*')
  .or('status.eq.published,status.eq.featured')

// LIKE 검색
const { data } = await supabase
  .from('posts')
  .select('*')
  .ilike('title', `%${keyword}%`)

// IN 조건
const { data } = await supabase
  .from('posts')
  .select('*')
  .in('id', [1, 2, 3])

// NULL 체크
const { data } = await supabase
  .from('posts')
  .select('*')
  .is('deleted_at', null)

// 배열 포함
const { data } = await supabase
  .from('posts')
  .select('*')
  .contains('tags', ['react', 'typescript'])
```

---

## 집계 및 카운트

```typescript
// 총 개수 포함
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(0, 9)

// 카운트만 조회
const { count } = await supabase
  .from('posts')
  .select('*', { count: 'exact', head: true })
```

---

## RPC (Stored Procedure)

```typescript
// 함수 호출
const { data } = await supabase.rpc('get_leaderboard', { limit_count: 10 })

// 함수 생성 SQL 예시
// CREATE OR REPLACE FUNCTION get_leaderboard(limit_count int)
// RETURNS TABLE(nickname text, score int, rank bigint) AS $$
//   SELECT nickname, score, RANK() OVER (ORDER BY score DESC) as rank
//   FROM scores
//   LIMIT limit_count;
// $$ LANGUAGE sql;
```

---

## 뷰(View) 활용

```typescript
// 뷰는 테이블처럼 쿼리
const { data } = await supabase.from('leaderboard_view').select('*').limit(10)

// 뷰 생성 SQL
// CREATE OR REPLACE VIEW leaderboard_view AS
//   SELECT
//     nickname,
//     score,
//     RANK() OVER (ORDER BY score DESC) as rank,
//     created_at
//   FROM scores;
```

---

## 텍스트 검색 (Full-text Search)

```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .textSearch('content', keyword, { type: 'websearch' })
```
