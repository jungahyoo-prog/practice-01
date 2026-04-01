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
type ScheduleQuickFilter = 'all' | 'major' | 'high-priority'
type CalendarFeedback = { tone: 'default' | 'success' | 'error'; text: string }

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

const defaultScheduleForm = (projectId: string): ScheduleFormState => ({
  projectId,
  title: '',
  date: '2026-04-01',
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

function TimelineTrack({ startMonth, endMonth }: { startMonth: number; endMonth: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] gap-2" style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(0, 1fr))` }}>
        {timelineMonths.map((month, index) => {
          const isActive = index >= startMonth && index <= endMonth
          return (
            <div key={month} className="space-y-2">
              <div className="rounded-full bg-surface-primary px-3 py-2 text-center">
                <Text variant="detail20" color="text-fg-tertiary" align="center">{month}</Text>
              </div>
              <div className={['h-4 rounded-full transition-colors', isActive ? 'bg-blue-800 shadow-s' : 'bg-surface-primary'].join(' ')} />
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
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm(initialProjects[0].id))
  const [isCustomRepeatMenuOpen, setIsCustomRepeatMenuOpen] = useState(false)
  const [customRepeatConfig, setCustomRepeatConfig] = useState<CustomRepeatConfig>({ interval: '1', frequency: 'WEEKLY', weeklyDays: [String(new Date(`${defaultScheduleForm(initialProjects[0].id).date}T00:00:00`).getDay())] })
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilters>({ projectId: '', startDate: '', endDate: '', priority: '' })
  const [scheduleQuickFilter, setScheduleQuickFilter] = useState<ScheduleQuickFilter>('all')
  const [scheduleProjectShortcutId, setScheduleProjectShortcutId] = useState<string | null>(null)
  const { authorize, calendars, disconnect, googleClientId, googleEmail, authError, isAuthorizing, isCalendarsLoading, isConnected, isSavingEvent, selectedCalendar, selectedCalendarId, setSelectedCalendarId, addEventToCalendar } = useGoogleCalendar(isGoogleScriptReady)

  const projectOptions = useMemo(() => projects.map((project) => ({ value: project.id, label: project.name })), [projects])
  const sortedSchedules = useMemo(() => [...schedules].sort((a, b) => buildDateTimeValue(a.date, a.time).localeCompare(buildDateTimeValue(b.date, b.time))), [schedules])
  const todaySchedules = useMemo(() => sortedSchedules.filter((schedule) => schedule.date === todayKey).slice(0, 3), [sortedSchedules, todayKey])
  const upcomingSchedules = useMemo(() => sortedSchedules.filter((schedule) => schedule.date > todayKey).slice(0, 4), [sortedSchedules, todayKey])

  const filteredSchedules = useMemo(
    () =>
      sortedSchedules.filter((schedule) => {
        const matchesProject = !scheduleFilters.projectId || schedule.projectId === scheduleFilters.projectId
        const matchesStartDate = !scheduleFilters.startDate || schedule.date >= scheduleFilters.startDate
        const matchesEndDate = !scheduleFilters.endDate || schedule.date <= scheduleFilters.endDate
        const matchesPriority = !scheduleFilters.priority || schedule.priority === scheduleFilters.priority
        const matchesQuickFilter = scheduleQuickFilter === 'all' ? true : scheduleQuickFilter === 'major' ? schedule.kind === 'major' : schedule.priority === '최우선' || schedule.priority === '높음'
        return matchesProject && matchesStartDate && matchesEndDate && matchesPriority && matchesQuickFilter
      }),
    [scheduleFilters, scheduleQuickFilter, sortedSchedules],
  )

  const getProjectPresetButtonClass = (isActive: boolean) =>
    [
      'h-[30px] px-[14px] py-0 text-[11px] leading-[16px] tracking-[0px] border rounded-full',
      isActive ? 'border-black bg-black text-white hover:bg-black active:bg-black' : 'border-black/35 bg-white text-black hover:bg-black/5 active:bg-black/10',
    ].join(' ')

  const projectTimelineCards = useMemo(
    () =>
      projects.map((project) => {
        const milestones = sortedSchedules.filter((schedule) => schedule.projectId === project.id && schedule.kind === 'major' && schedule.date >= todayKey)
        const remainingCount = sortedSchedules.filter((schedule) => schedule.projectId === project.id && schedule.date >= todayKey).length
        const nextMilestone = milestones[0]
        return {
          ...project,
          duration: formatProjectDuration(project.startDate, project.endDate),
          remainingCount,
          milestone: nextMilestone ? `${nextMilestone.title} · ${formatDateLabel(nextMilestone.date, nextMilestone.time)}` : '남아 있는 주요 일정이 없습니다.',
        }
      }),
    [projects, sortedSchedules, todayKey],
  )

  const summaryCards = useMemo(
    () => [
      { label: '진행 중 프로젝트', value: `${projects.length}개`, note: '현재 등록된 프로젝트 전체 개수입니다.', tab: 'project-view' as DashboardTab, quickFilter: 'all' as ScheduleQuickFilter },
      { label: '남아 있는 주요 일정', value: `${schedules.filter((schedule) => schedule.kind === 'major' && schedule.date >= todayKey).length}건`, note: '오늘 이후 기준으로 남아 있는 주요 일정입니다.', tab: 'schedule-list' as DashboardTab, quickFilter: 'major' as ScheduleQuickFilter },
      { label: '높은 우선순위 업무', value: `${schedules.filter((schedule) => schedule.priority !== '보통').length}건`, note: '최우선 또는 높음으로 분류된 일정입니다.', tab: 'schedule-list' as DashboardTab, quickFilter: 'high-priority' as ScheduleQuickFilter },
    ],
    [projects.length, schedules, todayKey],
  )
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
        setActiveTab('calendar')
      } catch {
        setCalendarFeedback({ tone: 'error', text: '구글 캘린더 저장에 실패했습니다. 로그인 상태나 권한을 다시 확인해 주세요.' })
      }
      return
    }

    openGoogleCalendar(buildGoogleCalendarEventUrl({ ...schedule, repeatCustom: resolvedRepeatCustom, repeatCustomLabel: resolvedRepeatCustomLabel }, projectName, effectiveCalendarId))
    setCalendarFeedback({ tone: 'default', text: '로그인 연동이 없어 브라우저의 기본 캘린더 추가 화면으로 열었습니다.' })
  }

  const applySummaryShortcut = (tab: DashboardTab, quickFilter: ScheduleQuickFilter) => {
    setActiveTab(tab)
    setScheduleProjectShortcutId(null)
    if (tab === 'schedule-list') {
      setScheduleQuickFilter(quickFilter)
      setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '' })
      return
    }
    setScheduleQuickFilter('all')
  }

  const applyProjectRemainingShortcut = (projectId: string) => {
    setActiveTab('schedule-list')
    setScheduleQuickFilter('all')
    setScheduleProjectShortcutId(projectId)
    setScheduleFilters({ projectId, startDate: todayKey, endDate: '', priority: '' })
  }

  const handleProjectChange = (field: keyof ProjectFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProjectForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleChange = (field: keyof ScheduleFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setScheduleForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleFilterChange = (field: keyof ScheduleFilters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setScheduleProjectShortcutId(null)
    setScheduleFilters((current) => ({ ...current, [field]: event.target.value as ScheduleFilters[typeof field] }))
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
    setScheduleForm(defaultScheduleForm(projectId ?? projects[0]?.id ?? ''))
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
      await handleAddScheduleToCalendar(nextSchedule, projects.find((project) => project.id === nextSchedule.projectId)?.name)
    }

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

  const removeProject = (projectId: string) => {
    const remainingProjects = projects.filter((project) => project.id !== projectId)
    setProjects(remainingProjects)
    setSchedules((current) => current.filter((schedule) => schedule.projectId !== projectId))
    if (editingProjectId === projectId) resetProjectForm()
    if (scheduleForm.projectId === projectId) resetScheduleForm(remainingProjects[0]?.id ?? '')
  }

  const removeSchedule = (scheduleId: string) => {
    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
    if (editingScheduleId === scheduleId) resetScheduleForm(scheduleForm.projectId)
  }
  const renderTabContent = () => {
    if (activeTab === 'project-view') {
      return (
        <Card padding="lg" className="border-transparent bg-surface-primary shadow-m">
          <div className="space-y-4">
            {projectTimelineCards.map((project) => (
              <Card key={project.id} padding="md" className="border-transparent bg-white shadow-s">
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <Text variant="body24" as="h3" color="text-fg-primary">{project.name}</Text>
                      <div className="flex flex-wrap items-center gap-2">
                        <Text variant="detail20" color="text-fg-secondary">{project.duration}</Text>
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <Text variant="detail20" color="text-fg-secondary">{project.owner}</Text>
                      </div>
                    </div>
                      <div className="flex flex-wrap gap-2">
                        <PriorityBadge priority={project.priority} />
                        <button
                          type="button"
                          onClick={() => applyProjectRemainingShortcut(project.id)}
                          className="rounded-full bg-blue-50 px-3 py-2 transition hover:bg-blue-100"
                        >
                          <Text variant="detail20" color="text-blue-900">잔여 일정 {project.remainingCount}건</Text>
                        </button>
                      </div>
                    </div>
                  <TimelineTrack startMonth={getMonthIndexFromDate(project.startDate)} endMonth={getMonthIndexFromDate(project.endDate)} />
                  <div className="rounded-[24px] bg-surface-primary p-4">
                    <Text variant="detail20" color="text-fg-tertiary">다음 주요 일정</Text>
                    <Text variant="detail20" color="text-fg-primary" className="mt-2">{project.milestone}</Text>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outlineDark" size="sm" shape="round" onClick={() => editProject(project.id)}>프로젝트 수정</Button>
                    <Button variant="outlineDark" size="sm" shape="round" onClick={() => removeProject(project.id)}>프로젝트 삭제</Button>
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
              {(scheduleQuickFilter !== 'all' || scheduleProjectShortcutId) && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-blue-50 px-4 py-3">
                  <Text variant="detail20" color="text-blue-900">
                    {scheduleProjectShortcutId
                      ? `${projects.find((project) => project.id === scheduleProjectShortcutId)?.name ?? '선택한 프로젝트'}의 금일 기준 잔여 일정만 보도록 필터가 적용되었습니다.`
                      : scheduleQuickFilter === 'major'
                        ? '요약 박스에서 남아 있는 주요 일정만 보도록 필터가 적용되었습니다.'
                        : '요약 박스에서 높은 우선순위 일정만 보도록 필터가 적용되었습니다.'}
                  </Text>
                  <Button
                    variant="outlineDark"
                    size="sm"
                    shape="round"
                    onClick={() => {
                      setScheduleQuickFilter('all')
                      setScheduleProjectShortcutId(null)
                      setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '' })
                    }}
                  >
                    요약 필터 해제
                  </Button>
                </div>
              )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">프로젝트별</Text><select value={scheduleFilters.projectId} onChange={handleScheduleFilterChange('projectId')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="">전체 프로젝트</option>{projectOptions.map((project) => <option key={project.value} value={project.value}>{project.label}</option>)}</select></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">시작일</Text><input type="date" value={scheduleFilters.startDate} onChange={handleScheduleFilterChange('startDate')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">종료일</Text><input type="date" value={scheduleFilters.endDate} onChange={handleScheduleFilterChange('endDate')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">중요도별</Text><select value={scheduleFilters.priority} onChange={handleScheduleFilterChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="">전체 중요도</option><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select></label>
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
                    setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '' })
                  }}
                >
                  필터 초기화
                </Button>
              </div>

            <div className="space-y-3">
              {filteredSchedules.map((schedule) => {
                const project = projects.find((item) => item.id === schedule.projectId)
                return (
                  <Card key={schedule.id} padding="md" className={`border ${priorityAccent[schedule.priority]} shadow-s`}>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2"><ScheduleKindBadge kind={schedule.kind} /><PriorityBadge priority={schedule.priority} /></div>
                          <Text variant="body24" as="h3" color="text-fg-primary">{schedule.title}</Text>
                          <Text variant="detail20" color="text-fg-secondary">{project?.name ?? '연결된 프로젝트 없음'}</Text>
                          <Text variant="detail20" color="text-fg-tertiary">{formatRepeatLabel(schedule)}</Text>
                        </div>
                        <Text variant="detail20" color="text-fg-tertiary">{formatDateLabel(schedule.date, schedule.time)}</Text>
                      </div>
                      <Text variant="detail20" color="text-fg-primary">{schedule.memo}</Text>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outlineDark" size="sm" shape="round" loading={isSavingEvent} onClick={() => void handleAddScheduleToCalendar(schedule, project?.name)}>구글 캘린더에 추가</Button>
                        <Button variant="outlineDark" size="sm" shape="round" onClick={() => editSchedule(schedule.id)}>일정 수정</Button>
                        <Button variant="outlineDark" size="sm" shape="round" onClick={() => removeSchedule(schedule.id)}>일정 삭제</Button>
                      </div>
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
                <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">우선순위</Text><select value={projectForm.priority} onChange={handleProjectChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select></label>
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
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">일정 구분</Text><select value={scheduleForm.kind} onChange={handleScheduleChange('kind')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="major">주요 일정</option><option value="general">일반 일정</option></select></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">우선순위</Text><select value={scheduleForm.priority} onChange={handleScheduleChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select></label>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">메모</Text><input value={scheduleForm.memo} onChange={handleScheduleChange('memo')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="회의 목적이나 체크포인트를 적어 주세요" /></label>
              <label className="flex items-center gap-3 px-1 py-1">
                <input type="checkbox" checked={scheduleForm.syncToGoogleCalendar} onChange={(event) => setScheduleForm((current) => ({ ...current, syncToGoogleCalendar: event.target.checked }))} className="h-4 w-4 rounded border-[var(--color-border)]" />
                <Text variant="detail20" color="text-fg-primary">구글 캘린더에도 등록</Text>
              </label>
            </div>
            <div className="flex flex-wrap gap-3"><Button variant="primary" size="sm" shape="round" loading={isSavingEvent} onClick={() => void saveSchedule()}>{editingScheduleId ? '일정 수정 완료' : '일정 저장'}</Button><Button variant="outlineDark" size="sm" shape="round" onClick={() => resetScheduleForm(scheduleForm.projectId)}>입력 초기화</Button></div>
          </div>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <Card padding="lg" className="border-transparent bg-white shadow-m">
          <div className="space-y-6">
            <div className="space-y-2"><Text variant="body24" as="h2" color="text-fg-primary">구글 캘린더</Text><Text variant="detail20" color="text-fg-secondary">캘린더를 직접 선택해서 열고, 일정을 저장할 수 있는 영역입니다.</Text></div>
            {googleClientId ? (
              <Card padding="md" className="border-[var(--color-border)] bg-surface-primary shadow-s">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2"><Text variant="detail20" color="text-fg-tertiary">구글 계정 연동</Text><Text variant="detail20" color="text-fg-secondary">{isConnected ? `${googleEmail || '연결된 계정'}으로 로그인되어 있습니다. 저장할 캘린더를 직접 고를 수 있어요.` : '구글 계정을 연결하면 선택한 캘린더에 일정을 직접 저장할 수 있습니다.'}</Text></div>
                    {isConnected ? <Button variant="outlineDark" size="sm" shape="round" onClick={disconnect}>연결 해제</Button> : <Button variant="primary" size="sm" shape="round" loading={isAuthorizing} onClick={() => void connectGoogleCalendar()}>구글 로그인</Button>}
                  </div>
                  {isConnected && <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">저장할 캘린더 선택</Text><select value={selectedCalendarId} onChange={(event) => setSelectedCalendarId(event.target.value)} className="w-full rounded-[24px] border border-[var(--color-border)] bg-white px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.summary}{calendar.primary ? ' (기본)' : ''}</option>)}</select></label>}
                  {isConnected && isCalendarsLoading && <Text variant="detail20" color="text-fg-secondary">캘린더 목록을 불러오는 중입니다.</Text>}
                </div>
              </Card>
            ) : (
              <Card padding="md" className="border-[var(--color-border)] bg-surface-primary shadow-s"><Text variant="detail20" color="text-fg-secondary">`NEXT_PUBLIC_GOOGLE_CLIENT_ID`를 설정하면 구글 계정 로그인과 캘린더 직접 저장 기능을 사용할 수 있습니다.</Text></Card>
            )}
            {!isConnected && <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">열어볼 캘린더 ID 또는 이메일</Text><input value={calendarId} onChange={(event) => setCalendarId(event.target.value)} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="example@group.calendar.google.com" /></label>}
            <div className="rounded-[28px] bg-surface-primary p-5"><Text variant="detail20" color="text-fg-tertiary">연동 상태</Text><Text variant="detail20" color={calendarFeedback.tone === 'error' ? 'text-red-700' : calendarFeedback.tone === 'success' ? 'text-blue-900' : 'text-fg-secondary'} className="mt-2">{calendarFeedback.text}</Text></div>
            <div className="flex flex-wrap gap-3"><Button variant="primary" size="sm" shape="round" disabled={!calendarViewUrl} onClick={() => calendarViewUrl && openGoogleCalendar(calendarViewUrl)}>캘린더 크게 열기</Button><Button variant="outlineDark" size="sm" shape="round" onClick={() => setActiveTab('schedule-create')}>새 일정 추가하기</Button></div>
          </div>
        </Card>
        <Card padding="none" className="overflow-hidden border-transparent bg-white shadow-m"><div className="border-b border-[var(--color-border)] px-6 py-5"><Text variant="body24" as="h2" color="text-fg-primary">선택한 구글 캘린더 보기</Text><Text variant="detail20" color="text-fg-secondary" className="mt-2">{effectiveCalendarId || '캘린더 ID를 입력하거나 구글 계정에 로그인하면 여기에 표시됩니다.'}</Text></div>{calendarEmbedUrl ? <iframe title="Google Calendar Preview" src={calendarEmbedUrl} className="h-[520px] w-full border-0" /> : <div className="px-6 py-10"><Text variant="detail20" color="text-fg-secondary">표시할 캘린더를 아직 고르지 않았습니다.</Text></div>}</Card>
      </div>
    )
  }
  return (
    <main className="min-h-screen bg-surface">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setIsGoogleScriptReady(true)} />
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
        <div className="flex items-center justify-between gap-4 px-1">
          <Text variant="dashboardLabel" color="text-black">업무 대시보드</Text>
          {isConnected ? (
            <button type="button" className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-left shadow-s transition hover:bg-surface-primary" onClick={() => setActiveTab('calendar')}>
              <Text variant="detail20" color="text-fg-primary">{googleEmail || '연결된 구글 계정'}</Text>
            </button>
          ) : (
            <Button variant="outlineDark" size="sm" shape="round" loading={isAuthorizing} onClick={() => { setActiveTab('calendar'); void connectGoogleCalendar() }}>
              로그인
            </Button>
          )}
        </div>
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-50 via-white to-teal-300/20 p-5 shadow-l md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-3 sm:grid-cols-3 xl:flex-1">
              {summaryCards.map((card) => (
                <Card key={card.label} padding="md" className="border-transparent bg-white/90 backdrop-blur">
                  <button type="button" className="w-full text-left" onClick={() => applySummaryShortcut(card.tab, card.quickFilter)}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Text variant="detail20" color="text-fg-tertiary">{card.label}</Text>
                        <div className="group relative shrink-0" onClick={(event) => event.stopPropagation()}>
                          <button type="button" className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[12px] font-[700] text-fg-tertiary" aria-label={`${card.label} 설명 보기`}>?</button>
                          <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-[220px] rounded-[20px] bg-gray-800 px-4 py-3 text-left shadow-l group-hover:block group-focus-within:block"><Text variant="detail20" color="text-alpha-white-700">{card.note}</Text></div>
                        </div>
                      </div>
                      <Text variant="body24" as="p" color="text-fg-primary">{card.value}</Text>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row xl:ml-4 xl:flex-col"><Button variant="primary" size="sm" shape="round" onClick={() => setActiveTab('schedule-list')}>이번 주 일정 보기</Button><Button variant="outlineDark" size="sm" shape="round" onClick={() => setActiveTab('calendar')}>구글 캘린더 열기</Button></div>
          </div>
        </section>
        <section className="space-y-4">
          <Card padding="md" className="border-transparent bg-white shadow-m"><div className="flex flex-wrap gap-3">{tabs.map((tab) => <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'outlineDark'} size="sm" shape="round" onClick={() => setActiveTab(tab.key)}>{tab.label}</Button>)}</div></Card>
          {renderTabContent()}
          {activeTab !== 'schedule-list' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card padding="md" className="border-transparent bg-white shadow-m"><div className="space-y-3"><Text variant="body24" as="h3" color="text-fg-primary">오늘 일정</Text>{todaySchedules.map((schedule) => <div key={schedule.id} className="rounded-[24px] bg-surface-primary p-4"><Text variant="detail20" color="text-fg-primary">{schedule.title}</Text><Text variant="detail20" color="text-fg-secondary" className="mt-1">{formatDateLabel(schedule.date, schedule.time)}</Text></div>)}</div></Card>
              <Card padding="md" className="border-transparent bg-white shadow-m"><div className="space-y-3"><Text variant="body24" as="h3" color="text-fg-primary">다가오는 일정</Text>{upcomingSchedules.map((schedule) => <div key={schedule.id} className="rounded-[24px] bg-surface-primary p-4"><Text variant="detail20" color="text-fg-primary">{schedule.title}</Text><Text variant="detail20" color="text-fg-secondary" className="mt-1">{formatDateLabel(schedule.date, schedule.time)}</Text></div>)}</div></Card>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
