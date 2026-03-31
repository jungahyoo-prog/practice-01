---
name: flo-api
description: |
  FLO 웹 프론트엔드 인증 처리 스킬. 아래 두 API를 중심으로 안전한 토큰 라이프사이클을 구현할 때 사용.
  - GET /auth/v1/token (액세스 토큰 검증 / 사용자 상태 동기화)
  - POST /auth/v1/sign/in/refresh (리프레시 토큰으로 토큰 재발급)

  사용 시점: 앱 시작 시 토큰 검증, 401/만료 시 재발급, 재시도 로직, GM 헤더 조합, TypeScript 구현이 필요할 때.
---

# FLO API - 인증 처리 가이드

**버전**: Production Ready ✅
**최종 수정**: 2026-02-11

---

# FLO 인증 처리 스킬

## 적용 범위

이 스킬은 아래 두 API만 다룬다.

1. `GET /auth/v1/token`
2. `POST /auth/v1/sign/in/refresh`

다른 로그인 엔드포인트는 범위 밖이다.
참고: `POST /auth/v1/sign/in`은 현재 v1에서 `NEED_UPDATE` 예외를 반환한다.

## 빠른 시작 플로우

1. 필수 GM 헤더를 구성한다.
2. 앱 시작 시 `GET /auth/v1/token`을 호출한다.
3. 액세스 토큰 만료/인증 실패 시 `POST /auth/v1/sign/in/refresh`를 호출한다.
4. 재발급 성공 시, 스토리지의 액세스/리프레시 토큰을 교체하고 원래 요청을 1회 재시도한다.
5. 재발급 실패 시, 로그아웃 플로우로 전환한다.

## 요청 전제 조건

- `GET /auth/v1/token`은 최소한 아래 헤더가 필요하다.
  - `x-gm-member-no`
  - `x-gm-character-no`
  - `x-gm-device-no`
  - `x-gm-device-id`
- `POST /auth/v1/sign/in/refresh`는 최소한 아래 헤더가 필요하다.
  - `x-gm-device-id`
- 프로덕션 인증 필터 정책에 따라 액세스 토큰 헤더(예: `x-gm-access-token` 또는 `Authorization`)가 추가로 필요할 수 있다. 환경 설정을 따른다.

## 구현 가이드

- API 계약과 응답 의미론은 `references/flo-auth-api.md`를 먼저 읽는다.
- 프론트엔드 구현 예시로 `templates/flo-auth-client.ts`를 바로 사용할 수 있다.

## 구현 규칙

- 무한 루프 방지를 위해 요청당 리프레시 재시도는 1회로 제한한다.
- 재발급 성공 즉시 액세스 토큰과 리프레시 토큰을 모두 교체한다.
- 재발급 실패 시(예: `REFRESH_TOKEN_INVALID_SECURITY_POLICY`) 토큰을 초기화하고 재로그인으로 이동한다.
- 병렬 요청이 많은 화면에서는 동시 리프레시 호출을 단일 Promise로 중복 제거한다.
