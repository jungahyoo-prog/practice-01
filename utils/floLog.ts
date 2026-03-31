/**
 * 프로젝트별 로그 모듈 (템플릿)
 *
 * Figma 정의서 기준으로 Action Log와 Mixpanel 이벤트를 분리하여 관리합니다.
 * 각 프로젝트에서 이 파일을 수정하여 사용하세요.
 *
 * @example
 * import { logAction, logMixpanel } from '@/utils/floLog'
 *
 * // 페이지 진입 시
 * logAction.pageEnter()
 * logMixpanel.pageView('main')
 *
 * // 버튼 클릭 시
 * logAction.clickButton()
 * logMixpanel.buttonClick('submit')
 */

import { actionLogger } from './actionLogger'
import { trackEvent } from './mixpanel'

// TODO: 프로젝트에 맞게 PAGE_ID 변경
const PAGE_ID = '/promotion/cms/PROJECT_NAME'

// ============ Action Log (Figma 액션로그 정의서 기반으로 추가) ============

export const logAction = {
  /**
   * 예시: 페이지 진입
   * page_id: PAGE_ID, category_id: /main, action_id: (빈값)
   */
  pageEnter() {
    actionLogger.send({
      pageId: PAGE_ID,
      categoryId: '/main',
      actionId: '',
      body: { trace_refer: document.referrer },
    })
  },

  /**
   * 예시: 버튼 클릭
   * page_id: PAGE_ID, category_id: /main, action_id: click_button
   */
  clickButton() {
    actionLogger.send({
      pageId: PAGE_ID,
      categoryId: '/main',
      actionId: 'click_button',
    })
  },

  // TODO: Figma 정의서에 따라 추가 이벤트를 여기에 작성
}

// ============ Mixpanel (Figma 믹스패널로그 정의서 기반으로 추가) ============

export const logMixpanel = {
  /**
   * 예시: 페이지 뷰
   */
  pageView(pageName: string, properties?: Record<string, string>) {
    trackEvent('view_page_PROJECT_NAME', {
      page_name: pageName,
      ...properties,
    })
  },

  /**
   * 예시: 버튼 클릭
   */
  buttonClick(btnName: string) {
    trackEvent('select_btn_page_PROJECT_NAME', {
      btn_name: btnName,
    })
  },

  // TODO: Figma 정의서에 따라 추가 이벤트를 여기에 작성
}
