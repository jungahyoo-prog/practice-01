# FLO Auth API 레퍼런스

## 1) GET /auth/v1/token

### 목적
- 액세스 토큰 검증 시 서버 원본과 대조하여 회원/디바이스/캐릭터 상태를 동기화한다.

### 필수 헤더
- `x-gm-member-no` (Long)
- `x-gm-character-no` (Long)
- `x-gm-device-no` (Long)
- `x-gm-device-id` (String)

### 응답 예시

```json
{
  "memberNo": 12345,
  "hashedMemberNo": "...",
  "characterNo": 999,
  "viewSelectCharacterYn": "N",
  "popUpClauseYn": "N"
}
```

### 주요 서버 동작
- 동일 `deviceId`에 대한 검증 요청을 짧은 TTL로 직렬화한다.
- 디바이스/캐릭터 상태를 조정하고 필요한 이벤트를 발행한다.
- 일부 내부 오류 시, 강제 로그아웃을 방지하기 위해 최소 응답으로 폴백할 수 있다.

## 2) POST /auth/v1/sign/in/refresh

### 목적
- 리프레시 토큰을 사용해 액세스/리프레시 토큰을 재발급한다.

### 요청
- 헤더: `x-gm-device-id` 필수
- 바디:

```json
{
  "refreshToken": "<refresh-token>"
}
```

### 응답 예시

```json
{
  "memberNo": 12345,
  "hashedMemberNo": "...",
  "characterNo": 999,
  "accessToken": "<new-access-token>",
  "refreshToken": "<new-refresh-token>",
  "viewSelectCharacterYn": "N",
  "popUpClauseYn": "N"
}
```

### 주요 서버 동작
- 동일 리프레시 토큰에 대한 중복 요청 비용을 줄이기 위해 결과를 짧은 시간 동안 캐시한다.
- 리프레시 토큰이 만료/무효인 경우 `REFRESH_TOKEN_INVALID_SECURITY_POLICY` 계열 오류를 반환한다.

## 프론트엔드 권장 처리 방식

1. 앱 시작 시 `GET /auth/v1/token`을 호출한다.
2. API 401/토큰 만료 시 `POST /auth/v1/sign/in/refresh`를 호출한다.
3. 성공 시 토큰을 교체하고 원래 요청을 1회 재시도한다.
4. 실패 시 로그아웃하고 로그인 화면으로 이동한다.
