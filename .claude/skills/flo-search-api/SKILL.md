---
name: flo-search-api
description: FLO에서 트랙/앨범/아티스트를 검색합니다. 키워드 검색, 검색 기능 구현, 검색 방법 안내, 검색 코드 작성이 필요할 때 사용합니다. 검색 API(/search/v2/search)를 호출해 결과를 요약하여 보여줍니다.

---

# FLO Search API

## 목적

`GET https://api.music-flo.com/search/v2/search`를 호출해 키워드 기반 검색 결과를 가져온다.

- `searchType` 파라미터로 TRACK / ARTIST / ALBUM / INTEGRATION 지정 가능
- 응답 JSON을 요약(상위 N개)해서 사용자에게 보여줄 수 있음

## API 스펙

### 엔드포인트

```
GET https://api.music-flo.com/search/v2/search
```

### 쿼리 파라미터

| 파라미터 | 값 | 설명 |
|---------|-----|------|
| `sortType` | `ACCURACY` | 정확도순 정렬 |
| `searchType` | `INTEGRATION` | TRACK / ARTIST / ALBUM / INTEGRATION |
| `keyword` | `<검색어>` | 필수 |
| `suggestedQuery` | `""` | 빈 문자열 |
| `queryType` | `system` | 고정값 |
| `mixYn` | `Y` | 고정값 |
| `page` | `1` | 페이지 번호 |
| `size` | `10` | 결과 수 |

### 헤더

```
Accept: application/json
cache-control: no-cache
```

## 응답 구조

```json
{
  "data": {
    "list": [
      {
        "type": "TRACK",
        "list": [{ "id": "...", "name": "...", "artistList": [...] }]
      },
      {
        "type": "ARTIST",
        "list": [{ "id": "...", "name": "..." }]
      }
    ]
  }
}
```

## TypeScript 구현

`services/searchApi.ts`에 추가하거나 hooks에서 직접 사용:

```typescript
type SearchType = 'INTEGRATION' | 'TRACK' | 'ARTIST' | 'ALBUM'

interface SearchResult {
  type: string
  list: Array<{
    id?: string
    trackId?: string
    name?: string
    title?: string
    artistList?: Array<{ name: string }>
    album?: { title: string }
  }>
}

async function searchFlo(
  keyword: string,
  searchType: SearchType = 'INTEGRATION',
  page = 1,
  size = 10
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    sortType: 'ACCURACY',
    searchType,
    keyword,
    suggestedQuery: '',
    queryType: 'system',
    mixYn: 'Y',
    page: String(page),
    size: String(size),
  })

  const res = await fetch(
    `https://api.music-flo.com/search/v2/search?${params}`,
    {
      headers: {
        Accept: 'application/json',
        'cache-control': 'no-cache',
      },
    }
  )

  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const json = await res.json()
  return json.data?.list ?? []
}
```

## 데이터 추출

필드명이 응답에 따라 달라질 수 있으므로 양쪽을 확인:

```typescript
const trackId = track.id ?? track.trackId
const title = track.name ?? track.title
const artistName = track.artistList?.[0]?.name ?? ''
const albumTitle = track.album?.title ?? ''
```

## 직접 검색 (결과 확인용)

Claude가 직접 결과를 가져와 보여줄 때:

```bash
curl -s "https://api.music-flo.com/search/v2/search?sortType=ACCURACY&searchType=INTEGRATION&keyword=IU&queryType=system&mixYn=Y&page=1&size=5" \
  -H "Accept: application/json" \
  -H "cache-control: no-cache" | python3 -m json.tool
```

## 주의사항

- **Rate Limiting**: 요청 간 0.3초 이상 간격 권장
- **필드 불일치**: `name`/`title`, `id`/`trackId` 등 필드명이 응답마다 다를 수 있음
- **빈 결과**: `data.list`나 특정 타입 `list`가 비어있을 수 있음
