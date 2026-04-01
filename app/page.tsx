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
  startMonth: number
  endMonth: number
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
  progress: string
  startMonth: string
  endMonth: string
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
  { id: 'brand-renewal', name: '2026 브랜드 경험 개편', owner: '브랜드경험팀', priority: '최우선', progress: 58, startMonth: 0, endMonth: 11 },
  { id: 'growth-campaign', name: '신규 구독 전환 실험', owner: 'Growth Squad', priority: '높음', progress: 41, startMonth: 2, endMonth: 9 },
  { id: 'ops-automation', name: '운영 자동화 정비', owner: 'Operations', priority: '보통', progress: 24, startMonth: 4, endMonth: 11 },
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
  progress: '0',
  startMonth: '0',
  endMonth: '11',
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
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm(initialProjects[0].id))
  const [isCustomRepeatMenuOpen, setIsCustomRepeatMenuOpen] = useState(false)
  const [customRepeatConfig, setCustomRepeatConfig] = useState<CustomRepeatConfig>({ interval: '1', frequency: 'WEEKLY', weeklyDays: [String(new Date(`${defaultScheduleForm(initialProjects[0].id).date}T00:00:00`).getDay())] })
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilters>({ projectId: '', startDate: '', endDate: '', priority: '' })
  const [scheduleQuickFilter, setScheduleQuickFilter] = useState<ScheduleQuickFilter>('all')
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

  const projectTimelineCards = useMemo(
    () =>
      projects.map((project) => {
        const milestones = sortedSchedules.filter((schedule) => schedule.projectId === project.id && schedule.kind === 'major' && schedule.date >= todayKey)
        const nextMilestone = milestones[0]
        return { ...project, duration: formatDuration(project.startMonth, project.endMonth), milestone: nextMilestone ? `${nextMilestone.title} · ${formatDateLabel(nextMilestone.date, nextMilestone.time)}` : '남아 있는 주요 일정이 없습니다.' }
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
    if (tab === 'schedule-list') {
      setScheduleQuickFilter(quickFilter)
      setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '' })
      return
    }
    setScheduleQuickFilter('all')
  }

  const handleProjectChange = (field: keyof ProjectFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setProjectForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleChange = (field: keyof ScheduleFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setScheduleForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleFilterChange = (field: keyof ScheduleFilters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setScheduleFilters((current) => ({ ...current, [field]: event.target.value as ScheduleFilters[typeof field] }))
  const handleCustomRepeatChange = (field: keyof CustomRepeatConfig) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCustomRepeatConfig((current) => ({ ...current, [field]: event.target.value }))

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
  }

  const resetScheduleForm = (projectId?: string) => {
    setEditingScheduleId(null)
    setScheduleForm(defaultScheduleForm(projectId ?? projects[0]?.id ?? ''))
    setIsCustomRepeatMenuOpen(false)
  }

  const saveProject = () => {
    const safeStartMonth = Math.max(0, Math.min(11, Number(projectForm.startMonth) || 0))
    const safeEndMonth = Math.max(safeStartMonth, Math.min(11, Number(projectForm.endMonth) || 11))
    const nextProject: ProjectItem = { id: editingProjectId ?? `project-${Date.now()}`, name: projectForm.name || '새 프로젝트', owner: projectForm.owner || '담당자 미정', priority: projectForm.priority, progress: Math.max(0, Math.min(100, Number(projectForm.progress) || 0)), startMonth: safeStartMonth, endMonth: safeEndMonth }
    setProjects((current) => (editingProjectId ? current.map((project) => (project.id === editingProjectId ? nextProject : project)) : [...current, nextProject]))
    if (!editingProjectId) setScheduleForm((current) => ({ ...current, projectId: nextProject.id }))
    setActiveTab('project-view')
    resetProjectForm()
  }

  const saveSchedule = () => {
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
    setActiveTab('schedule-list')
    resetScheduleForm(scheduleForm.projectId)
  }

  const editProject = (projectId: string) => {
    const target = projects.find((project) => project.id === projectId)
    if (!target) return
    setEditingProjectId(projectId)
    setProjectForm({ name: target.name, owner: target.owner, priority: target.priority, progress: String(target.progress), startMonth: String(target.startMonth), endMonth: String(target.endMonth) })
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
                      <div className="rounded-full bg-blue-50 px-3 py-2"><Text variant="detail20" color="text-blue-900">진행률 {project.progress}%</Text></div>
                    </div>
                  </div>
                  <TimelineTrack startMonth={project.startMonth} endMonth={project.endMonth} />
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
            {scheduleQuickFilter !== 'all' && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-blue-50 px-4 py-3">
                <Text variant="detail20" color="text-blue-900">{scheduleQuickFilter === 'major' ? '요약 박스에서 남아 있는 주요 일정만 보도록 필터가 적용되었습니다.' : '요약 박스에서 높은 우선순위 일정만 보도록 필터가 적용되었습니다.'}</Text>
                <Button variant="outlineDark" size="sm" shape="round" onClick={() => setScheduleQuickFilter('all')}>요약 필터 해제</Button>
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
              <Button variant="outlineDark" size="sm" shape="round" onClick={() => setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '' })}>필터 초기화</Button>
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
            <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">담당 조직</Text><input value={projectForm.owner} onChange={handleProjectChange('owner')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="담당 팀 또는 담당자를 입력해 주세요" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">시작 월</Text><select value={projectForm.startMonth} onChange={handleProjectChange('startMonth')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">{timelineMonths.map((month, index) => <option key={`start-${month}`} value={String(index)}>{month}</option>)}</select></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">종료 월</Text><select value={projectForm.endMonth} onChange={handleProjectChange('endMonth')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">{timelineMonths.map((month, index) => <option key={`end-${month}`} value={String(index)}>{month}</option>)}</select></label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">우선순위</Text><select value={projectForm.priority} onChange={handleProjectChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800"><option value="최우선">최우선</option><option value="높음">높음</option><option value="보통">보통</option></select></label>
              <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">진행률</Text><input type="number" min="0" max="100" value={projectForm.progress} onChange={handleProjectChange('progress')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" /></label>
            </div>
            <div className="flex flex-wrap gap-3"><Button variant="primary" size="sm" shape="round" onClick={saveProject}>{editingProjectId ? '프로젝트 수정 완료' : '새 프로젝트 추가'}</Button><Button variant="outlineDark" size="sm" shape="round" onClick={resetProjectForm}>입력 초기화</Button></div>
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
            <label className="block space-y-3"><Text variant="detail20" color="text-fg-tertiary">메모</Text><input value={scheduleForm.memo} onChange={handleScheduleChange('memo')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="회의 목적이나 체크포인트를 적어 주세요" /></label>
            <Card padding="md" className="border-[var(--color-border)] bg-surface-primary shadow-s">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outlineDark"
                  size="sm"
                  shape="round"
                  loading={isSavingEvent}
                  onClick={() =>
                    void handleAddScheduleToCalendar(
                      {
                        id: editingScheduleId ?? 'draft-schedule',
                        projectId: scheduleForm.projectId,
                        title: scheduleForm.title || '새 일정',
                        date: scheduleForm.date,
                        time: scheduleForm.time,
                        repeatType: scheduleForm.repeatType,
                        repeatCustom: scheduleForm.repeatCustom,
                        repeatCustomLabel: scheduleForm.repeatCustomLabel,
                        priority: scheduleForm.priority,
                        kind: scheduleForm.kind,
                        memo: scheduleForm.memo || '메모 없음',
                      },
                      projects.find((project) => project.id === scheduleForm.projectId)?.name,
                    )
                  }
                >
                  구글 캘린더 등록하기
                </Button>
              </div>
            </Card>
            <div className="flex flex-wrap gap-3"><Button variant="primary" size="sm" shape="round" onClick={saveSchedule}>{editingScheduleId ? '일정 수정 완료' : '일정 저장'}</Button><Button variant="outlineDark" size="sm" shape="round" onClick={() => resetScheduleForm(scheduleForm.projectId)}>입력 초기화</Button></div>
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
        <div className="px-1"><Text variant="dashboardLabel" color="text-black">업무 대시보드</Text></div>
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
