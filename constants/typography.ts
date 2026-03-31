/**
 * FLO Design System - Typography Tokens
 *
 * Text 컴포넌트에서 사용되는 typography variant 정의.
 * 임의의 font-size/weight 사용을 방지하고 디자인 시스템을 강제합니다.
 *
 * @see components/ui/Text.tsx
 */

export const typography = {
  /** 50px / 800 - 페이지 타이틀 */
  heading: 'text-[50px] font-[800] leading-tight tracking-[-0.5px]',
  /** 24px / 500 - 큰 본문 */
  body24: 'text-[24px] font-[500] leading-[34px] tracking-[-0.3px]',
  /** 22px / 500 - 일반 본문 */
  body22: 'text-[22px] font-[500] leading-[32px] tracking-[-0.3px]',
  /** 20px / 400 - 상세 설명 */
  detail20: 'text-[20px] font-[400] leading-[30px] tracking-[-0.2px]',
  /** 30px / 700 - 큰 버튼 텍스트 */
  button30: 'text-[30px] font-[700] leading-[35px] tracking-[-0.5px]',
  /** 26px / 700 - 작은 버튼 텍스트 */
  button26: 'text-[26px] font-[700] leading-[45px] tracking-[-0.5px]',
} as const

export type TypographyVariant = keyof typeof typography
