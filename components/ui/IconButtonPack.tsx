'use client'

import { ButtonHTMLAttributes, forwardRef, useCallback } from 'react'

export type IconButtonType = 'twitter' | 'kakao' | 'instagram' | 'download' | 'link'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * 아이콘 버튼 타입
   * - twitter: X (Twitter) 아이콘
   * - kakao: 카카오톡 아이콘
   * - instagram: 인스타그램 아이콘
   * - download: 다운로드 아이콘
   * - link: 링크 아이콘
   */
  type: IconButtonType
  /**
   * 버튼 크기 (px)
   * @default 80
   */
  size?: number
  /**
   * 배경색
   * @default '#000000'
   */
  bgColor?: string
  /**
   * 아이콘 색상
   * @default '#ffffff'
   */
  iconColor?: string
}

const iconPaths: Record<IconButtonType, JSX.Element> = {
  twitter: (
    <svg viewBox="0 0 33 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M25.9894 0H31.0493L19.9946 12.6354L33 29.8288H22.8165L14.841 19.4008L5.71499 29.8288H0.651557L12.4758 16.3141L0 0H10.4413L17.6508 9.53133L25.9894 0ZM24.2133 26.7999H27.0173L8.91793 2.8699H5.90926L24.2133 26.7999Z"
        fill="currentColor"
      />
    </svg>
  ),
  kakao: (
    <svg viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19 0C8.50681 0 0 6.93205 0 15.4824C0 20.9802 3.51768 25.8085 8.81838 28.5554L7.02783 35.4555C6.96124 35.66 7.01158 35.882 7.15825 36.0337C7.26448 36.1428 7.40362 36.198 7.54355 36.198C7.66247 36.198 7.78139 36.1588 7.88129 36.0774L15.5842 30.7146C16.6921 30.8782 17.8342 30.9645 19 30.9645C29.4936 30.9645 38 24.0336 38 15.4824C38 6.93205 29.4936 0 19 0"
        fill="currentColor"
      />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
        fill="currentColor"
      />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.072 25.608L6.402 14.938L9.3896 11.8437L14.938 17.3921V0H19.206V17.3921L24.7544 11.8437L27.742 14.938L17.072 25.608ZM0 34.144V23.474H4.268V29.876H29.876V23.474H34.144V34.144H0Z"
        fill="currentColor"
      />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.1406 20.4274C15.9092 21.1586 15.9092 22.3585 15.1406 23.0896C14.4094 23.8208 13.2095 23.8208 12.4784 23.0896C10.7224 21.331 9.73615 18.9474 9.73615 16.4623C9.73615 13.9771 10.7224 11.5935 12.4784 9.83494L19.1151 3.19822C20.8737 1.44226 23.2573 0.456 25.7424 0.456C28.2276 0.456 30.6112 1.44226 32.3698 3.19822C34.1257 4.95682 35.112 7.3404 35.112 9.82557C35.112 12.3107 34.1257 14.6943 32.3698 16.4529L29.5764 19.2463C29.5951 17.709 29.3514 16.1717 28.8264 14.7094L29.7076 13.8095C30.2332 13.2896 30.6504 12.6706 30.9352 11.9884C31.2199 11.3061 31.3665 10.5742 31.3665 9.83494C31.3665 9.09567 31.2199 8.36374 30.9352 7.68151C30.6504 6.99928 30.2332 6.38031 29.7076 5.86041C29.1877 5.33484 28.5687 4.9176 27.8865 4.63284C27.2043 4.34808 26.4723 4.20146 25.7331 4.20146C24.9938 4.20146 24.2619 4.34808 23.5796 4.63284C22.8974 4.9176 22.2784 5.33484 21.7585 5.86041L15.1406 12.4784C14.615 12.9983 14.1978 13.6173 13.913 14.2995C13.6282 14.9817 13.4816 15.7136 13.4816 16.4529C13.4816 17.1922 13.6282 17.9241 13.913 18.6063C14.1978 19.2886 14.615 19.9075 15.1406 20.4274ZM20.4274 12.4784C21.1586 11.7472 22.3585 11.7472 23.0896 12.4784C24.8456 14.237 25.8318 16.6206 25.8318 19.1057C25.8318 21.5909 24.8456 23.9745 23.0896 25.7331L16.4529 32.3698C14.6943 34.1257 12.3107 35.112 9.82557 35.112C7.3404 35.112 4.95682 34.1257 3.19822 32.3698C1.44226 30.6112 0.456 28.2276 0.456 25.7424C0.456 23.2573 1.44226 20.8737 3.19822 19.1151L5.99164 16.3217C5.9729 17.859 6.21662 19.3963 6.74155 20.8774L5.86041 21.7585C5.33484 22.2784 4.9176 22.8974 4.63284 23.5796C4.34808 24.2619 4.20146 24.9938 4.20146 25.7331C4.20146 26.4723 4.34808 27.2043 4.63284 27.8865C4.9176 28.5687 5.33484 29.1877 5.86041 29.7076C6.38031 30.2332 6.99928 30.6504 7.68151 30.9352C8.36374 31.2199 9.09567 31.3665 9.83494 31.3665C10.5742 31.3665 11.3061 31.2199 11.9884 30.9352C12.6706 30.6504 13.2896 30.2332 13.8095 29.7076L20.4274 23.0896C20.953 22.5697 21.3702 21.9507 21.655 21.2685C21.9398 20.5863 22.0864 19.8544 22.0864 19.1151C22.0864 18.3758 21.9398 17.6439 21.655 16.9617C21.3702 16.2794 20.953 15.6605 20.4274 15.1406C20.2454 14.9699 20.1002 14.7638 20.001 14.5348C19.9018 14.3059 19.8506 14.059 19.8506 13.8095C19.8506 13.5599 19.9018 13.3131 20.001 13.0841C20.1002 12.8552 20.2454 12.649 20.4274 12.4784Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.912"
      />
    </svg>
  ),
}

/**
 * FLO Design System - IconButton Component
 * Based on Figma: Common Asset BA 프로모션 에셋 - SNS 아이콘 버튼
 *
 * @example
 * ```tsx
 * import { IconButton } from '@/components/ui/IconButtonPack'
 *
 * <IconButton type="twitter" onClick={() => {}} />
 * <IconButton type="kakao" size={60} bgColor="#FEE500" iconColor="#000000" />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { type, size = 80, bgColor = '#000000', iconColor = '#ffffff', className = '', ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center
          rounded-full border-none p-0
          cursor-pointer
          transition-all duration-200 ease-out
          hover:opacity-90
          active:scale-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          color: iconColor,
        }}
        aria-label={type}
        {...props}
      >
        <span className="flex items-center justify-center" style={{ width: '43%', height: '43%' }}>
          {iconPaths[type]}
        </span>
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'

export interface IconButtonPackProps {
  /**
   * X (Twitter) 버튼 클릭 핸들러
   */
  onTwitterClick?: () => void
  /**
   * 카카오톡 버튼 클릭 핸들러
   */
  onKakaoClick?: () => void
  /**
   * 인스타그램 버튼 클릭 핸들러
   */
  onInstagramClick?: () => void
  /**
   * 다운로드 버튼 클릭 핸들러
   */
  onDownloadClick?: () => void
  /**
   * 링크 버튼 클릭 핸들러
   */
  onLinkClick?: () => void
  /**
   * 버튼 크기 (px)
   * @default 80
   */
  size?: number
  /**
   * 버튼 간격 (px)
   * @default 14
   */
  gap?: number
  /**
   * 추가 CSS 클래스
   */
  className?: string
  /**
   * 표시할 버튼 목록
   * @default ['twitter', 'kakao', 'instagram', 'download', 'link']
   */
  buttons?: IconButtonType[]
  /**
   * 버튼 배경색
   * @default '#000000'
   */
  bgColor?: string
  /**
   * 아이콘 색상
   * @default '#ffffff'
   */
  iconColor?: string
}

/**
 * FLO Design System - IconButtonPack Component
 * Based on Figma: Common Asset BA 프로모션 에셋 - SNS 아이콘 버튼 그룹
 *
 * @example
 * ```tsx
 * import { IconButtonPack } from '@/components/ui/IconButtonPack'
 *
 * // 기본 사용 (모든 버튼)
 * <IconButtonPack
 *   onTwitterClick={() => shareToTwitter()}
 *   onKakaoClick={() => shareToKakao()}
 *   onInstagramClick={() => shareToInstagram()}
 *   onDownloadClick={() => handleDownload()}
 *   onLinkClick={() => copyLink()}
 * />
 *
 * // 커스텀 색상
 * <IconButtonPack
 *   bgColor="#3f3fff"
 *   iconColor="#ffffff"
 *   size={60}
 *   gap={10}
 * />
 *
 * // 특정 버튼만 표시
 * <IconButtonPack
 *   buttons={['twitter', 'kakao', 'link']}
 *   onTwitterClick={() => {}}
 *   onKakaoClick={() => {}}
 *   onLinkClick={() => {}}
 * />
 * ```
 */
export const IconButtonPack = ({
  onTwitterClick,
  onKakaoClick,
  onInstagramClick,
  onDownloadClick,
  onLinkClick,
  size = 80,
  gap = 14,
  className = '',
  buttons = ['twitter', 'kakao', 'instagram', 'download', 'link'],
  bgColor = '#000000',
  iconColor = '#ffffff',
}: IconButtonPackProps) => {
  const handleClick = useCallback(
    (type: IconButtonType) => {
      switch (type) {
        case 'twitter':
          onTwitterClick?.()
          break
        case 'kakao':
          onKakaoClick?.()
          break
        case 'instagram':
          onInstagramClick?.()
          break
        case 'download':
          onDownloadClick?.()
          break
        case 'link':
          onLinkClick?.()
          break
      }
    },
    [onTwitterClick, onKakaoClick, onInstagramClick, onDownloadClick, onLinkClick],
  )

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ gap }}>
      {buttons.map((type) => (
        <IconButton
          key={type}
          type={type}
          size={size}
          bgColor={bgColor}
          iconColor={iconColor}
          onClick={() => handleClick(type)}
        />
      ))}
    </div>
  )
}

export default IconButtonPack
