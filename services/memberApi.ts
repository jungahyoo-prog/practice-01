/**
 * FLO Auth API 클라이언트
 *
 * FLO 백엔드 API와 통신하여 토큰 검증 및 회원 정보를 조회합니다.
 * verifyToken 실패 시 refreshToken으로 토큰을 갱신합니다.
 */

// ============ Store 업데이트 ============
export async function saveMemberInfo(data: {
  memberNo?: number | string
  hashedMemberNo?: string
  characterNo?: number | string
}) {
  const { useMemberStore } = await import('@/store/memberStore')
  useMemberStore.getState().setMemberInfo({
    memberNo: String(data.memberNo || ''),
    hashedMemberNo: String(data.hashedMemberNo || ''),
    characterNo: String(data.characterNo || ''),
  })
}
