/**
 * FLO Design System - Typography Tokens
 *
 * Text 컴포넌트에서 사용되는 typography variant 정의.
 * 임의의 font-size/weight 사용을 방지하고 디자인 시스템을 강제합니다.
 *
 * @see components/ui/Text.tsx
 */

export const typography = {
  /** 약 11pt 느낌의 페이지 타이틀 */
  heading: 'text-[15px] font-[800] leading-[22px] tracking-[-0.2px]',
  /** 대시보드 상단 레이블 */
  dashboardLabel: 'text-[20px] font-[700] leading-[28px] tracking-[-0.2px]',
  /** 약 11pt 느낌의 큰 본문 */
  body24: 'text-[15px] font-[500] leading-[22px] tracking-[-0.2px]',
  /** 약 11pt 느낌의 일반 본문 */
  body22: 'text-[15px] font-[500] leading-[22px] tracking-[-0.2px]',
  /** 약 11pt 느낌의 상세 설명 */
  detail20: 'text-[15px] font-[400] leading-[22px] tracking-[-0.1px]',
  /** 약 11pt 느낌의 큰 버튼 텍스트 */
  button30: 'text-[15px] font-[700] leading-[22px] tracking-[-0.2px]',
  /** 약 11pt 느낌의 작은 버튼 텍스트 */
  button26: 'text-[15px] font-[700] leading-[22px] tracking-[-0.2px]',
} as const

export type TypographyVariant = keyof typeof typography
