'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'

type ScheduleKind = 'major' | 'general'
type PriorityLevel = '최우선' | '높음' | '보통'
type DashboardTab = 'schedule-create' | 'schedule-list' | 'project-create' | 'project-view' | 'calendar'
type ScheduleFilters = { projectId: string; startDate: string; endDate: string; priority: '' | PriorityLevel }

type ProjectItem = { id: string; name: string; owner: string; priority: PriorityLevel; progress: number; startMonth: number; endMonth: number }
type ScheduleItem = { id: string; projectId: string; title: string; date: string; time: string; priority: PriorityLevel; kind: ScheduleKind; memo: string }
type ProjectFormState = { name: string; owner: string; priority: PriorityLevel; progress: string; startMonth: string; endMonth: string }
type ScheduleFormState = { projectId: string; title: string; date: string; time: string; priority: PriorityLevel; kind: ScheduleKind; memo: string }

const timelineMonths = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const tabs: { key: DashboardTab; label: string }[] = [
  { key: 'project-view', label: '프로젝트 보기' },
  { key: 'schedule-list', label: '일정 보기' },
  { key: 'project-create', label: '프로젝트 작성' },
  { key: 'schedule-create', label: '일정 작성' },
  { key: 'calendar', label: '구글 캘린더' },
]

const initialProjects: ProjectItem[] = [
  { id: 'project-brand', name: '2026 상반기 브랜드 개편', owner: '브랜드 경험팀', priority: '최우선', progress: 58, startMonth: 0, endMonth: 11 },
  { id: 'project-growth', name: '신규 구독 전환 실험', owner: 'Growth Squad', priority: '높음', progress: 41, startMonth: 2, endMonth: 9 },
  { id: 'project-ops', name: '사내 운영 자동화 정비', owner: 'Operations', priority: '보통', progress: 24, startMonth: 4, endMonth: 11 },
]

const initialSchedules: ScheduleItem[] = [
  { id: 'schedule-brand-sync', projectId: 'project-brand', title: '브랜드 개편 주간 싱크', date: '2026-03-31', time: '15:00', priority: '최우선', kind: 'major', memo: '브랜드 개편 진행 현황과 다음 의사결정을 함께 확인하는 회의' },
  { id: 'schedule-growth-ab', projectId: 'project-growth', title: 'A/B 테스트 결과 공유', date: '2026-04-03', time: '11:00', priority: '높음', kind: 'major', memo: '첫 주 전환 데이터와 리텐션 지표를 리뷰하는 일정' },
  { id: 'schedule-risk-check', projectId: 'project-growth', title: '프로젝트 리스크 점검', date: '2026-04-04', time: '14:00', priority: '보통', kind: 'general', memo: '의존성 일정과 리소스 이슈를 확인하는 운영 체크' },
  { id: 'schedule-mid-review', projectId: 'project-brand', title: '상반기 중간 리뷰', date: '2026-04-05', time: '16:30', priority: '최우선', kind: 'major', memo: '프로젝트 리더와 핵심 담당자가 함께 참석하는 중간 점검 일정' },
  { id: 'schedule-ops-kickoff', projectId: 'project-ops', title: '자동화 정비 킥오프 점검', date: '2026-03-31', time: '17:30', priority: '높음', kind: 'general', memo: '자동화 범위와 담당 영역을 정리하는 초기 킥오프 미팅' },
  { id: 'schedule-flow-review', projectId: 'project-ops', title: '업무 플로우 리뷰', date: '2026-04-18', time: '16:00', priority: '보통', kind: 'major', memo: '자동화 전후의 실제 업무 흐름을 비교하는 검토 일정' },
]

const defaultProjectForm = (): ProjectFormState => ({ name: '', owner: '', priority: '보통', progress: '0', startMonth: '0', endMonth: '0' })
const defaultScheduleForm = (projectId: string): ScheduleFormState => ({ projectId, title: '', date: '2026-04-01', time: '09:00', priority: '보통', kind: 'general', memo: '' })

const scheduleTypeCards = [
  { key: 'major' as ScheduleKind, title: '주요 일정', description: '타임라인과 요약 영역에서 먼저 보여줄 일정입니다.' },
  { key: 'general' as ScheduleKind, title: '일반 일정', description: '일상적인 실행 일정으로 차분하게 관리합니다.' },
]

const priorityCards = [
  { key: '최우선' as PriorityLevel, title: '최우선', description: '오늘 또는 이번 주 안에 꼭 챙겨야 하는 일정' },
  { key: '높음' as PriorityLevel, title: '높음', description: '가까운 시점에 확인이 필요한 일정' },
  { key: '보통' as PriorityLevel, title: '보통', description: '흐름 안에서 꾸준히 관리하면 되는 일정' },
]

const scheduleTypeTone: Record<ScheduleKind, string> = { major: 'bg-blue-50 text-blue-900', general: 'bg-surface-primary text-fg-secondary' }
const priorityTone: Record<PriorityLevel, string> = { 최우선: 'bg-red-300 text-red-900', 높음: 'bg-amber-300 text-amber-900', 보통: 'bg-blue-50 text-blue-900' }
const priorityAccent: Record<PriorityLevel, string> = { 최우선: 'border-red-300 bg-red-300/20', 높음: 'border-amber-300 bg-amber-300/20', 보통: 'border-blue-50 bg-blue-50/60' }
const detailDescriptions = { major: { summary: '프로젝트 흐름에서 꼭 보여야 하는 일정으로 먼저 노출합니다.', visibility: '타임라인 대표 일정으로 강조' }, general: { summary: '세부 실행 일정으로 관리하며 전체 흐름 안에서 가볍게 확인합니다.', visibility: '주요 일정 아래에서 차분하게 정리' } }

const formatDateLabel = (date: string, time: string) => {
  const parsedDate = new Date(`${date}T00:00:00`)
  return `${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일 ${time}`
}
const formatDuration = (startMonth: number, endMonth: number) => `2026.${String(startMonth + 1).padStart(2, '0')} - 2026.${String(endMonth + 1).padStart(2, '0')}`
const buildDateTimeValue = (date: string, time: string) => `${date}T${time}`
const toGoogleCalendarDateTime = (date: string, time: string) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`

function buildGoogleCalendarEventUrl(schedule: ScheduleItem, projectName?: string) {
  const start = toGoogleCalendarDateTime(schedule.date, schedule.time)
  const endDateTime = new Date(`${schedule.date}T${schedule.time}:00`)
  endDateTime.setHours(endDateTime.getHours() + 1)
  const end = `${endDateTime.getFullYear()}${String(endDateTime.getMonth() + 1).padStart(2, '0')}${String(endDateTime.getDate()).padStart(2, '0')}T${String(endDateTime.getHours()).padStart(2, '0')}${String(endDateTime.getMinutes()).padStart(2, '0')}00`
  const description = [projectName ? `프로젝트: ${projectName}` : '', schedule.memo].filter(Boolean).join('\n')
  const params = new URLSearchParams({
    text: schedule.title,
    dates: `${start}/${end}`,
    details: description,
    location: '',
    ctz: 'Asia/Seoul',
  })
  return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`
}

const buildGoogleCalendarEmbedUrl = (calendarId: string) => `https://calendar.google.com/calendar/embed?${new URLSearchParams({ src: calendarId, ctz: 'Asia/Seoul', mode: 'AGENDA' }).toString()}`
const buildGoogleCalendarViewUrl = (calendarId: string) => `https://calendar.google.com/calendar/u/0/r?${new URLSearchParams({ cid: calendarId }).toString()}`

function TimelineTrack({ startMonth, endMonth }: { startMonth: number; endMonth: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] gap-2" style={{ gridTemplateColumns: `repeat(${timelineMonths.length}, minmax(0, 1fr))` }}>
        {timelineMonths.map((month, index) => {
          const isActive = index >= startMonth && index <= endMonth
          return (
            <div key={month} className="space-y-2">
              <div className="rounded-full bg-surface-primary px-3 py-2 text-center">
                <Text variant="detail20" color="text-fg-tertiary" align="center">
                  {month}
                </Text>
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
  return (
    <div className={`rounded-full px-3 py-2 ${priorityTone[priority]}`}>
      <Text variant="detail20">{priority}</Text>
    </div>
  )
}

function ScheduleTypeBadge({ kind }: { kind: ScheduleKind }) {
  return (
    <div className={`rounded-full px-3 py-2 ${scheduleTypeTone[kind]}`}>
      <Text variant="detail20">{kind === 'major' ? '주요 일정' : '일반 일정'}</Text>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('project-view')
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules)
  const [calendarId, setCalendarId] = useState('jungah.yoo@dreamus.io')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectFormState>(defaultProjectForm())
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(defaultScheduleForm(initialProjects[0].id))
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilters>({ projectId: '', startDate: '', endDate: '', priority: '' })

  const projectOptions = useMemo(() => projects.map((project) => ({ value: project.id, label: project.name })), [projects])
  const sortedSchedules = useMemo(() => [...schedules].sort((a, b) => buildDateTimeValue(a.date, a.time).localeCompare(buildDateTimeValue(b.date, b.time))), [schedules])
  const todaySchedules = useMemo(() => sortedSchedules.filter((schedule) => schedule.date === '2026-03-31').slice(0, 3), [sortedSchedules])
  const upcomingSchedules = useMemo(() => sortedSchedules.filter((schedule) => schedule.date !== '2026-03-31').slice(0, 4), [sortedSchedules])
  const filteredSchedules = useMemo(
    () =>
      sortedSchedules.filter((schedule) => {
        const matchesProject = !scheduleFilters.projectId || schedule.projectId === scheduleFilters.projectId
        const matchesStartDate = !scheduleFilters.startDate || schedule.date >= scheduleFilters.startDate
        const matchesEndDate = !scheduleFilters.endDate || schedule.date <= scheduleFilters.endDate
        const matchesPriority = !scheduleFilters.priority || schedule.priority === scheduleFilters.priority
        return matchesProject && matchesStartDate && matchesEndDate && matchesPriority
      }),
    [scheduleFilters.endDate, scheduleFilters.priority, scheduleFilters.projectId, scheduleFilters.startDate, sortedSchedules],
  )
  const projectTimelineCards = useMemo(
    () =>
      projects.map((project) => {
        const projectSchedules = sortedSchedules.filter((schedule) => schedule.projectId === project.id && schedule.kind === 'major')
        const nextMilestone = projectSchedules[0]
        return {
          ...project,
          duration: formatDuration(project.startMonth, project.endMonth),
          milestone: nextMilestone ? { label: nextMilestone.title, date: formatDateLabel(nextMilestone.date, nextMilestone.time) } : { label: '주요 일정 없음', date: '아직 등록된 일정이 없습니다.' },
        }
      }),
    [projects, sortedSchedules],
  )
  const summaryCards = useMemo(
    () => [
      { label: '진행 중 프로젝트', value: `${projects.length}개`, note: '현재 작성된 프로젝트 기준' },
      { label: '다가오는 주요 일정', value: `${schedules.filter((schedule) => schedule.kind === 'major').length}건`, note: '타임라인에 먼저 노출되는 일정' },
      { label: '높은 우선순위 업무', value: `${schedules.filter((schedule) => schedule.priority !== '보통').length}건`, note: '최우선 또는 높음으로 분류된 일정' },
    ],
    [projects.length, schedules],
  )
  const selectedDetail = detailDescriptions[scheduleForm.kind]
  const calendarEmbedUrl = buildGoogleCalendarEmbedUrl(calendarId)
  const calendarViewUrl = buildGoogleCalendarViewUrl(calendarId)

  const handleProjectChange = (field: keyof ProjectFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProjectForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleChange = (field: keyof ScheduleFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setScheduleForm((current) => ({ ...current, [field]: event.target.value }))
  const handleScheduleFilterChange = (field: keyof ScheduleFilters) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setScheduleFilters((current) => ({ ...current, [field]: event.target.value as ScheduleFilters[typeof field] }))

  const resetProjectForm = () => {
    setEditingProjectId(null)
    setProjectForm(defaultProjectForm())
  }

  const resetScheduleForm = (projectId?: string) => {
    setEditingScheduleId(null)
    setScheduleForm(defaultScheduleForm(projectId ?? projects[0]?.id ?? ''))
  }

  const saveProject = () => {
    const safeStartMonth = Math.max(0, Math.min(11, Number(projectForm.startMonth) || 0))
    const safeEndMonth = Math.max(safeStartMonth, Math.min(11, Number(projectForm.endMonth) || 0))
    const nextProject: ProjectItem = {
      id: editingProjectId ?? `project-${Date.now()}`,
      name: projectForm.name || '새 프로젝트',
      owner: projectForm.owner || '담당자 미정',
      priority: projectForm.priority,
      progress: Math.max(0, Math.min(100, Number(projectForm.progress) || 0)),
      startMonth: safeStartMonth,
      endMonth: safeEndMonth,
    }

    setProjects((current) => (editingProjectId ? current.map((project) => (project.id === editingProjectId ? nextProject : project)) : [...current, nextProject]))
    if (!editingProjectId) setScheduleForm((current) => ({ ...current, projectId: nextProject.id }))
    setActiveTab('project-view')
    resetProjectForm()
  }

  const saveSchedule = () => {
    const nextSchedule: ScheduleItem = {
      id: editingScheduleId ?? `schedule-${Date.now()}`,
      projectId: scheduleForm.projectId,
      title: scheduleForm.title || '새 일정',
      date: scheduleForm.date,
      time: scheduleForm.time,
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
    setScheduleForm({ projectId: target.projectId, title: target.title, date: target.date, time: target.time, priority: target.priority, kind: target.kind, memo: target.memo })
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

  const openGoogleCalendar = (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer')
  }

  const renderTabContent = () => {
    if (activeTab === 'schedule-create') {
      return (
        <Card padding="lg" className="border-transparent bg-white shadow-m">
          <div className="space-y-6">
            <div className="space-y-2">
              <Text variant="body24" as="h2" color="text-fg-primary">일정 작성</Text>
              <Text variant="detail20" color="text-fg-secondary">일정 입력과 미리보기를 한 화면에서 확인한 뒤 저장합니다.</Text>
            </div>
            <label className="block space-y-3">
              <Text variant="detail20" color="text-fg-tertiary">일정 이름</Text>
              <input value={scheduleForm.title} onChange={handleScheduleChange('title')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="일정 이름을 입력하세요" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">연결 프로젝트</Text>
                <select value={scheduleForm.projectId} onChange={handleScheduleChange('projectId')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                  {projectOptions.map((project) => <option key={project.value} value={project.value}>{project.label}</option>)}
                </select>
              </label>
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">날짜</Text>
                <input type="date" value={scheduleForm.date} onChange={handleScheduleChange('date')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">시간</Text>
                <input type="time" value={scheduleForm.time} onChange={handleScheduleChange('time')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" />
              </label>
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">일정 메모</Text>
                <input value={scheduleForm.memo} onChange={handleScheduleChange('memo')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="일정 메모를 입력하세요" />
              </label>
            </div>
            <div className="space-y-3">
              <Text variant="detail20" color="text-fg-tertiary">일정 구분</Text>
              <div className="grid gap-3 md:grid-cols-2">
                {scheduleTypeCards.map((option) => {
                  const isSelected = scheduleForm.kind === option.key
                  return (
                    <label key={option.key} className={['cursor-pointer rounded-[28px] border p-4 transition', isSelected ? 'border-blue-800 bg-blue-50 shadow-s' : 'border-[var(--color-border)] bg-surface'].join(' ')}>
                      <input type="radio" checked={isSelected} onChange={() => setScheduleForm((current) => ({ ...current, kind: option.key }))} className="sr-only" />
                      <div className="space-y-2">
                        <Text variant="body24" color="text-fg-primary">{option.title}</Text>
                        <Text variant="detail20" color="text-fg-secondary">{option.description}</Text>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="space-y-3">
              <Text variant="detail20" color="text-fg-tertiary">우선순위</Text>
              <div className="grid gap-3 md:grid-cols-3">
                {priorityCards.map((option) => {
                  const isSelected = scheduleForm.priority === option.key
                  return (
                    <label key={option.key} className={['cursor-pointer rounded-[28px] border p-4 transition', isSelected ? 'border-gray-800 bg-gray-800 text-white shadow-s' : 'border-[var(--color-border)] bg-surface'].join(' ')}>
                      <input type="radio" checked={isSelected} onChange={() => setScheduleForm((current) => ({ ...current, priority: option.key }))} className="sr-only" />
                      <div className="space-y-2">
                        <Text variant="body24" color={isSelected ? 'text-fg-inverse' : 'text-fg-primary'}>{option.title}</Text>
                        <Text variant="detail20" color={isSelected ? 'text-alpha-white-700' : 'text-fg-secondary'}>{option.description}</Text>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <Card padding="lg" className={`border ${priorityAccent[scheduleForm.priority]} shadow-s`}>
              <div className="space-y-5">
                <div className="flex flex-wrap items-start gap-2">
                  <ScheduleTypeBadge kind={scheduleForm.kind} />
                  <PriorityBadge priority={scheduleForm.priority} />
                </div>
                <div className="space-y-2">
                  <Text variant="body24" as="h3" color="text-fg-primary">{scheduleForm.title || '일정 미리보기'}</Text>
                  <Text variant="detail20" color="text-fg-secondary">{formatDateLabel(scheduleForm.date, scheduleForm.time)}</Text>
                </div>
                <div className="rounded-[24px] bg-white/80 p-4">
                  <Text variant="detail20" color="text-fg-tertiary">표시 방식</Text>
                  <Text variant="body24" color="text-fg-primary" className="mt-1">{selectedDetail.visibility}</Text>
                  <Text variant="detail20" color="text-fg-secondary" className="mt-2">{selectedDetail.summary}</Text>
                </div>
              </div>
            </Card>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm" shape="round" onClick={saveSchedule}>{editingScheduleId ? '일정 수정 저장' : '새 일정 추가'}</Button>
              <Button variant="outlineDark" size="sm" shape="round" onClick={() => resetScheduleForm(scheduleForm.projectId)}>입력 초기화</Button>
            </div>
          </div>
        </Card>
      )
    }

    if (activeTab === 'schedule-list') {
      return (
        <div className="space-y-6">
          <Card padding="lg" className="border-transparent bg-white shadow-m">
            <div className="space-y-5">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-primary">일정 보기</Text>
                <Text variant="detail20" color="text-fg-secondary">필터로 좁혀 보면서 수정하거나 구글 캘린더에 보낼 일정을 빠르게 처리할 수 있습니다.</Text>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="block space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary">프로젝트별</Text>
                  <select value={scheduleFilters.projectId} onChange={handleScheduleFilterChange('projectId')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                    <option value="">전체 프로젝트</option>
                    {projectOptions.map((project) => <option key={project.value} value={project.value}>{project.label}</option>)}
                  </select>
                </label>
                <label className="block space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary">시작일</Text>
                  <input type="date" value={scheduleFilters.startDate} onChange={handleScheduleFilterChange('startDate')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" />
                </label>
                <label className="block space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary">종료일</Text>
                  <input type="date" value={scheduleFilters.endDate} onChange={handleScheduleFilterChange('endDate')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" />
                </label>
                <label className="block space-y-3 md:col-span-2 xl:col-span-1">
                  <Text variant="detail20" color="text-fg-tertiary">중요도별</Text>
                  <select value={scheduleFilters.priority} onChange={handleScheduleFilterChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                    <option value="">전체 중요도</option>
                    {priorityCards.map((option) => <option key={option.key} value={option.key}>{option.title}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-surface-primary px-4 py-3">
                <Text variant="detail20" color="text-fg-secondary">
                  현재 조건에 맞는 일정 {filteredSchedules.length}건
                </Text>
                <Button
                  variant="outlineDark"
                  size="sm"
                  shape="round"
                  onClick={() => setScheduleFilters({ projectId: '', startDate: '', endDate: '', priority: '' })}
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
                            <div className="flex flex-wrap gap-2">
                              <ScheduleTypeBadge kind={schedule.kind} />
                              <PriorityBadge priority={schedule.priority} />
                            </div>
                            <Text variant="body24" as="h3" color="text-fg-primary">{schedule.title}</Text>
                            <Text variant="detail20" color="text-fg-secondary">{project?.name ?? '연결된 프로젝트 없음'}</Text>
                          </div>
                          <Text variant="detail20" color="text-fg-tertiary">{formatDateLabel(schedule.date, schedule.time)}</Text>
                        </div>
                        <Text variant="detail20" color="text-fg-primary">{schedule.memo}</Text>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="outlineDark" size="sm" shape="round" onClick={() => openGoogleCalendar(buildGoogleCalendarEventUrl(schedule, project?.name))}>구글 캘린더에 추가</Button>
                          <Button variant="outlineDark" size="sm" shape="round" onClick={() => editSchedule(schedule.id)}>일정 수정</Button>
                          <Button variant="outlineDark" size="sm" shape="round" onClick={() => removeSchedule(schedule.id)}>일정 삭제</Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
                {filteredSchedules.length === 0 && (
                  <Card padding="md" className="border-[var(--color-border)] bg-surface shadow-s">
                    <Text variant="detail20" color="text-fg-secondary">
                      선택한 조건에 맞는 일정이 없습니다.
                    </Text>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (activeTab === 'project-create') {
      return (
        <Card padding="lg" className="border-transparent bg-white shadow-m">
          <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-primary">프로젝트 작성</Text>
                <Text variant="detail20" color="text-fg-secondary">새 프로젝트를 만들거나 기존 프로젝트를 수정한 뒤 바로 프로젝트 보기 탭에서 확인합니다.</Text>
              </div>
              <Text variant="detail20" color="text-fg-tertiary">{editingProjectId ? '현재 프로젝트 수정 중' : '새 프로젝트 작성 중'}</Text>
            </div>
            <label className="block space-y-3">
              <Text variant="detail20" color="text-fg-tertiary">프로젝트 이름</Text>
              <input value={projectForm.name} onChange={handleProjectChange('name')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="프로젝트 이름을 입력하세요" />
            </label>
            <label className="block space-y-3">
              <Text variant="detail20" color="text-fg-tertiary">담당 조직</Text>
              <input value={projectForm.owner} onChange={handleProjectChange('owner')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="담당 팀 또는 담당자를 입력하세요" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">시작 월</Text>
                <select value={projectForm.startMonth} onChange={handleProjectChange('startMonth')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                  {timelineMonths.map((month, index) => <option key={`start-${month}`} value={String(index)}>{month}</option>)}
                </select>
              </label>
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">종료 월</Text>
                <select value={projectForm.endMonth} onChange={handleProjectChange('endMonth')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                  {timelineMonths.map((month, index) => <option key={`end-${month}`} value={String(index)}>{month}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">우선순위</Text>
                <select value={projectForm.priority} onChange={handleProjectChange('priority')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800">
                  {priorityCards.map((option) => <option key={option.key} value={option.key}>{option.title}</option>)}
                </select>
              </label>
              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">진행률</Text>
                <input type="number" min="0" max="100" value={projectForm.progress} onChange={handleProjectChange('progress')} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm" shape="round" onClick={saveProject}>{editingProjectId ? '프로젝트 수정 저장' : '새 프로젝트 추가'}</Button>
              <Button variant="outlineDark" size="sm" shape="round" onClick={resetProjectForm}>입력 초기화</Button>
            </div>
          </div>
        </Card>
      )
    }

    if (activeTab === 'project-view') {
      return (
        <Card padding="lg" className="border-transparent bg-surface-primary shadow-m">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-primary">진행 중인 프로젝트 보기</Text>
                <Text variant="detail20" color="text-fg-secondary">1년 기준 타임라인과 다음 주요 일정을 한 화면에서 확인합니다.</Text>
              </div>
              <div className="rounded-full bg-white px-4 py-2 shadow-s">
                <Text variant="detail20" color="text-blue-900">현재 기준: 2026년 3월 마지막 주</Text>
              </div>
            </div>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={project.priority} />
                        <div className="rounded-full bg-blue-50 px-3 py-2">
                          <Text variant="detail20" color="text-blue-900">진행률 {project.progress}%</Text>
                        </div>
                      </div>
                    </div>
                    <TimelineTrack startMonth={project.startMonth} endMonth={project.endMonth} />
                    <div className="rounded-[24px] bg-surface-primary p-4">
                      <Text variant="detail20" color="text-fg-tertiary">다음 주요 일정</Text>
                      <Text variant="body24" color="text-fg-primary" className="mt-1">{project.milestone.label}</Text>
                      <Text variant="detail20" color="text-fg-secondary" className="mt-1">{project.milestone.date}</Text>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outlineDark" size="sm" shape="round" onClick={() => editProject(project.id)}>프로젝트 수정</Button>
                      <Button variant="outlineDark" size="sm" shape="round" onClick={() => removeProject(project.id)}>프로젝트 삭제</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <Card padding="lg" className="border-transparent bg-white shadow-m">
          <div className="space-y-6">
            <div className="space-y-2">
              <Text variant="body24" as="h2" color="text-fg-primary">구글 캘린더</Text>
              <Text variant="detail20" color="text-fg-secondary">일정 추가와 캘린더 확인을 한 탭 안에서 처리합니다.</Text>
            </div>
            <label className="block space-y-3">
              <Text variant="detail20" color="text-fg-tertiary">열어볼 캘린더 ID 또는 이메일</Text>
              <input value={calendarId} onChange={(event) => setCalendarId(event.target.value)} className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-4 py-3 text-body1 text-fg-primary outline-none transition focus:border-blue-800" placeholder="example@group.calendar.google.com" />
            </label>
            <div className="rounded-[28px] bg-surface-primary p-5">
              <Text variant="detail20" color="text-fg-tertiary">연동 방식</Text>
              <Text variant="body24" color="text-fg-primary" className="mt-2">1. 작성된 일정 탭에서 원하는 일정에 구글 캘린더 추가를 누릅니다.</Text>
              <Text variant="body24" color="text-fg-primary" className="mt-2">2. 현재 입력 중인 일정도 바로 캘린더에 보낼 수 있습니다.</Text>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm" shape="round" onClick={() => openGoogleCalendar(calendarViewUrl)}>캘린더 크게 열기</Button>
              <Button variant="outlineDark" size="sm" shape="round" onClick={() => openGoogleCalendar(buildGoogleCalendarEventUrl({ id: 'preview', projectId: scheduleForm.projectId, title: scheduleForm.title || '새 일정', date: scheduleForm.date, time: scheduleForm.time, priority: scheduleForm.priority, kind: scheduleForm.kind, memo: scheduleForm.memo || '메모 없음' }, projects.find((project) => project.id === scheduleForm.projectId)?.name))}>현재 입력 일정 추가</Button>
            </div>
          </div>
        </Card>
        <Card padding="none" className="overflow-hidden border-transparent bg-white shadow-m">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <Text variant="body24" as="h2" color="text-fg-primary">선택한 구글 캘린더 보기</Text>
            <Text variant="detail20" color="text-fg-secondary" className="mt-2">{calendarId || '캘린더 ID를 입력하면 여기에 표시됩니다.'}</Text>
          </div>
          <iframe title="Google Calendar Preview" src={calendarEmbedUrl} className="h-[520px] w-full border-0" />
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
        <div className="px-1">
          <Text variant="dashboardLabel" color="text-black">업무 대시보드</Text>
        </div>
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-50 via-white to-teal-300/20 p-5 shadow-l md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-3 sm:grid-cols-3 xl:flex-1">
              {summaryCards.map((card) => (
                <Card key={card.label} padding="md" className="border-transparent bg-white/90 backdrop-blur">
                  <div className="space-y-2">
                    <Text variant="detail20" color="text-fg-tertiary">{card.label}</Text>
                    <Text variant="body24" as="p" color="text-fg-primary">{card.value}</Text>
                    <Text variant="detail20" color="text-fg-secondary">{card.note}</Text>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row xl:ml-4 xl:flex-col">
              <Button variant="primary" size="sm" shape="round" onClick={() => setActiveTab('schedule-list')}>이번 주 일정 보기</Button>
              <Button variant="outlineDark" size="sm" shape="round" onClick={() => setActiveTab('calendar')}>구글 캘린더 열기</Button>
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <Card padding="md" className="border-transparent bg-white shadow-m">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <Button key={tab.key} variant={activeTab === tab.key ? 'primary' : 'outlineDark'} size="sm" shape="round" onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </Button>
              ))}
            </div>
          </Card>
          {renderTabContent()}
        </section>
      </div>
    </main>
  )
}
