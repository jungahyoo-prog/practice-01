'use client'

import Script from 'next/script'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

type ScheduleKind = 'major' | 'general'
type PriorityLevel = '최우선' | '높음' | '보통'
type ScheduleRepeatType = 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'
type DashboardTab = 'project-view' | 'schedule-list' | 'project-create' | 'schedule-create' | 'calendar'
type ScheduleQuickFilter = 'all' | 'major' | 'high-priority' | 'today' | 'week'
type CalendarFeedback = { tone: 'default' | 'success' | 'error'; text: string }
type CalendarPanelTab = 'preview' | 'import'

type ProjectItem = {
  id: string
  name: string
  owner: string
  priority: PriorityLevel
  progress: number
  startDate: string
  endDate: string
}

type ScheduleItem = {
  id: string
  projectId: string
  title: string
  date: string
  time: string
  priority: PriorityLevel
  kind: ScheduleKind
  repeatType: ScheduleRepeatType
  repeatCustom: string
  repeatCustomLabel: string
  memo: string
}

type ProjectFormState = {
  name: string
  owner: string
  priority: PriorityLevel
  startDate: string
  endDate: string
  periodPreset: string
}

type ScheduleFormState = {
  projectId: string
  title: string
  date: string
  time: string
  repeatType: ScheduleRepeatType
  repeatCustom: string
  repeatCustomLabel: string
  priority: PriorityLevel
  kind: ScheduleKind
  memo: string
  syncToGoogleCalendar: boolean
}

type ScheduleFilters = {
  projectId: string
  startDate: string
  endDate: string
  priority: '' | PriorityLevel
  kind: '' | ScheduleKind
}

type CustomRepeatFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type CustomRepeatConfig = {
  interval: string
  frequency: CustomRepeatFrequency
  weeklyDays: string[]
}

const projectPeriodPresetLabels: Record<ProjectPeriodPreset, string> = {
  custom: '직접 입력',
  'half-1': '상반기',
  'half-2': '하반기',
  'quarter-1': '1분기',
  'quarter-2': '2분기',
  'quarter-3': '3분기',
  'quarter-4': '4분기',
  'month-1': '1월',
  'month-2': '2월',
  'month-3': '3월',
  'month-4': '4월',
  'month-5': '5월',
  'month-6': '6월',
  'month-7': '7월',
  'month-8': '8월',
  'month-9': '9월',
  'month-10': '10월',
  'month-11': '11월',
  'month-12': '12월',
}

type ProjectPeriodPreset =
  | 'custom'
  | 'half-1'
  | 'half-2'
  | 'quarter-1'
  | 'quarter-2'
  | 'quarter-3'
  | 'quarter-4'
  | 'month-1'
  | 'month-2'
  | 'month-3'
  | 'month-4'
  | 'month-5'
  | 'month-6'
  | 'month-7'
  | 'month-8'
  | 'month-9'
  | 'month-10'
  | 'month-11'
  | 'month-12'

const tabs: { key: DashboardTab; label: string }[] = [
  { key: 'project-view', label: '프로젝트 보기' },
  { key: 'schedule-list', label: '일정 보기' },
  { key: 'project-create', label: '프로젝트 작성' },
  { key: 'schedule-create', label: '일정 작성' },
  { key: 'calendar', label: '구글 캘린더' },
]

const timelineMonths = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const priorityTone: Record<PriorityLevel, string> = {
  최우선: 'bg-red-300 text-red-900',
  높음: 'bg-amber-300 text-amber-900',
  보통: 'bg-blue-50 text-blue-900',
}

const priorityAccent: Record<PriorityLevel, string> = {
  최우선: 'border-red-300 bg-red-300/15',
  높음: 'border-amber-300 bg-amber-300/15',
  보통: 'border-blue-50 bg-blue-50/50',
}

const scheduleKindTone: Record<ScheduleKind, string> = {
  major: 'bg-blue-50 text-blue-900',
  general: 'bg-surface-primary text-fg-secondary',
}

const initialProjects: ProjectItem[] = [
  { id: 'brand-renewal', name: '2026 브랜드 경험 개편', owner: '브랜드경험팀', priority: '최우선', progress: 58, startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: 'growth-campaign', name: '신규 구독 전환 실험', owner: 'Growth Squad', priority: '높음', progress: 41, startDate: '2026-03-01', endDate: '2026-10-31' },
  { id: 'ops-automation', name: '운영 자동화 정비', owner: 'Operations', priority: '보통', progress: 24, startDate: '2026-05-01', endDate: '2026-12-31' },
]

const initialSchedules: ScheduleItem[] = [
  { id: 'brand-weekly', projectId: 'brand-renewal', title: '브랜드 개편 주간 싱크', date: '2026-04-01', time: '15:00', priority: '최우선', kind: 'major', repeatType: 'weekly', repeatCustom: '', repeatCustomLabel: '', memo: '핵심 의사결정 항목과 다음 단계 정리' },
  { id: 'growth-share', projectId: 'growth-campaign', title: 'A/B 테스트 결과 공유', date: '2026-04-03', time: '11:00', priority: '높음', kind: 'major', repeatType: 'none', repeatCustom: '', repeatCustomLabel: '', memo: '전환 데이터 리뷰와 후속 실험 선정' },
  { id: 'growth-risk', projectId: 'growth-campaign', title: '프로젝트 리스크 점검', date: '2026-04-05', time: '14:00', priority: '보통', kind: 'general', repeatType: 'monthly', repeatCustom: '', repeatCustomLabel: '', memo: '일정 지연 요인과 리소스 점검' },
  { id: 'brand-review', projectId: 'brand-renewal', title: '상반기 중간 리뷰', date: '2026-04-08', time: '16:30', priority: '최우선', kind: 'major', repeatType: 'none', repeatCustom: '', repeatCustomLabel: '', memo: '중간 산출물 리뷰와 방향성 체크' },
  { id: 'ops-kickoff', projectId: 'ops-automation', title: '자동화 정비 킥오프', date: '2026-04-10', time: '10:00', priority: '높음', kind: 'general', repeatType: 'daily', repeatCustom: '', repeatCustomLabel: '', memo: '범위 정의와 우선 과제 확인' },
  { id: 'ops-review', projectId: 'ops-automation', title: '업무 플로우 리뷰', date: '2026-04-18', time: '16:00', priority: '보통', kind: 'major', repeatType: 'none', repeatCustom: '', repeatCustomLabel: '', memo: '자동화 후 업무 흐름 비교' },
]

const defaultProjectForm = (): ProjectFormState => ({
  name: '',
  owner: '',
  priority: '보통',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  periodPreset: 'half-1',
})

const defaultScheduleForm = (projectId: string, baseDate = formatLocalDateKey(new Date())): ScheduleFormState => ({
  projectId,
  title: '',
  date: baseDate,
  time: '09:00',
  repeatType: 'none',
  repeatCustom: '',
  repeatCustomLabel: '',
  priority: '보통',
  kind: 'general',
  memo: '',
  syncToGoogleCalendar: false,
})

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateTimeValue(date: string, time: string) {
  return `${date}T${time}`
}

function formatDateLabel(date: string, time: string) {
  const parsedDate = new Date(`${date}T00:00:00`)
  return `${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일 ${time}`
}

function formatDuration(startMonth: number, endMonth: number) {
  return `2026.${String(startMonth + 1).padStart(2, '0')} - 2026.${String(endMonth + 1).padStart(2, '0')}`
}

function getMonthIndexFromDate(date: string) {
  return new Date(`${date}T00:00:00`).getMonth()
}

function formatProjectDuration(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')} - ${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}.${String(end.getDate()).padStart(2, '0')}`
}

function getLastDayOfMonth(month: number) {
  return new Date(2026, month, 0).getDate()
}

function getMonthDateRange(monthIndex: number) {
  const month = monthIndex + 1
  return {
    startDate: `2026-${String(month).padStart(2, '0')}-01`,
    endDate: `2026-${String(month).padStart(2, '0')}-${String(getLastDayOfMonth(month)).padStart(2, '0')}`,
  }
}

function getWeekDateRange(baseDate: Date) {
  const current = new Date(baseDate)
  const day = current.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const start = new Date(current)
  start.setDate(current.getDate() + mondayOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    startDate: formatLocalDateKey(start),
    endDate: formatLocalDateKey(end),
  }
}

function buildProjectPeriodRange(preset: ProjectPeriodPreset) {
  if (preset === 'custom') return null

  const ranges: Record<Exclude<ProjectPeriodPreset, 'custom'>, { startDate: string; endDate: string }> = {
    'half-1': { startDate: '2026-01-01', endDate: '2026-06-30' },
    'half-2': { startDate: '2026-07-01', endDate: '2026-12-31' },
    'quarter-1': { startDate: '2026-01-01', endDate: '2026-03-31' },
    'quarter-2': { startDate: '2026-04-01', endDate: '2026-06-30' },
    'quarter-3': { startDate: '2026-07-01', endDate: '2026-09-30' },
    'quarter-4': { startDate: '2026-10-01', endDate: '2026-12-31' },
    'month-1': { startDate: '2026-01-01', endDate: `2026-01-${String(getLastDayOfMonth(1)).padStart(2, '0')}` },
    'month-2': { startDate: '2026-02-01', endDate: `2026-02-${String(getLastDayOfMonth(2)).padStart(2, '0')}` },
    'month-3': { startDate: '2026-03-01', endDate: `2026-03-${String(getLastDayOfMonth(3)).padStart(2, '0')}` },
    'month-4': { startDate: '2026-04-01', endDate: `2026-04-${String(getLastDayOfMonth(4)).padStart(2, '0')}` },
    'month-5': { startDate: '2026-05-01', endDate: `2026-05-${String(getLastDayOfMonth(5)).padStart(2, '0')}` },
    'month-6': { startDate: '2026-06-01', endDate: `2026-06-${String(getLastDayOfMonth(6)).padStart(2, '0')}` },
    'month-7': { startDate: '2026-07-01', endDate: `2026-07-${String(getLastDayOfMonth(7)).padStart(2, '0')}` },
    'month-8': { startDate: '2026-08-01', endDate: `2026-08-${String(getLastDayOfMonth(8)).padStart(2, '0')}` },
    'month-9': { startDate: '2026-09-01', endDate: `2026-09-${String(getLastDayOfMonth(9)).padStart(2, '0')}` },
    'month-10': { startDate: '2026-10-01', endDate: `2026-10-${String(getLastDayOfMonth(10)).padStart(2, '0')}` },
    'month-11': { startDate: '2026-11-01', endDate: `2026-11-${String(getLastDayOfMonth(11)).padStart(2, '0')}` },
    'month-12': { startDate: '2026-12-01', endDate: `2026-12-${String(getLastDayOfMonth(12)).padStart(2, '0')}` },
  }

  return ranges[preset]
}

function getRepeatOptionLabels(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = weekdays[parsedDate.getDay()]
  const dayOfMonth = parsedDate.getDate()
  const month = parsedDate.getMonth() + 1

  return {
    none: '반복 안 함',
    daily: '매일',
    weekday: '매주 평일',
    weekly: `매주 ${dayOfWeek}요일`,
    monthly: `매월 ${dayOfMonth}일`,
    yearly: `매년 ${month}월 ${dayOfMonth}일`,
    custom: '맞춤',
  } satisfies Record<ScheduleRepeatType, string>
}

function buildCustomRepeatLabel(config: CustomRepeatConfig, date: string) {
  const parsedDate = new Date(`${date}T00:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const selectedWeekdays = config.weeklyDays.map((day) => weekdays[Number(day)]).join(', ')
  const everyLabel = Number(config.interval) > 1 ? `${config.interval}개` : ''

  if (config.frequency === 'DAILY') return everyLabel ? `${config.interval}일마다 반복` : '매일 반복'
  if (config.frequency === 'WEEKLY') return `${config.interval === '1' ? '매주' : `${config.interval}주마다`} ${selectedWeekdays || weekdays[parsedDate.getDay()]}`
  if (config.frequency === 'MONTHLY') return `${config.interval === '1' ? '매월' : `${config.interval}개월마다`} ${parsedDate.getDate()}일`
  return `${config.interval === '1' ? '매년' : `${config.interval}년마다`} ${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일`
}

function buildCustomRepeatRule(config: CustomRepeatConfig, date: string) {
  const parsedDate = new Date(`${date}T00:00:00`)
  const byDay = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

  if (config.frequency === 'DAILY') return `RRULE:FREQ=DAILY;INTERVAL=${config.interval}`
  if (config.frequency === 'WEEKLY') {
    const weeklyDays = (config.weeklyDays.length ? config.weeklyDays : [String(parsedDate.getDay())]).map((day) => byDay[Number(day)]).join(',')
    return `RRULE:FREQ=WEEKLY;INTERVAL=${config.interval};BYDAY=${weeklyDays}`
  }
  if (config.frequency === 'MONTHLY') return `RRULE:FREQ=MONTHLY;INTERVAL=${config.interval};BYMONTHDAY=${parsedDate.getDate()}`
  return `RRULE:FREQ=YEARLY;INTERVAL=${config.interval};BYMONTH=${parsedDate.getMonth() + 1};BYMONTHDAY=${parsedDate.getDate()}`
}

function formatRepeatLabel(schedule: Pick<ScheduleItem, 'date' | 'repeatType' | 'repeatCustom' | 'repeatCustomLabel'>) {
  if (schedule.repeatType === 'custom') return schedule.repeatCustomLabel || '맞춤 설정'
  return getRepeatOptionLabels(schedule.date)[schedule.repeatType]
}

function toGoogleCalendarDateTime(date: string, time: string) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function buildGoogleCalendarEventUrl(schedule: ScheduleItem, projectName?: string, calendarId?: string) {
  const start = toGoogleCalendarDateTime(schedule.date, schedule.time)
  const endDateTime = new Date(`${schedule.date}T${schedule.time}:00`)
  endDateTime.setHours(endDateTime.getHours() + 1)
  const end = `${endDateTime.getFullYear()}${String(endDateTime.getMonth() + 1).padStart(2, '0')}${String(endDateTime.getDate()).padStart(2, '0')}T${String(endDateTime.getHours()).padStart(2, '0')}${String(endDateTime.getMinutes()).padStart(2, '0')}00`
  const description = [projectName ? `프로젝트: ${projectName}` : '', schedule.memo].filter(Boolean).join('\n')
  const params = new URLSearchParams({ text: schedule.title, dates: `${start}/${end}`, details: description, location: '', ctz: 'Asia/Seoul' })
  if (calendarId) params.set('src', calendarId)
  return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`
}

function buildGoogleCalendarEmbedUrl(calendarId: string) {
  return `https://calendar.google.com/calendar/embed?${new URLSearchParams({ src: calendarId, ctz: 'Asia/Seoul', mode: 'AGENDA' }).toString()}`
}

function buildGoogleCalendarViewUrl(calendarId: string) {
  return `https://calendar.google.com/calendar/u/0/r/day?${new URLSearchParams({ src: calendarId, ctz: 'Asia/Seoul' }).toString()}`
}

function parseGoogleEventDate(dateValue?: string, dateTimeValue?: string) {
  if (dateTimeValue) {
    const parsed = new Date(dateTimeValue)
    return {
      date: formatLocalDateKey(parsed),
      time: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`,
    }
  }

  if (dateValue) {
    return {
      date: dateValue,
      time: '09:00',
    }
  }

  return {
    date: formatLocalDateKey(new Date()),
    time: '09:00',
  }
}

function hasMatchingGoogleCalendarEvent(
  events: Array<{ summary?: string; start?: { date?: string; dateTime?: string } }>,
  schedule: Pick<ScheduleItem, 'title' | 'date' | 'time'>,
) {
  return events.some((event) => {
    const { date, time } = parseGoogleEventDate(event.start?.date, event.start?.dateTime)
    return (event.summary ?? '').trim() === schedule.title.trim() && date === schedule.date && time === schedule.time
  })
}

function normalizeImportedCalendarDescription(description?: string) {
  if (!description) return ''

  return description
    .replace(/프로젝트:\s*[^\n]+/g, '')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_, href: string, text: string) => {
      const cleanText = text.replace(/<[^>]+>/g, '').trim()
      return cleanText ? `${cleanText} (${href})` : href
    })
    .replace(/https?:\/\/[^\s<)]+/gi, (url) => url)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderAutoLinkedText(text: string) {
  const urlRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (!part) return null
    const isUrl = /^(https?:\/\/|www\.)/i.test(part)

    if (!isUrl) {
      return <span key={`${part}-${index}`}>{part}</span>
    }

    const href = part.startsWith('http') ? part : `https://${part}`
    return (
      <a
        key={`${part}-${index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-black/30 underline-offset-2 transition hover:text-blue-900"
      >
        {part}
      </a>
    )
  })
}

function TimelineTrack({
  startMonth,
  endMonth,
  onMonthClick,
}: {
  startMonth: number
  endMonth: number
  onMonthClick?: (monthIndex: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] gap-2" style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(0, 1fr))` }}>
        {timelineMonths.map((month, index) => {
          const isActive = index >= startMonth && index <= endMonth
          return (
            <div key={month} className="space-y-1">
              <div className="px-1 text-center">
                <Text variant="detail20" color="text-fg-tertiary" align="center">{month}</Text>
              </div>
              <button type="button" onClick={() => onMonthClick?.(index)} className="block w-full" aria-label={`${month} 일정 보기`}>
                <div className={['h-3 rounded-full transition-colors', isActive ? 'bg-blue-800 shadow-s' : 'bg-surface-primary'].join(' ')} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return <div className={`rounded-full px-3 py-2 ${priorityTone[priority]}`}><Text variant="detail20">{priority}</Text></div>
}

function ScheduleKindBadge({ kind }: { kind: ScheduleKind }) {
  return <div className={`rounded-full px-3 py-2 ${scheduleKindTone[kind]}`}><Text variant="detail20">{kind === 'major' ? '주요 일정' : '일반 일정'}</Text></div>
}

function CompactScheduleBadge({ className, label }: { className: string; label: string }) {
  return (
    <div className={`rounded-full border px-2.5 py-1 ${className}`}>
      <span className="text-[12px] font-[500] leading-[16px] tracking-[0px]">{label}</span>
    </div>
  )
}

function getScheduleCardTone(priority: PriorityLevel) {
  if (priority === '최우선') return '!bg-red-50'
  if (priority === '높음') return '!bg-amber-50'
  return '!bg-slate-50'
}

function ProjectMetaBadge({ className, label, onClick }: { className: string; label: string; onClick?: () => void }) {
  const content = (
    <div className={`rounded-full border px-2.5 py-1 ${className}`}>
      <span className="text-[12px] font-[500] leading-[16px] tracking-[0px]">{label}</span>
    </div>
  )

  if (!onClick) return content

  return (
    <button type="button" onClick={onClick} className="transition hover:opacity-80">
      {content}
    </button>
  )
}

function ProjectActionIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-fg-tertiary transition hover:bg-black/5 hover:text-fg-primary"
    >
      {children}
    </button>
  )
}

function FieldHelpButton({
  label,
  note,
  isOpen,
  onToggle,
}: {
  label: string
  note: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative mr-4 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${label} 설명 보기`}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[12px] font-[700] text-fg-tertiary transition hover:bg-surface-primary"
      >
        ?
      </button>
      {isOpen && (
        <div className="absolute right-0 top-8 z-20 w-[220px] rounded-[20px] bg-gray-800 px-4 py-3 text-left shadow-l">
          <Text variant="detail20" color="text-alpha-white-700">{note}</Text>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const todayKey = formatLocalDateKey(new Date())
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false)
  const [activeTab, setActiveTab] = useState<DashboardTab>('project-view')
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules)
  const [calendarId, setCalendarId] = useState('jungah.yoo@dreamus.io')
  const [calendarFeedback, setCalendarFeedback] = useState<CalendarFeedback>({ tone: 'default', text: '구글 계정을 연결하면 선택한 캘린더에 일정을 직접 저장할 수 있습니다.' })
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectFormState>(defaultProjectForm())
  const [isProjectPeriodMenuOpen, setIsProjectPeriodMenuOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm(initialProjects[0].id, todayKey))
  const [isCustomRepeatMenuOpen, setIsCustomRepeatMenuOpen] = useState(false)
  const [customRepeatConfig, setCustomRepeatConfig] = useState<CustomRepeatConfig>({ interval: '1', frequency: 'WEEKLY', weeklyDays: [String(new Date(`${defaultScheduleForm(initialProjects[0].id, todayKey).date}T00:00:00`).getDay())] })
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilters>({ projectId: '', startDate: '', endDate: '', priority: '', kind: '' })
  const [scheduleQuickFilter, setScheduleQuickFilter] = useState<ScheduleQuickFilter>('all')
  const [scheduleProjectShortcutId, setScheduleProjectShortcutId] = useState<string | null>(null)
  const [highlightedScheduleId, setHighlightedScheduleId] = useState<string | null>(null)
  const [activeFieldHelp, setActiveFieldHelp] = useState<'project-priority' | 'schedule-kind' | 'schedule-priority' | null>(null)
  const [activeCalendarPanelTab, setActiveCalendarPanelTab] = useState<CalendarPanelTab>('preview')
  const { authorize, calendars, disconnect, events, googleClientId, googleEmail, authError, isAuthorizing, isCalendarsLoading, isConnected, isEventsLoading, isSavingEvent, selectedCalendar, selectedCalendarId, setSelectedCalendarId, addEventToCalendar, refreshEvents } = useGoogleCalendar(isGoogleScriptReady)

  const projectOptions = useMemo(() => projects.map((project) => ({ value: project.id, label: project.name })), [projects])
  const sortedSchedules = useMemo(() => [...schedules].sort((a, b) => buildDateTimeValue(a.date, a.time).localeCompare(buildDateTimeValue(b.date, b.time))), [schedules])
  const todaySchedules = useMemo(() => sortedSchedules.filter((schedule) => schedule.date === todayKey).slice(0, 3), [sortedSchedules, todayKey])
  const upcomingSchedules = useMemo(() => sortedSchedules.filter((schedule) => schedule.date > todayKey).slice(0, 4), [sortedSchedules, todayKey])
  const currentWeekRange = useMemo(() => getWeekDateRange(new Date()), [todayKey])

  const filteredSchedules = useMemo(
    () =>
      sortedSchedules.filter((schedule) => {
        const matchesProject = !scheduleFilters.projectId || schedule.projectId === scheduleFilters.projectId
          const matchesStartDate = !scheduleFilters.startDate || schedule.date >= scheduleFilters.startDate
          const matchesEndDate = !scheduleFilters.endDate || schedule.date <= scheduleFilters.endDate
          const matchesPriority = !scheduleFilters.priority || schedule.priority === scheduleFilters.priority
          const matchesKind = !scheduleFilters.kind || schedule.kind === scheduleFilters.kind
          const matchesQuickFilter =
            scheduleQuickFilter === 'all'
              ? true
              : scheduleQuickFilter === 'major'
                ? schedule.kind === 'major'
                : scheduleQuickFilter === 'high-priority'
                  ? schedule.priority === '최우선' || schedule.priority === '높음'
                  : true
          return matchesProject && matchesStartDate && matchesEndDate && matchesPriority && matchesKind && matchesQuickFilter
        }),
      [scheduleFilters, scheduleQuickFilter, sortedSchedules],
    )

  const getProjectPresetButtonClass = (isActive: boolean) =>
    [
      'h-[30px] px-[14px] py-0 text-[11px] leading-[16px] tracking-[0px] border rounded-full',
      isActive ? '!border-black !bg-black !text-white hover:!bg-black active:!bg-black' : 'border-black/35 bg-white text-black hover:bg-black/5 active:bg-black/10',
    ].join(' ')

  const projectTimelineCards = useMemo(
    () =>
        projects.map((project) => {
          const upcomingProjectSchedules = sortedSchedules.filter((schedule) => schedule.projectId === project.id && schedule.date >= todayKey)
          const milestones = upcomingProjectSchedules.filter((schedule) => schedule.kind === 'major')
          const remainingCount = sortedSchedules.filter((schedule) => schedule.projectId === project.id && schedule.date >= todayKey).length
          const nextSchedules = upcomingProjectSchedules.slice(0, 2)
          const hiddenNextScheduleCount = Math.max(upcomingProjectSchedules.length - nextSchedules.length, 0)
          return {
            ...project,
            duration: formatProjectDuration(project.startDate, project.endDate),
            remainingCount,
            nextSchedules,
            hiddenNextScheduleCount,
            milestone: milestones[0] ? `${milestones[0].title} · ${formatDateLabel(milestones[0].date, milestones[0].time)}` : '남아 있는 주요 일정이 없습니다.',
          }
        }),
    [projects, sortedSchedules, todayKey],
  )

  const summaryCards = useMemo<
    Array<{
      label: string
      value: string
      note: string
      tab: DashboardTab
      quickFilter: ScheduleQuickFilter
      filters: ScheduleFilters
    }>
  >(
    () => [
      {
        label: '진행 중 프로젝트',
        value: `${projects.length}개`,
        note: '현재 등록된 프로젝트 전체 개수입니다.',
        tab: 'project-view' as DashboardTab,
        quickFilter: 'all' as ScheduleQuickFilter,
          filters: { projectId: '', startDate: '', endDate: '', priority: '' as const, kind: '' as const },
      },
      {
        label: '이번 주 전체 일정',
        value: `${schedules.filter((schedule) => schedule.date >= currentWeekRange.startDate && schedule.date <= currentWeekRange.endDate).length}건`,
        note: '이번 주 기준 전체 일정입니다.',
        tab: 'schedule-list' as DashboardTab,
        quickFilter: 'week' as ScheduleQuickFilter,
          filters: { projectId: '', startDate: currentWeekRange.startDate, endDate: currentWeekRange.endDate, priority: '' as const, kind: '' as const },
      },
      {
        label: '오늘 전체 일정',
        value: `${schedules.filter((schedule) => schedule.date === todayKey).length}건`,
        note: '오늘 날짜 기준 전체 일정입니다.',
        tab: 'schedule-list' as DashboardTab,
        quickFilter: 'today' as ScheduleQuickFilter,
          filters: { projectId: '', startDate: todayKey, endDate: todayKey, priority: '' as const, kind: '' as const },
      },
      {
        label: '잔여 주요 일정',
        value: `${schedules.filter((schedule) => schedule.kind === 'major' && schedule.date >= todayKey).length}건`,
        note: '오늘 이후 기준으로 남아 있는 주요 일정입니다.',
        tab: 'schedule-list' as DashboardTab,
        quickFilter: 'major' as ScheduleQuickFilter,
          filters: { projectId: '', startDate: todayKey, endDate: '', priority: '' as const, kind: '' as const },
      },
    ],
    [currentWeekRange.endDate, currentWeekRange.startDate, projects.length, schedules, todayKey],
  )
  const scheduleProjectShortcutMessage = useMemo(() => {
    if (!scheduleProjectShortcutId) return ''
    const projectName = projects.find((project) => project.id === scheduleProjectShortcutId)?.name ?? '선택한 프로젝트'
    if (!scheduleFilters.startDate && !scheduleFilters.endDate) {
      return `${projectName}의 전체 일정만 보도록 필터가 적용되었습니다.`
    }
    if (scheduleFilters.startDate && scheduleFilters.endDate) {
      const start = new Date(`${scheduleFilters.startDate}T00:00:00`)
      const end = new Date(`${scheduleFilters.endDate}T00:00:00`)
      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${projectName}의 ${start.getMonth() + 1}월 일정만 보도록 필터가 적용되었습니다.`
      }
    }
    return `${projectName}의 금일 기준 잔여 일정만 보도록 필터가 적용되었습니다.`
  }, [projects, scheduleFilters.endDate, scheduleFilters.startDate, scheduleProjectShortcutId])
  const scheduleQuickFilterMessage = useMemo(() => {
    if (scheduleQuickFilter === 'major') return '요약 박스에서 잔여 주요 일정만 보도록 필터가 적용되었습니다.'
    if (scheduleQuickFilter === 'high-priority') return '요약 박스에서 높은 우선순위 일정만 보도록 필터가 적용되었습니다.'
    if (scheduleQuickFilter === 'today') return '요약 박스에서 오늘 전체 일정만 보도록 필터가 적용되었습니다.'
    if (scheduleQuickFilter === 'week') return '요약 박스에서 이번 주 전체 일정만 보도록 필터가 적용되었습니다.'
    return ''
  }, [scheduleQuickFilter])
  const repeatOptionLabels = useMemo(() => getRepeatOptionLabels(scheduleForm.date), [scheduleForm.date])
  const customRepeatPreviewLabel = useMemo(() => buildCustomRepeatLabel(customRepeatConfig, scheduleForm.date), [customRepeatConfig, scheduleForm.date])
  const repeatWeekdayOptions = useMemo(
    () => [
      { key: '0', label: '일' },
      { key: '1', label: '월' },
      { key: '2', label: '화' },
      { key: '3', label: '수' },
      { key: '4', label: '목' },
      { key: '5', label: '금' },
      { key: '6', label: '토' },
    ],
    [],
  )

  useEffect(() => {
    if (authError) {
      setCalendarFeedback({ tone: 'error', text: authError })
    }
  }, [authError])

    useEffect(() => {
      if (isConnected && selectedCalendarId) {
        setCalendarFeedback({ tone: 'success', text: '구글 계정 연결이 완료되었습니다. 이제 일정이 선택한 캘린더에 직접 저장됩니다.' })
      }
    }, [isConnected, selectedCalendarId])

    useEffect(() => {
      if (activeTab !== 'schedule-list' || !highlightedScheduleId) return

      const timer = window.setTimeout(() => {
        setHighlightedScheduleId(null)
      }, 4500)

      return () => window.clearTimeout(timer)
    }, [activeTab, highlightedScheduleId])

  const effectiveCalendarId = isConnected ? selectedCalendarId : calendarId
  const calendarEmbedUrl = effectiveCalendarId ? buildGoogleCalendarEmbedUrl(effectiveCalendarId) : ''
  const calendarViewUrl = selectedCalendar?.htmlLink || (effectiveCalendarId ? buildGoogleCalendarViewUrl(effectiveCalendarId) : '')

  const openGoogleCalendar = (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer')
  }

  const connectGoogleCalendar = async () => {
    const result = await authorize()
    if (!result.success) {
      setCalendarFeedback({ tone: 'error', text: result.reason === 'missing-client-id' ? '구글 로그인을 사용하려면 NEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수가 필요합니다.' : '구글 로그인 창을 준비하지 못했습니다. 새로고침 후 다시 시도해 주세요.' })
      return
    }
    setCalendarFeedback({ tone: 'default', text: '구글 로그인 창이 열렸습니다. 권한을 승인하면 캘린더 목록이 자동으로 표시됩니다.' })
  }

  const handleAddScheduleToCalendar = async (schedule: ScheduleItem, projectName?: string) => {
    const resolvedRepeatCustom =
      schedule.repeatType === 'custom' && !schedule.repeatCustom ? buildCustomRepeatRule(customRepeatConfig, schedule.date) : schedule.repeatCustom
    const resolvedRepeatCustomLabel =
      schedule.repeatType === 'custom' && !schedule.repeatCustomLabel ? buildCustomRepeatLabel(customRepeatConfig, schedule.date) : schedule.repeatCustomLabel

        if (isConnected && selectedCalendarId) {
          try {
            const latestEvents = await refreshEvents(selectedCalendarId)
            if (hasMatchingGoogleCalendarEvent(latestEvents, schedule)) {
              if (typeof window !== 'undefined') {
                window.alert('이미 등록되어 있는 일정입니다.')
              }
              setCalendarFeedback({ tone: 'default', text: '이미 선택한 구글 캘린더에 등록된 일정입니다.' })
              return
            }

            await addEventToCalendar({
            calendarId: selectedCalendarId,
            title: schedule.title,
            date: schedule.date,
          time: schedule.time,
          repeatType: schedule.repeatType,
          repeatCustom: resolvedRepeatCustom,
          memo: schedule.memo,
            projectName,
          })
          setCalendarFeedback({ tone: 'success', text: `선택한 캘린더${selectedCalendar?.summary ? `(${selectedCalendar.summary})` : ''}에 일정이 저장되었습니다.` })
          if (typeof window !== 'undefined') {
            window.alert('구글 캘린더 등록이 완료되었습니다.')
          }
        } catch {
          setCalendarFeedback({ tone: 'error', text: '구글 캘린더 저장에 실패했습니다. 로그인 상태나 권한을 다시 확인해 주세요.' })
        }
      return
    }

    if (typeof window !== 'undefined') {
      window.alert('로그인이 필요합니다.')
    }
    setCalendarFeedback({ tone: 'error', text: '구글 캘린더에 등록하려면 로그인이 필요합니다.' })
  }

  const saveScheduleToConnectedCalendar = async (schedule: ScheduleItem, projectName?: string) => {
    const resolvedRepeatCustom =
      schedule.repeatType === 'custom' && !schedule.repeatCustom ? buildCustomRepeatRule(customRepeatConfig, schedule.date) : schedule.repeatCustom

    if (!isConnected || !selectedCalendarId) {
      setCalendarFeedback({ tone: 'error', text: '구글 캘린더에도 등록하려면 먼저 구글 계정을 연결하고 저장할 캘린더를 선택해 주세요.' })
      return false
    }

    try {
      const latestEvents = await refreshEvents(selectedCalendarId)
      if (hasMatchingGoogleCalendarEvent(latestEvents, schedule)) {
        if (typeof window !== 'undefined') {
          window.alert('이미 등록되어 있는 일정입니다.')
        }
        setCalendarFeedback({ tone: 'default', text: '이미 선택한 구글 캘린더에 등록된 일정입니다.' })
        return false
      }

      await addEventToCalendar({
        calendarId: selectedCalendarId,
        title: schedule.title,
        date: schedule.date,
        time: schedule.time,
        repeatType: schedule.repeatType,
        repeatCustom: resolvedRepeatCustom,
        memo: schedule.memo,
        projectName,
      })
      setCalendarFeedback({ tone: 'success', text: `선택한 캘린더${selectedCalendar?.summary ? `(${selectedCalendar.summary})` : ''}에 일정이 저장되었습니다.` })
      return true
    } catch {
      setCalendarFeedback({ tone: 'error', text: '구글 캘린더 저장에 실패했습니다. 로그인 상태나 권한을 다시 확인해 주세요.' })
      return false
    }
  }

  const applySummaryShortcut = (tab: DashboardTab, quickFilter: ScheduleQuickFilter, filters: ScheduleFilters) => {
    setActiveTab(tab)
    setScheduleProjectShortcutId(null)
    if (tab === 'schedule-list') {
      setScheduleQuickFilter(quickFilter)
      setScheduleFilters(filters)
      return
    }
    setScheduleQuickFilter('all')
  }

  const applyProjectRemainingShortcut = (projectId: string) => {
    setActiveTab('schedule-list')
    setScheduleQuickFilter('all')
    setScheduleProjectShortcutId(projectId)
    setScheduleFilters({ projectId, startDate: todayKey, endDate: '', priority: '', kind: '' })
  }

  const applyProjectAllSchedulesShortcut = (projectId: string) => {
    setActiveTab('schedule-list')
    setScheduleQuickFilter('all')
    setScheduleProjectShortcutId(projectId)
    setScheduleFilters({ projectId, startDate: '', endDate: '', priority: '', kind: '' })
  }

  const applyProjectMonthShortcut = (projectId: string, monthIndex: number) => {
    const { startDate, endDate } = getMonthDateRange(monthIndex)
    setActiveTab('schedule-list')
    setScheduleQuickFilter('all')
    setScheduleProjectShortcutId(projectId)
    setScheduleFilters({ projectId, startDate, endDate, priority: '', kind: '' })
  }

  const handleProjectChange = (field: keyof ProjectFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProjectForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleChange = (field: keyof ScheduleFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setScheduleForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleFilterChange = (field: keyof ScheduleFilters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setScheduleProjectShortcutId(null)
    setScheduleFilters((current) => ({ ...current, [field]: event.target.value as ScheduleFilters[typeof field] }))
  }

  const goToDashboardHome = () => {
    setActiveTab('project-view')
    setScheduleQuickFilter('all')
    setScheduleProjectShortcutId(null)
    setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '', kind: '' })
    setEditingProjectId(null)
    setEditingScheduleId(null)
    setActiveFieldHelp(null)
    setProjectForm(defaultProjectForm())
    setScheduleForm(defaultScheduleForm(projects[0]?.id ?? '', todayKey))
    setIsProjectPeriodMenuOpen(false)
    setIsCustomRepeatMenuOpen(false)
  }
  const handleCustomRepeatChange = (field: keyof CustomRepeatConfig) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCustomRepeatConfig((current) => ({ ...current, [field]: event.target.value }))

  const handleProjectPeriodPresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const preset = event.target.value as ProjectPeriodPreset
    const range = buildProjectPeriodRange(preset)

    setProjectForm((current) => ({
      ...current,
      periodPreset: preset,
      startDate: range?.startDate ?? current.startDate,
      endDate: range?.endDate ?? current.endDate,
    }))
  }

  const applyProjectPeriodPreset = (preset: ProjectPeriodPreset) => {
    const range = buildProjectPeriodRange(preset)

    setProjectForm((current) => ({
      ...current,
      periodPreset: preset,
      startDate: range?.startDate ?? current.startDate,
      endDate: range?.endDate ?? current.endDate,
    }))
    setIsProjectPeriodMenuOpen(false)
  }

  const toggleCustomRepeatWeekday = (day: string) =>
    setCustomRepeatConfig((current) => ({
      ...current,
      weeklyDays: current.weeklyDays.includes(day) ? current.weeklyDays.filter((item) => item !== day) : [...current.weeklyDays, day].sort(),
    }))

  const applyCustomRepeatConfig = () => {
    setScheduleForm((current) => ({
      ...current,
      repeatType: 'custom',
      repeatCustom: buildCustomRepeatRule(customRepeatConfig, current.date),
      repeatCustomLabel: buildCustomRepeatLabel(customRepeatConfig, current.date),
    }))
    setIsCustomRepeatMenuOpen(false)
  }

  const resetProjectForm = () => {
    setEditingProjectId(null)
    setProjectForm(defaultProjectForm())
    setIsProjectPeriodMenuOpen(false)
  }

  const resetScheduleForm = (projectId?: string) => {
    setEditingScheduleId(null)
    setScheduleForm(defaultScheduleForm(projectId ?? projects[0]?.id ?? '', todayKey))
    setIsCustomRepeatMenuOpen(false)
  }

  const saveProject = () => {
    const normalizedStartDate = projectForm.startDate
    const normalizedEndDate = projectForm.endDate < normalizedStartDate ? normalizedStartDate : projectForm.endDate
    const currentProject = projects.find((project) => project.id === editingProjectId)
    const nextProject: ProjectItem = {
      id: editingProjectId ?? `project-${Date.now()}`,
      name: projectForm.name || '새 프로젝트',
      owner: projectForm.owner || '담당자 미정',
      priority: projectForm.priority,
      progress: currentProject?.progress ?? 0,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    }
    setProjects((current) => (editingProjectId ? current.map((project) => (project.id === editingProjectId ? nextProject : project)) : [...current, nextProject]))
    if (!editingProjectId) setScheduleForm((current) => ({ ...current, projectId: nextProject.id }))
    setActiveTab('project-view')
    resetProjectForm()
  }

  const saveSchedule = async () => {
    const resolvedRepeatCustom = scheduleForm.repeatType === 'custom' && !scheduleForm.repeatCustom ? buildCustomRepeatRule(customRepeatConfig, scheduleForm.date) : scheduleForm.repeatCustom
    const resolvedRepeatCustomLabel = scheduleForm.repeatType === 'custom' && !scheduleForm.repeatCustomLabel ? buildCustomRepeatLabel(customRepeatConfig, scheduleForm.date) : scheduleForm.repeatCustomLabel

    const nextSchedule: ScheduleItem = {
      id: editingScheduleId ?? `schedule-${Date.now()}`,
      projectId: scheduleForm.projectId,
      title: scheduleForm.title || '새 일정',
      date: scheduleForm.date,
      time: scheduleForm.time,
      repeatType: scheduleForm.repeatType,
      repeatCustom: resolvedRepeatCustom,
      repeatCustomLabel: resolvedRepeatCustomLabel,
      priority: scheduleForm.priority,
      kind: scheduleForm.kind,
      memo: scheduleForm.memo || '메모 없음',
    }

    setSchedules((current) => (editingScheduleId ? current.map((schedule) => (schedule.id === editingScheduleId ? nextSchedule : schedule)) : [...current, nextSchedule]))

      if (scheduleForm.syncToGoogleCalendar) {
        await saveScheduleToConnectedCalendar(nextSchedule, projects.find((project) => project.id === nextSchedule.projectId)?.name)
      }

      setScheduleQuickFilter('all')
      setScheduleProjectShortcutId(nextSchedule.projectId)
      setScheduleFilters({ projectId: nextSchedule.projectId, startDate: '', endDate: '', priority: '', kind: '' })
      setHighlightedScheduleId(nextSchedule.id)
      setActiveTab('schedule-list')
      resetScheduleForm(scheduleForm.projectId)
    }

  const editProject = (projectId: string) => {
    const target = projects.find((project) => project.id === projectId)
    if (!target) return
    setEditingProjectId(projectId)
    setProjectForm({ name: target.name, owner: target.owner, priority: target.priority, startDate: target.startDate, endDate: target.endDate, periodPreset: 'custom' })
    setActiveTab('project-create')
  }

  const editSchedule = (scheduleId: string) => {
    const target = schedules.find((schedule) => schedule.id === scheduleId)
    if (!target) return
    setEditingScheduleId(scheduleId)
    setScheduleForm({
      projectId: target.projectId,
      title: target.title,
      date: target.date,
      time: target.time,
      repeatType: target.repeatType,
      repeatCustom: target.repeatCustom,
      repeatCustomLabel: target.repeatCustomLabel,
      priority: target.priority,
      kind: target.kind,
      memo: target.memo,
      syncToGoogleCalendar: false,
    })
    setActiveTab('schedule-create')
  }

  const importGoogleCalendarEvent = (event: { summary?: string; description?: string; start?: { date?: string; dateTime?: string } }) => {
    const { date, time } = parseGoogleEventDate(event.start?.date, event.start?.dateTime)
    const matchedProject =
      projects.find((project) => event.description?.includes(`프로젝트: ${project.name}`)) ??
      projects.find((project) => event.summary?.includes(project.name)) ??
      projects[0]

    setEditingScheduleId(null)
      setScheduleForm({
        projectId: matchedProject?.id ?? '',
        title: event.summary || '가져온 일정',
        date,
        time,
      repeatType: 'none',
        repeatCustom: '',
        repeatCustomLabel: '',
        priority: '보통',
        kind: 'general',
        memo: normalizeImportedCalendarDescription(event.description),
        syncToGoogleCalendar: false,
      })
    setIsCustomRepeatMenuOpen(false)
    setActiveTab('schedule-create')
  }

  const removeProject = (projectId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('정말 삭제하시겠습니까?')) return
    const remainingProjects = projects.filter((project) => project.id !== projectId)
    setProjects(remainingProjects)
    setSchedules((current) => current.filter((schedule) => schedule.projectId !== projectId))
    if (editingProjectId === projectId) resetProjectForm()
    if (scheduleForm.projectId === projectId) resetScheduleForm(remainingProjects[0]?.id ?? '')
  }

  const removeSchedule = (scheduleId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('정말 삭제하시겠습니까?')) return
    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
    if (editingScheduleId === scheduleId) resetScheduleForm(scheduleForm.projectId)
  }
  const renderTabContent = () => {
    if (activeTab === 'project-view') {
      return (
        <Card padding="lg" className="border-transparent bg-surface-primary shadow-m">
          <div className="space-y-4">
            {projectTimelineCards.map((project) => (
                <Card key={project.id} padding="md" className="border-black/5 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_28px_rgba(15,23,42,0.05)]">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
                        <div className="space-y-2 pt-1 lg:flex lg:min-h-[72px] lg:flex-col lg:justify-between lg:pt-1.5">
                          <button type="button" onClick={() => applyProjectAllSchedulesShortcut(project.id)} className="w-fit text-left transition hover:opacity-80">
                            <Text variant="projectTitle" as="h3" color="text-fg-primary">{project.name}</Text>
                          </button>
                          <div className="flex flex-wrap items-center gap-2">
                            <Text variant="detail20" color="text-fg-secondary">{project.duration}</Text>
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            <Text variant="detail20" color="text-fg-secondary">{project.owner}</Text>
                          </div>
                      </div>
                      <div className="flex flex-col items-start gap-3 lg:min-h-[72px] lg:items-end lg:justify-between">
                        <div className="flex items-center gap-2">
                          <ProjectActionIconButton label="프로젝트 수정" onClick={() => editProject(project.id)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </ProjectActionIconButton>
                          <ProjectActionIconButton label="프로젝트 삭제" onClick={() => removeProject(project.id)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </ProjectActionIconButton>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ProjectMetaBadge className="border-red-300 bg-red-300/15 text-red-900" label={project.priority} />
                          <ProjectMetaBadge
                            className="border-blue-200 bg-blue-50 text-blue-900"
                            label={`잔여 일정 ${project.remainingCount}건`}
                            onClick={() => applyProjectRemainingShortcut(project.id)}
                          />
                        </div>
                      </div>
                    </div>
                    <TimelineTrack
                      startMonth={getMonthIndexFromDate(project.startDate)}
                      endMonth={getMonthIndexFromDate(project.endDate)}
                      onMonthClick={(monthIndex) => applyProjectMonthShortcut(project.id, monthIndex)}
                    />
                    <div className="space-y-3">
                        <Text variant="detail20" color="text-fg-tertiary">다음 일정</Text>
                        {project.nextSchedules.length > 0 ? (
                            <div
                                className={`grid gap-3 ${
                                project.hiddenNextScheduleCount > 0
                                  ? 'xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_44px]'
                                  : 'xl:grid-cols-2'
                              }`}
                            >
                              {project.nextSchedules.map((schedule) => (
                                <div key={schedule.id} className="rounded-[24px] bg-[linear-gradient(135deg,_rgba(248,250,252,0.98)_0%,_rgba(243,246,249,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <CompactScheduleBadge
                                      className={schedule.kind === 'major' ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white text-fg-tertiary'}
                                      label={schedule.kind === 'major' ? '주요 일정' : '일반 일정'}
                                    />
                                    <CompactScheduleBadge className={schedule.priority === '최우선' ? 'border-red-300 bg-red-300/15 text-red-900' : schedule.priority === '높음' ? 'border-amber-400 bg-amber-100 text-amber-950' : 'border-blue-200 bg-blue-50 text-blue-900'} label={schedule.priority} />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ProjectActionIconButton label="일정 수정" onClick={() => editSchedule(schedule.id)}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                      </svg>
                                    </ProjectActionIconButton>
                                    <ProjectActionIconButton label="일정 삭제" onClick={() => removeSchedule(schedule.id)}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4h8v2" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                      </svg>
                                    </ProjectActionIconButton>
                                  </div>
                                </div>
                                  <Text variant="detail20" color="text-fg-primary" className="mt-3">{schedule.title}</Text>
                                  <Text variant="detail20" color="text-fg-secondary" className="mt-1">{formatDateLabel(schedule.date, schedule.time)}</Text>
                                </div>
                              ))}
                              {project.hiddenNextScheduleCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => applyProjectRemainingShortcut(project.id)}
                                  className="group flex min-h-[88px] w-full items-center justify-end transition hover:opacity-80 xl:min-h-[132px]"
                                  aria-label={`${project.name}의 남은 일정 보기`}
                                >
                                  <svg
                                    width="22"
                                    height="88"
                                    viewBox="0 0 22 88"
                                    fill="none"
                                    className="text-fg-tertiary opacity-40 transition group-hover:text-fg-secondary group-hover:opacity-60 xl:h-[132px] xl:w-[26px]"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M4 8L18 44L4 80"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              )}
                          </div>
                        ) : (
                        <div className="rounded-[24px] bg-surface-primary p-4">
                          <Text variant="detail20" color="text-fg-primary">남아 있는 일정이 없습니다.</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </Card>
      )
    }

    if (activeTab === 'schedule-list') {
      return (
        <Card padding="lg" className="border-transparent bg-white shadow-m">
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.82fr))] xl:items-end">
                <label className="block space-y-2"><Text variant="detail20" color="text-fg-tertiary">프로젝트별</Text><select value={scheduleFilters.projectId} onChange={handleScheduleFilterChange('projectId')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="">전체 프로젝트</option>{projectOptions.map((project) => <option key={project.value} value={project.value}>{project.label}</option>)}</select></label>
                <label className="block space-y-2"><Text variant="detail20" color="text-fg-tertiary">시작일</Text><input type="date" value={scheduleFilters.startDate} onChange={handleScheduleFilterChange('startDate')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
                <label className="block space-y-2"><Text variant="detail20" color="text-fg-tertiary">종료일</Text><input type="date" value={scheduleFilters.endDate} onChange={handleScheduleFilterChange('endDate')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
                <label className="block space-y-2"><Text variant="detail20" color="text-fg-tertiary">중요도별</Text><select value={scheduleFilters.priority} onChange={handleScheduleFilterChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="">전체 중요도</option><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select></label>
                <label className="block space-y-2"><Text variant="detail20" color="text-fg-tertiary">일정 구분</Text><select value={scheduleFilters.kind} onChange={handleScheduleFilterChange('kind')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="">전체 일정</option><option value="major">주요 일정</option><option value="general">일반 일정</option></select></label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-surface-primary px-4 py-3">
                <Text variant="detail20" color="text-fg-secondary">현재 조건에 맞는 일정 {filteredSchedules.length}건</Text>
                <Button
                  variant="outlineDark"
                  size="sm"
                  shape="round"
                  onClick={() => {
                    setScheduleProjectShortcutId(null)
                    setScheduleQuickFilter('all')
                    setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '', kind: '' })
                  }}
                >
                  필터 초기화
                </Button>
              </div>

              <div className="space-y-3">
                {filteredSchedules.map((schedule) => {
                  const project = projects.find((item) => item.id === schedule.projectId)
                  return (
                    <Card
                      key={schedule.id}
                      padding="md"
                      className={`${highlightedScheduleId === schedule.id ? 'border-blue-300 shadow-[0_0_0_1px_rgba(37,99,235,0.14),0_10px_24px_rgba(37,99,235,0.12)]' : 'border-transparent'} ${getScheduleCardTone(schedule.priority)} shadow-s transition-shadow`}
                    >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                                <button type="button" onClick={() => editSchedule(schedule.id)} className="w-fit text-left transition hover:opacity-80">
                                  <Text variant="projectTitle" as="h3" color="text-fg-primary" className="pt-1">
                                    {schedule.title}
                                  </Text>
                                </button>
                              <div className="flex items-center gap-2">
                                <ProjectActionIconButton label="구글 캘린더에 추가" onClick={() => void handleAddScheduleToCalendar(schedule, project?.name)}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="5" width="18" height="16" rx="2" />
                                    <path d="M16 3v4" />
                                    <path d="M8 3v4" />
                                    <path d="M3 11h18" />
                                    <path d="M12 14v4" />
                                    <path d="M10 16h4" />
                                  </svg>
                                </ProjectActionIconButton>
                                <ProjectActionIconButton label="일정 수정" onClick={() => editSchedule(schedule.id)}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                  </svg>
                                </ProjectActionIconButton>
                                <ProjectActionIconButton label="일정 삭제" onClick={() => removeSchedule(schedule.id)}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                  </svg>
                                </ProjectActionIconButton>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                              <div className="flex flex-wrap items-center gap-2">
                                <Text variant="detail20" color="text-fg-secondary">{project?.name ?? '연결된 프로젝트 없음'}</Text>
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                <Text variant="detail20" color="text-fg-secondary">{formatDateLabel(schedule.date, schedule.time)}</Text>
                              </div>
                              <div className="flex flex-wrap gap-2 lg:justify-end">
                                <CompactScheduleBadge
                                  className={schedule.kind === 'major' ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white text-fg-tertiary'}
                                  label={schedule.kind === 'major' ? '주요 일정' : '일반 일정'}
                                />
                                <CompactScheduleBadge className={schedule.priority === '최우선' ? 'border-red-300 bg-red-300/15 text-red-900' : schedule.priority === '높음' ? 'border-amber-500 bg-amber-300/15 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900'} label={schedule.priority} />
                              </div>
                            </div>
                            <Text variant="detail20" color="text-fg-tertiary">{formatRepeatLabel(schedule)}</Text>
                          </div>
                          <Text variant="detail20" color="text-fg-primary">{renderAutoLinkedText(schedule.memo)}</Text>
                        </div>
                      </Card>
                  )
                })}
                {filteredSchedules.length === 0 && <Card padding="md" className="border-[var(--color-border)] bg-surface shadow-s"><Text variant="detail20" color="text-fg-secondary">선택한 조건에 맞는 일정이 없습니다.</Text></Card>}
              </div>
            </div>
          </Card>
        )
    }

    if (activeTab === 'project-create') {
      return (
        <Card padding="lg" className="border-transparent bg-white shadow-m">
          <div className="space-y-6">
            <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">프로젝트 이름</Text><input value={projectForm.name} onChange={handleProjectChange('name')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="프로젝트 이름을 입력해 주세요" /></label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">담당 조직</Text><input value={projectForm.owner} onChange={handleProjectChange('owner')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="담당 팀 또는 담당자를 입력해 주세요" /></label>
                  <label className="block space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Text variant="detail20" color="text-fg-tertiary">우선순위</Text>
                      <FieldHelpButton
                        label="프로젝트 우선순위"
                        note="프로젝트의 전체 중요도를 정하는 값입니다. 최우선은 가장 먼저 챙겨야 할 프로젝트, 높음은 주요하게 관리할 프로젝트, 보통은 일반 관리 대상으로 이해하면 됩니다."
                        isOpen={activeFieldHelp === 'project-priority'}
                        onToggle={() => setActiveFieldHelp((current) => current === 'project-priority' ? null : 'project-priority')}
                      />
                    </div>
                    <select value={projectForm.priority} onChange={handleProjectChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select>
                  </label>
                </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">시작일</Text><input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value, periodPreset: 'custom' }))} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
                <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">종료일</Text><input type="date" value={projectForm.endDate} onChange={(event) => setProjectForm((current) => ({ ...current, endDate: event.target.value, periodPreset: 'custom' }))} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
              </div>
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset === 'half-1')} onClick={() => applyProjectPeriodPreset('half-1')}>상반기</Button>
                    <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset === 'half-2')} onClick={() => applyProjectPeriodPreset('half-2')}>하반기</Button>
                    <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset === 'quarter-1')} onClick={() => applyProjectPeriodPreset('quarter-1')}>1분기</Button>
                    <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset === 'quarter-2')} onClick={() => applyProjectPeriodPreset('quarter-2')}>2분기</Button>
                    <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset === 'quarter-3')} onClick={() => applyProjectPeriodPreset('quarter-3')}>3분기</Button>
                    <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset === 'quarter-4')} onClick={() => applyProjectPeriodPreset('quarter-4')}>4분기</Button>
                    <div className="relative">
                      <Button variant="outlineDark" size="sm" shape="round" className={getProjectPresetButtonClass(projectForm.periodPreset.startsWith('month-'))} onClick={() => setIsProjectPeriodMenuOpen((current) => !current)}>
                        월별 선택
                      </Button>
                      {isProjectPeriodMenuOpen && (
                        <Card padding="sm" className="absolute left-0 top-full z-20 mt-1 border-black/15 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] md:left-full md:top-1/2 md:ml-1.5 md:mt-0 md:-translate-y-1/2">
                          <div className="flex w-max min-w-[492px] flex-nowrap gap-2">
                            {Array.from({ length: 12 }, (_, index) => {
                              const preset = `month-${index + 1}` as ProjectPeriodPreset
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => applyProjectPeriodPreset(preset)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                    projectForm.periodPreset === preset
                                      ? 'border-black bg-black text-white'
                                      : 'border-black/30 bg-surface text-fg-primary hover:border-black/60'
                                  }`}
                                >
                                  <Text variant="detail20" color={projectForm.periodPreset === preset ? 'text-white' : 'text-fg-primary'}>
                                    {index + 1}
                                  </Text>
                                </button>
                              )
                            })}
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button variant="primary" size="sm" shape="round" onClick={saveProject}>{editingProjectId ? '프로젝트 수정 완료' : '새 프로젝트 추가'}</Button>
                <Button variant="outlineDark" size="sm" shape="round" onClick={resetProjectForm}>입력 초기화</Button>
              </div>
          </div>
        </Card>
      )
    }
    if (activeTab === 'schedule-create') {
      return (
        <Card padding="lg" className="border-transparent bg-white shadow-m">
          <div className="space-y-6">
            <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">일정 이름</Text><input value={scheduleForm.title} onChange={handleScheduleChange('title')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="일정 이름을 입력해 주세요" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">연결 프로젝트</Text><select value={scheduleForm.projectId} onChange={handleScheduleChange('projectId')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">{projectOptions.map((project) => <option key={project.value} value={project.value}>{project.label}</option>)}</select></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">날짜</Text><input type="date" value={scheduleForm.date} onChange={handleScheduleChange('date')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">시간</Text><input type="time" value={scheduleForm.time} onChange={handleScheduleChange('time')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">반복 여부</Text><select value={scheduleForm.repeatType} onChange={(event) => {
                const nextValue = event.target.value as ScheduleRepeatType
                if (nextValue === 'custom') {
                  setScheduleForm((current) => ({ ...current, repeatType: 'custom' }))
                  setIsCustomRepeatMenuOpen(true)
                  return
                }
                setScheduleForm((current) => ({ ...current, repeatType: nextValue, repeatCustom: '', repeatCustomLabel: '' }))
                setIsCustomRepeatMenuOpen(false)
              }} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="none">{repeatOptionLabels.none}</option><option value="daily">{repeatOptionLabels.daily}</option><option value="weekday">{repeatOptionLabels.weekday}</option><option value="weekly">{repeatOptionLabels.weekly}</option><option value="monthly">{repeatOptionLabels.monthly}</option><option value="yearly">{repeatOptionLabels.yearly}</option><option value="custom">{repeatOptionLabels.custom}</option></select></label>
            </div>
            {scheduleForm.repeatType === 'custom' && (
              <div className="space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">맞춤 설정</Text>
                <div className="relative">
                  <Button variant="outlineDark" size="sm" shape="round" onClick={() => setIsCustomRepeatMenuOpen((current) => !current)}>
                    {scheduleForm.repeatCustomLabel || customRepeatPreviewLabel}
                  </Button>
                  {isCustomRepeatMenuOpen && (
                    <Card padding="md" className="absolute left-0 top-[58px] z-20 w-full border-[var(--color-border)] bg-white shadow-l">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-[100px_minmax(0,1fr)]">
                          <label className="block space-y-2">
                            <Text variant="detail20" color="text-fg-tertiary">반복</Text>
                            <input type="number" min="1" value={customRepeatConfig.interval} onChange={handleCustomRepeatChange('interval')} className="w-full rounded-[18px] border border-[var(--color-border)] bg-surface px-3 py-2 text-body1 text-fg-primary outline-none transition focus:border-blue-800" />
                          </label>
                          <label className="block space-y-2">
                            <Text variant="detail20" color="text-fg-tertiary">주기</Text>
                            <select value={customRepeatConfig.frequency} onChange={handleCustomRepeatChange('frequency')} className="w-full rounded-[18px] border border-[var(--color-border)] bg-surface px-3 py-2 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                              <option value="DAILY">일</option>
                              <option value="WEEKLY">주</option>
                              <option value="MONTHLY">월</option>
                              <option value="YEARLY">년</option>
                            </select>
                          </label>
                        </div>
                        {customRepeatConfig.frequency === 'WEEKLY' && (
                          <div className="space-y-2">
                            <Text variant="detail20" color="text-fg-tertiary">반복 요일</Text>
                            <div className="flex flex-wrap gap-2">
                              {repeatWeekdayOptions.map((day) => (
                                <Button key={day.key} variant={customRepeatConfig.weeklyDays.includes(day.key) ? 'primary' : 'outlineDark'} size="sm" shape="round" onClick={() => toggleCustomRepeatWeekday(day.key)}>
                                  {day.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap justify-end gap-3">
                          <Button variant="outlineDark" size="sm" shape="round" onClick={() => setIsCustomRepeatMenuOpen(false)}>
                            닫기
                          </Button>
                          <Button variant="primary" size="sm" shape="round" onClick={applyCustomRepeatConfig}>
                            적용
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Text variant="detail20" color="text-fg-tertiary">일정 구분</Text>
                    <FieldHelpButton
                      label="일정 구분"
                      note="주요 일정은 꼭 챙겨야 하는 마일스톤이나 핵심 일정입니다. 일반 일정은 진행 중 확인이 필요한 일반 업무 일정입니다."
                      isOpen={activeFieldHelp === 'schedule-kind'}
                      onToggle={() => setActiveFieldHelp((current) => current === 'schedule-kind' ? null : 'schedule-kind')}
                    />
                  </div>
                  <select value={scheduleForm.kind} onChange={handleScheduleChange('kind')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="major">주요 일정</option><option value="general">일반 일정</option></select>
                </label>
                <label className="block space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Text variant="detail20" color="text-fg-tertiary">우선순위</Text>
                    <FieldHelpButton
                      label="일정 우선순위"
                      note="일정 우선순위는 개별 일정의 시급함을 나타냅니다. 최우선은 당장 챙겨야 하는 일정, 높음은 가까운 시점에 우선 확인할 일정, 보통은 일반 관리 일정입니다."
                      isOpen={activeFieldHelp === 'schedule-priority'}
                      onToggle={() => setActiveFieldHelp((current) => current === 'schedule-priority' ? null : 'schedule-priority')}
                    />
                  </div>
                  <select value={scheduleForm.priority} onChange={handleScheduleChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_224px] md:items-start">
                <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">메모</Text><input value={scheduleForm.memo} onChange={handleScheduleChange('memo')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="회의 목적이나 체크포인트를 적어 주세요" /></label>
                <div className="space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary" className="opacity-0">구글 캘린더 등록</Text>
                  <label className="flex h-[52px] w-full items-center justify-end gap-3 pr-5">
                    <input type="checkbox" checked={scheduleForm.syncToGoogleCalendar} onChange={(event) => setScheduleForm((current) => ({ ...current, syncToGoogleCalendar: event.target.checked }))} className="h-4 w-4 rounded border-[var(--color-border)]" />
                    <Text variant="detail20" color="text-fg-primary">구글 캘린더에도 등록</Text>
                  </label>
                </div>
              </div>
            <div className="flex flex-wrap gap-3"><Button variant="primary" size="sm" shape="round" loading={isSavingEvent} onClick={() => void saveSchedule()}>{editingScheduleId ? '일정 수정 완료' : '일정 저장'}</Button><Button variant="outlineDark" size="sm" shape="round" onClick={() => resetScheduleForm(scheduleForm.projectId)}>입력 초기화</Button></div>
          </div>
        </Card>
      )
    }

      return (
        <div className="space-y-6">
          <Card padding="md" className="border-transparent bg-white shadow-m">
            <div className="space-y-6">
              {googleClientId ? (
                  <div className="space-y-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2"><Text variant="body24" color="text-fg-primary">구글 계정 연동</Text><Text variant="detail20" color="text-fg-secondary">{isConnected ? `${googleEmail || '연결된 계정'}으로 로그인되어 있습니다. 저장할 캘린더를 직접 고를 수 있어요.` : '구글 계정을 연결하면 선택한 캘린더에 일정을 직접 저장할 수 있습니다.'}</Text></div>
                        {isConnected ? (
                          <div className="flex flex-col gap-2">
                            <Button variant="primary" size="sm" shape="round" disabled={!calendarViewUrl} onClick={() => calendarViewUrl && openGoogleCalendar(calendarViewUrl)}>캘린더 크게 열기</Button>
                            <Button variant="outlineDark" size="sm" shape="round" onClick={disconnect}>연결 해제</Button>
                          </div>
                        ) : <Button variant="primary" size="sm" shape="round" loading={isAuthorizing} onClick={() => void connectGoogleCalendar()}>구글 로그인</Button>}
                      </div>
                      {isConnected && <label className="block max-w-[720px] space-y-3"><Text variant="detail20" color="text-fg-tertiary">저장할 캘린더 선택</Text><select value={selectedCalendarId} onChange={(event) => setSelectedCalendarId(event.target.value)} className="w-full rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.summary}{calendar.primary ? ' (기본)' : ''}</option>)}</select></label>}
                      {isConnected && isCalendarsLoading && <Text variant="detail20" color="text-fg-secondary">캘린더 목록을 불러오는 중입니다.</Text>}
                  </div>
                ) : (
                  <Card padding="md" className="border-[var(--color-border)] bg-surface-primary shadow-s"><Text variant="detail20" color="text-fg-secondary">`NEXT_PUBLIC_GOOGLE_CLIENT_ID`를 설정하면 구글 계정 로그인과 캘린더 직접 저장 기능을 사용할 수 있습니다.</Text></Card>
                )}
              {!isConnected && <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">열어볼 캘린더 ID 또는 이메일</Text><input value={calendarId} onChange={(event) => setCalendarId(event.target.value)} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="example@group.calendar.google.com" /></label>}
            </div>
          </Card>
        <Card padding="none" className="overflow-hidden border-transparent bg-white shadow-m">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-primary">
                  {activeCalendarPanelTab === 'preview' ? '선택한 구글 캘린더 보기' : '일정 가져오기'}
                </Text>
                <Text variant="detail20" color="text-fg-secondary" className="mt-2">
                  {activeCalendarPanelTab === 'preview'
                    ? effectiveCalendarId || '캘린더 ID를 입력하거나 구글 계정에 로그인하면 여기에 표시됩니다.'
                    : '내 일정으로 가져올 수 있는 구글 캘린더 일정입니다.'}
                </Text>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={activeCalendarPanelTab === 'preview' ? 'primary' : 'outlineDark'}
                  size="sm"
                  shape="round"
                  className={activeCalendarPanelTab === 'preview' ? '' : 'border-black/20 text-black hover:border-black/30 hover:bg-black/[0.03] active:bg-black/[0.05]'}
                  onClick={() => setActiveCalendarPanelTab('preview')}
                >
                  캘린더 보기
                </Button>
                <Button
                  variant={activeCalendarPanelTab === 'import' ? 'primary' : 'outlineDark'}
                  size="sm"
                  shape="round"
                  className={activeCalendarPanelTab === 'import' ? '' : 'border-black/20 text-black hover:border-black/30 hover:bg-black/[0.03] active:bg-black/[0.05]'}
                  onClick={() => setActiveCalendarPanelTab('import')}
                >
                  일정 가져오기
                </Button>
              </div>
            </div>
          </div>

          {activeCalendarPanelTab === 'preview' ? (
            calendarEmbedUrl ? (
              <iframe title="Google Calendar Preview" src={calendarEmbedUrl} className="h-[520px] w-full border-0" />
            ) : (
              <div className="px-6 py-10">
                <Text variant="detail20" color="text-fg-secondary">표시할 캘린더를 아직 고르지 않았습니다.</Text>
              </div>
            )
          ) : isConnected && selectedCalendarId ? (
            <div className="px-6 py-6">
              {isEventsLoading ? (
                <Text variant="detail20" color="text-fg-secondary">선택한 캘린더의 일정을 불러오는 중입니다.</Text>
              ) : events.length > 0 ? (
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {events.map((event) => {
                    const { date, time } = parseGoogleEventDate(event.start?.date, event.start?.dateTime)
                    return (
                      <Card key={event.id} padding="md" className="border-[var(--color-border)] bg-surface-primary shadow-s">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <Text variant="projectTitle" as="h3" color="text-fg-primary">{event.summary || '제목 없는 일정'}</Text>
                            <Text variant="detail20" color="text-fg-secondary">{formatDateLabel(date, time)}</Text>
                          </div>
                          <Button variant="outlineDark" size="sm" shape="round" className="whitespace-nowrap" onClick={() => importGoogleCalendarEvent(event)}>
                            내 일정 등록
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Text variant="detail20" color="text-fg-secondary">가져올 수 있는 일정이 아직 없습니다.</Text>
              )}
            </div>
          ) : (
            <div className="px-6 py-10">
              <Text variant="detail20" color="text-fg-secondary">일정을 가져오려면 먼저 구글 계정을 연결하고 저장할 캘린더를 선택해 주세요.</Text>
            </div>
          )}
        </Card>
      </div>
    )
  }
  return (
    <main className="min-h-screen bg-surface">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setIsGoogleScriptReady(true)} />
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
          <div className="flex items-center justify-between gap-4 px-1">
            <button type="button" onClick={goToDashboardHome} className="text-left">
              <Text variant="dashboardLabel" color="text-black">업무 대시보드</Text>
            </button>
            {isConnected ? (
            <button type="button" className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-left shadow-s transition hover:bg-surface-primary" onClick={() => setActiveTab('calendar')}>
              <Text variant="detail20" color="text-fg-primary">{googleEmail || '연결된 구글 계정'}</Text>
            </button>
            ) : (
            <Button variant="outlineDark" size="sm" shape="round" loading={isAuthorizing} onClick={() => { void connectGoogleCalendar() }}>
              로그인
            </Button>
          )}
        </div>
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-50 via-white to-teal-300/20 p-5 shadow-l md:p-6">
            <div className="space-y-3">
              <div className="grid gap-2 lg:grid-cols-4">
                {summaryCards.map((card) => (
                  <Card key={card.label} padding="sm" className="border-transparent bg-white/90 backdrop-blur">
                    <button type="button" className="w-full text-left" onClick={() => applySummaryShortcut(card.tab, card.quickFilter, card.filters)}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <Text variant="detail20" color="text-fg-tertiary">{card.label}</Text>
                          <div className="group relative shrink-0" onClick={(event) => event.stopPropagation()}>
                            <button type="button" className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[12px] font-[700] text-fg-tertiary" aria-label={`${card.label} 설명 보기`}>?</button>
                            <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-[220px] rounded-[20px] bg-gray-800 px-4 py-3 text-left shadow-l group-hover:block group-focus-within:block"><Text variant="detail20" color="text-alpha-white-700">{card.note}</Text></div>
                          </div>
                        </div>
                        <Text variant="detail20" as="p" color="text-fg-primary" className="font-[700]">{card.value}</Text>
                      </div>
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <Card padding="md" className="border-transparent bg-white shadow-m"><div className="flex flex-wrap gap-3">{tabs.map((tab) => <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'outlineDark'} size="sm" shape="round" className={activeTab === tab.key ? '' : 'border-black/20 text-black hover:border-black/30 hover:bg-black/[0.03] active:bg-black/[0.05]'} onClick={() => setActiveTab(tab.key)}>{tab.label}</Button>)}</div></Card>
            {renderTabContent()}
          </section>
      </div>
    </main>
  )
}
