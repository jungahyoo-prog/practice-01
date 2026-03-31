# App Scheme 코드 패턴

카테고리별 TypeScript 코드 예시.
모든 예시는 `APP_SCHEME.BASE`를 import해서 사용하는 것을 전제로 한다.

---

## 화면 이동 (view)

```typescript
// 홈 화면
window.location.href = `${APP_SCHEME.BASE}://view/home`

// 홈 화면 특정 섹션 앵커
window.location.href = `${APP_SCHEME.BASE}://view/home?anchorType=NEW`

// 보관함
window.location.href = `${APP_SCHEME.BASE}://view/my`

// 보관함 특정 탭
window.location.href = `${APP_SCHEME.BASE}://view/my?tab=mostListened`

// 검색
window.location.href = `${APP_SCHEME.BASE}://view/search?keyword=${encodeURIComponent(keyword)}`

// 컨텐츠 상세 (채널, 앨범, 아티스트 등)
window.location.href = `${APP_SCHEME.BASE}://view/content?type=${contentType}&id=${contentId}`

// 컨텐츠 상세 + 자동재생
window.location.href = `${APP_SCHEME.BASE}://view/content?type=CHART&id=100&autoPlay=true`

// 플레이어
window.location.href = `${APP_SCHEME.BASE}://view/mainPlayer`

// 비디오 플레이어
window.location.href = `${APP_SCHEME.BASE}://view/videoMainPlayer?id=${videoId}`

// 둘러보기
window.location.href = `${APP_SCHEME.BASE}://view/browser`

// 알림함
window.location.href = `${APP_SCHEME.BASE}://view/notification?tab=ALL`

// 설정
window.location.href = `${APP_SCHEME.BASE}://view/setting`

// 무드온
window.location.href = `${APP_SCHEME.BASE}://view/moodon`
```

---

## 웹뷰

```typescript
// 전체화면 웹뷰 (새창)
window.location.href = `${APP_SCHEME.BASE}://view/fullWeb?url=${encodeURIComponent(targetUrl)}&titleBar=static&title=${encodeURIComponent(title)}`

// 메인화면 웹뷰 (탭/미니플레이어 유지)
window.location.href = `${APP_SCHEME.BASE}://view/web?url=${encodeURIComponent(targetUrl)}`

// 다이얼로그 웹뷰
window.location.href = `${APP_SCHEME.BASE}://view/web/dialog?url=${encodeURIComponent(targetUrl)}&direction=up`
```

> Push 발송 시 `view/fullWeb`, `view/web`의 title/titleBar 옵션을 직접 설정하지 않는다 (Push 제목에서 자동 설정됨).

---

## 인증

```typescript
// 로그인
window.location.href = `${APP_SCHEME.BASE}://view/login`

// 회원가입
window.location.href = `${APP_SCHEME.BASE}://view/signUp`

// QR 로그인
window.location.href = `${APP_SCHEME.BASE}://action/login/qr?token=${token}&clearChildScreen=false`

// 앱투앱 로그인
window.location.href = `${APP_SCHEME.BASE}://action/apptoappLogin`
```

---

## 이용권/결제

```typescript
// 이용권 구매
window.location.href = `${APP_SCHEME.BASE}://view/purchase/voucher`

// 내 이용권
window.location.href = `${APP_SCHEME.BASE}://view/purchase/my`

// 특정 이용권 결제
window.location.href = `${APP_SCHEME.BASE}://view/pass?passId=${passId}`
```

---

## 재생

```typescript
// 트랙 재생
window.location.href = `${APP_SCHEME.BASE}://play/track?ids=${trackIds.join(',')}&repeat=all&shuffle=off&autoPlay=true`

// 빠른선곡
window.location.href = `${APP_SCHEME.BASE}://play/quickplay?trackId=${trackId}&familiarity=balanced&autoPlay=true`

// 재생목록에만 담기 (재생하지 않음)
window.location.href = `${APP_SCHEME.BASE}://play/track?ids=${trackIds.join(',')}&autoPlay=false`
```

---

## 액션

```typescript
// 외부 URL 열기
window.location.href = `${APP_SCHEME.BASE}://action/openUrl?url=${encodeURIComponent(externalUrl)}`

// 팝업 웹뷰
window.location.href = `${APP_SCHEME.BASE}://action/popup?type=webview&url=${encodeURIComponent(popupUrl)}`

// 토스트 메시지
window.location.href = `${APP_SCHEME.BASE}://view/toast?text=${encodeURIComponent(message)}`
```

---

## 공통 파라미터

```typescript
// 최소 앱 버전 지정
window.location.href = `${APP_SCHEME.BASE}://view/content?type=CHART&id=100&minAppVer=8.0.0`

// 인입 경로 추적
window.location.href = `${APP_SCHEME.BASE}://view/home?from=PUSH`

// 하위화면 모두 닫고 이동
window.location.href = `${APP_SCHEME.BASE}://view/home?clearChildScreen=true`
```

---

## WebView 전용 (앱 내 웹뷰에서만 동작)

```typescript
// alert
window.location.href = `${APP_SCHEME.BASE}://action/alert?message=${encodeURIComponent(msg)}&okText=${encodeURIComponent('확인')}`

// confirm
window.location.href = `${APP_SCHEME.BASE}://action/confirm?message=${encodeURIComponent(msg)}&okCallback=${callbackFn}&okText=${encodeURIComponent('확인')}&cancelText=${encodeURIComponent('취소')}`

// 웹뷰 닫기
window.location.href = `${APP_SCHEME.BASE}://action/close`

// access token 갱신
window.location.href = `${APP_SCHEME.BASE}://action/accessToken?success=${successFn}&fail=${failFn}`

// 로그 전송
window.location.href = `${APP_SCHEME.BASE}://action/sendLog?rakePage=${page}&rakeAction=${action}`
```
