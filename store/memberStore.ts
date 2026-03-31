import { create } from 'zustand'
import { actionLogger } from '@/utils/actionLogger'

interface MemberState {
  memberNo: string
  hashedMemberNo: string
  characterNo: string
  setMemberInfo: (info: { memberNo: string; hashedMemberNo: string; characterNo: string }) => void
  clearMemberInfo: () => void
}

export const useMemberStore = create<MemberState>((set) => ({
  memberNo: '',
  hashedMemberNo: '',
  characterNo: '',
  setMemberInfo: (info) => {
    set(info)
    // memberStore 변경 시 actionLogger에 자동 동기화
    actionLogger.setUserInfo({
      memberNo: info.memberNo,
      characterNo: info.characterNo,
    })
  },
  clearMemberInfo: () => {
    set({ memberNo: '', hashedMemberNo: '', characterNo: '' })
    actionLogger.clearUserInfo()
  },
}))

/**
 * memberStore의 현재 값을 actionLogger에 동기화
 * 앱 초기화 시 호출하여 기존 store 값을 actionLogger에 반영
 */
export function syncMemberStoreToActionLogger(): void {
  const state = useMemberStore.getState()
  if (state.memberNo || state.characterNo) {
    actionLogger.setUserInfo({
      memberNo: state.memberNo,
      characterNo: state.characterNo,
    })
  }
}
