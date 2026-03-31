# FLO Action Log API 레퍼런스

## 용어

| 용어 | 설명 |
|------|------|
| `pageId` | 페이지 식별자 (예: `/home`, `/player`) |
| `categoryId` | 섹션/카테고리 식별자 (예: `/main`, `/gnb`) |
| `actionId` | 액션 식별자 (예: `click`, `enter`, `play`) |
| `eventName` | 이벤트 명칭 (Mixpanel 연동용) |

## actionLogger

싱글톤 인스턴스. `utils/actionLogger.ts`에서 임포트.

```typescript
import { actionLogger } from '@/utils/actionLogger'

// 앱 초기화 시 설정
actionLogger.configure({
  appName: 'MY_APP',
  useProxy: true,  // Nginx 프록시 경유 여부
  debug: false,
})

// 로그 전송
actionLogger.send({
  pageId: '/home',
  categoryId: '/main',
  actionId: 'click',
  eventName: 'click_start',  // Mixpanel용 (선택)
  body: { key: 'value' },
})

// 사용자 정보 설정 (로그인 후)
actionLogger.setUserInfo({ memberNo: '123', characterNo: '1', accessToken: 'jwt' })

// 사용자 정보 초기화 (로그아웃 시)
actionLogger.clearUserInfo()
```

## Hooks (`hooks/useActionLog`)

### useActionLog

```typescript
import { useActionLog } from '@/hooks/useActionLog'

const { sendLog, setUser, clearUser } = useActionLog()

sendLog({ pageId, categoryId, actionId, body })
setUser({ memberNo, characterNo, accessToken })
clearUser()
```

### usePageEnterLog

페이지 마운트 시 자동으로 진입 로그 전송.

```typescript
import { usePageEnterLog } from '@/hooks/useActionLog'

usePageEnterLog('/page', '/category', { extraData: 'value' })
```

### 유틸리티 함수

```typescript
import { sendPageEnterLog, sendClickLog } from '@/hooks/useActionLog'

sendPageEnterLog('/page', '/category')
sendClickLog('/page', '/category', 'button_click', { buttonId: '1' })
```

## 환경별 엔드포인트

런타임 호스트명 기반 자동 감지:

| 환경 | 호스트 | Endpoint |
|------|--------|----------|
| Production | `music-flo.com`, `www.music-flo.com` | `ingestion.log.infra.music-flo.io` |
| Stage/Dev | 그 외 모든 호스트 | `ingestion.qa.log.infra.music-flo.io` |

프로덕션 도메인 추가는 `utils/actionLogger.ts`의 `productionHosts` 배열 수정.

## Request Body 구조

전송되는 데이터 구조 (참고용):

```json
[{
  "page_id": "/home",
  "category_id": "/main",
  "action_id": "click",
  "event_name": "click_button",
  "member_no": "12345",
  "character_no": "1",
  "access_token": "user_token",
  "device_id": "web_abc123",
  "os_name": "Windows",
  "browser_name": "Chrome",
  "url": "https://myapp.com/home",
  "referrer": "https://example.com",
  "body": {
    "action_session_id": "asi_v1_uuid",
    "trace_refer": "https://referrer.com"
  }
}]
```
