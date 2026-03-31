'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'

type ScheduleKind = 'major' | 'general'
type PriorityLevel = '최우선' | '높음' | '보통'

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
  priority: PriorityLevel
  kind: ScheduleKind
  memo: string
}

const timelineMonths = ['1월', '2월', '3월', '4월', '5월', '6월']

const initialProjects: ProjectItem[] = [
  {
    id: 'project-brand',
    name: '2026 상반기 브랜드 개편',
    owner: '브랜드 경험팀',
    priority: '최우선',
    progress: 58,
    startMonth: 0,
    endMonth: 5,
  },
  {
    id: 'project-growth',
    name: '신규 구독 전환 실험',
    owner: 'Growth Squad',
    priority: '높음',
    progress: 41,
    startMonth: 1,
    endMonth: 4,
  },
  {
    id: 'project-ops',
    name: '사내 운영 자동화 정비',
    owner: 'Operations',
    priority: '보통',
    progress: 24,
    startMonth: 2,
    endMonth: 5,
  },
]

const initialSchedules: ScheduleItem[] = [
  {
    id: 'schedule-brand-sync',
    projectId: 'project-brand',
    title: '브랜드 개편 주간 싱크',
    date: '2026-03-31',
    time: '15:00',
    priority: '최우선',
    kind: 'major',
    memo: '브랜드 개편 진행 현황과 다음 의사결정을 함께 확인하는 회의',
  },
  {
    id: 'schedule-growth-ab',
    projectId: 'project-growth',
    title: 'A/B 테스트 결과 공유',
    date: '2026-04-03',
    time: '11:00',
    priority: '높음',
    kind: 'major',
    memo: '첫 주 전환 데이터와 리텐션 지표를 리뷰하는 일정',
  },
  {
    id: 'schedule-risk-check',
    projectId: 'project-growth',
    title: '프로젝트 리스크 점검',
    date: '2026-04-04',
    time: '14:00',
    priority: '보통',
    kind: 'general',
    memo: '의존성 일정과 리소스 이슈를 확인하는 운영 체크',
  },
  {
    id: 'schedule-mid-review',
    projectId: 'project-brand',
    title: '상반기 중간 리뷰',
    date: '2026-04-05',
    time: '16:30',
    priority: '최우선',
    kind: 'major',
    memo: '프로젝트 리더와 핵심 담당자가 함께 참석하는 중간 점검 일정',
  },
  {
    id: 'schedule-ops-kickoff',
    projectId: 'project-ops',
    title: '자동화 정비 킥오프 점검',
    date: '2026-03-31',
    time: '17:30',
    priority: '높음',
    kind: 'general',
    memo: '자동화 범위와 담당 영역을 정리하는 초기 킥오프 미팅',
  },
  {
    id: 'schedule-flow-review',
    projectId: 'project-ops',
    title: '업무 플로우 리뷰',
    date: '2026-04-18',
    time: '16:00',
    priority: '보통',
    kind: 'major',
    memo: '자동화 전후의 실제 업무 흐름을 비교하는 검토 일정',
  },
]

const defaultProjectForm = (): ProjectFormState => ({
  name: '',
  owner: '',
  priority: '보통',
  progress: '0',
  startMonth: '0',
  endMonth: '0',
})

const defaultScheduleForm = (projectId: string): ScheduleFormState => ({
  projectId,
  title: '',
  date: '2026-04-01',
  time: '09:00',
  priority: '보통',
  kind: 'general',
  memo: '',
})

const scheduleTypeCards = [
  {
    key: 'major' as ScheduleKind,
    title: '주요 일정',
    description: '타임라인과 요약 영역에서 가장 먼저 보이도록 강조합니다.',
  },
  {
    key: 'general' as ScheduleKind,
    title: '일반 일정',
    description: '프로젝트 안에서 필요한 작업이지만 과한 강조 없이 관리합니다.',
  },
]

const priorityCards = [
  {
    key: '최우선' as PriorityLevel,
    title: '최우선',
    description: '오늘 또는 이번 주 안에 꼭 챙겨야 하는 일정',
  },
  {
    key: '높음' as PriorityLevel,
    title: '높음',
    description: '가까운 시점에 확인이 필요한 일정',
  },
  {
    key: '보통' as PriorityLevel,
    title: '보통',
    description: '흐름 안에서 꾸준히 관리하면 되는 일정',
  },
]

const scheduleTypeTone: Record<ScheduleKind, string> = {
  major: 'bg-blue-50 text-blue-900',
  general: 'bg-surface-primary text-fg-secondary',
}

const priorityTone: Record<PriorityLevel, string> = {
  최우선: 'bg-red-300 text-red-900',
  높음: 'bg-amber-300 text-amber-900',
  보통: 'bg-blue-50 text-blue-900',
}

const priorityAccent: Record<PriorityLevel, string> = {
  최우선: 'border-red-300 bg-red-300/20',
  높음: 'border-amber-300 bg-amber-300/20',
  보통: 'border-blue-50 bg-blue-50/60',
}

const detailDescriptions = {
  major: {
    label: '주요 일정',
    summary: '프로젝트 흐름에서 꼭 보여야 하는 일정으로 상단과 요약 영역에 먼저 노출합니다.',
    visibility: '타임라인에 연결된 대표 일정으로 강조',
  },
  general: {
    label: '일반 일정',
    summary: '세부 실행 일정으로 관리하며, 전체 프로젝트 맥락 안에서 부담 없이 확인합니다.',
    visibility: '주요 일정 아래에서 차분하게 정리',
  },
}

function formatDateLabel(date: string, time: string) {
  const parsedDate = new Date(`${date}T00:00:00`)
  const month = parsedDate.getMonth() + 1
  const day = parsedDate.getDate()

  return `${month}월 ${day}일 ${time}`
}

function formatDuration(startMonth: number, endMonth: number) {
  return `2026.${String(startMonth + 1).padStart(2, '0')} - 2026.${String(endMonth + 1).padStart(2, '0')}`
}

function buildDateTimeValue(date: string, time: string) {
  return `${date}T${time}`
}

function toGoogleCalendarDateTime(date: string, time: string) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function buildGoogleCalendarEventUrl(schedule: ScheduleItem, projectName?: string) {
  const start = toGoogleCalendarDateTime(schedule.date, schedule.time)
  const endDateTime = new Date(`${schedule.date}T${schedule.time}:00`)
  endDateTime.setHours(endDateTime.getHours() + 1)

  const end = `${endDateTime.getFullYear()}${String(endDateTime.getMonth() + 1).padStart(2, '0')}${String(
    endDateTime.getDate(),
  ).padStart(2, '0')}T${String(endDateTime.getHours()).padStart(2, '0')}${String(
    endDateTime.getMinutes(),
  ).padStart(2, '0')}00`

  const params = new URLSearchParams({
    text: schedule.title,
    dates: `${start}/${end}`,
    details: schedule.memo,
    location: projectName ?? '업무 스케줄 관리 서비스',
    ctz: 'Asia/Seoul',
  })

  return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`
}

function buildGoogleCalendarEmbedUrl(calendarId: string) {
  const params = new URLSearchParams({
    src: calendarId,
    ctz: 'Asia/Seoul',
    mode: 'AGENDA',
  })

  return `https://calendar.google.com/calendar/embed?${params.toString()}`
}

function buildGoogleCalendarViewUrl(calendarId: string) {
  const params = new URLSearchParams({
    cid: calendarId,
  })

  return `https://calendar.google.com/calendar/u/0/r?${params.toString()}`
}

function TimelineTrack({
  startMonth,
  endMonth,
}: {
  startMonth: number
  endMonth: number
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {timelineMonths.map((month, index) => {
        const isActive = index >= startMonth && index <= endMonth

        return (
          <div key={month} className="space-y-2">
            <div className="rounded-full bg-surface-primary px-3 py-2 text-center">
              <Text variant="detail20" color="text-fg-tertiary" align="center">
                {month}
              </Text>
            </div>
            <div
              className={[
                'h-4 rounded-full transition-colors',
                isActive ? 'bg-blue-800 shadow-s' : 'bg-surface-primary',
              ].join(' ')}
            />
          </div>
        )
      })}
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
  const label = kind === 'major' ? '주요 일정' : '일반 일정'

  return (
    <div className={`rounded-full px-3 py-2 ${scheduleTypeTone[kind]}`}>
      <Text variant="detail20">{label}</Text>
    </div>
  )
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules)
  const [calendarId, setCalendarId] = useState('jungah.yoo@dreamus.io')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectFormState>(defaultProjectForm())
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(
    defaultScheduleForm(initialProjects[0].id),
  )

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  )

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((a, b) =>
        buildDateTimeValue(a.date, a.time).localeCompare(buildDateTimeValue(b.date, b.time)),
      ),
    [schedules],
  )

  const todaySchedules = useMemo(
    () => sortedSchedules.filter((schedule) => schedule.date === '2026-03-31').slice(0, 3),
    [sortedSchedules],
  )

  const upcomingSchedules = useMemo(
    () => sortedSchedules.filter((schedule) => schedule.date !== '2026-03-31').slice(0, 4),
    [sortedSchedules],
  )

  const projectTimelineCards = useMemo(
    () =>
      projects.map((project) => {
        const projectSchedules = sortedSchedules.filter(
          (schedule) => schedule.projectId === project.id && schedule.kind === 'major',
        )
        const nextMilestone = projectSchedules[0]

        return {
          ...project,
          duration: formatDuration(project.startMonth, project.endMonth),
          milestone: nextMilestone
            ? {
                label: nextMilestone.title,
                date: formatDateLabel(nextMilestone.date, nextMilestone.time),
              }
            : { label: '주요 일정 없음', date: '아직 등록된 일정이 없습니다.' },
        }
      }),
    [projects, sortedSchedules],
  )

  const summaryCards = useMemo(
    () => [
      {
        label: '진행 중 프로젝트',
        value: `${projects.length}개`,
        note: '현재 작성된 프로젝트 기준',
      },
      {
        label: '다가오는 주요 일정',
        value: `${schedules.filter((schedule) => schedule.kind === 'major').length}건`,
        note: '타임라인에 먼저 노출되는 일정',
      },
      {
        label: '높은 우선순위 업무',
        value: `${schedules.filter((schedule) => schedule.priority !== '보통').length}건`,
        note: '최우선 또는 높음으로 분류된 일정',
      },
    ],
    [projects.length, schedules],
  )

  const selectedDetail = detailDescriptions[scheduleForm.kind]
  const calendarEmbedUrl = buildGoogleCalendarEmbedUrl(calendarId)
  const calendarViewUrl = buildGoogleCalendarViewUrl(calendarId)

  const handleProjectChange =
    (field: keyof ProjectFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setProjectForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleScheduleChange =
    (field: keyof ScheduleFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setScheduleForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const resetProjectForm = () => {
    setEditingProjectId(null)
    setProjectForm(defaultProjectForm())
  }

  const resetScheduleForm = (projectId?: string) => {
    setEditingScheduleId(null)
    setScheduleForm(defaultScheduleForm(projectId ?? projects[0]?.id ?? ''))
  }

  const saveProject = () => {
    const safeStartMonth = Math.max(0, Math.min(5, Number(projectForm.startMonth) || 0))
    const safeEndMonth = Math.max(safeStartMonth, Math.min(5, Number(projectForm.endMonth) || 0))
    const nextProject: ProjectItem = {
      id: editingProjectId ?? `project-${Date.now()}`,
      name: projectForm.name || '새 프로젝트',
      owner: projectForm.owner || '담당자 미정',
      priority: projectForm.priority,
      progress: Math.max(0, Math.min(100, Number(projectForm.progress) || 0)),
      startMonth: safeStartMonth,
      endMonth: safeEndMonth,
    }

    setProjects((current) =>
      editingProjectId
        ? current.map((project) => (project.id === editingProjectId ? nextProject : project))
        : [...current, nextProject],
    )

    if (!editingProjectId) {
      setScheduleForm((current) => ({ ...current, projectId: nextProject.id }))
    }

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

    setSchedules((current) =>
      editingScheduleId
        ? current.map((schedule) =>
            schedule.id === editingScheduleId ? nextSchedule : schedule,
          )
        : [...current, nextSchedule],
    )

    resetScheduleForm(scheduleForm.projectId)
  }

  const editProject = (projectId: string) => {
    const target = projects.find((project) => project.id === projectId)
    if (!target) return

    setEditingProjectId(projectId)
    setProjectForm({
      name: target.name,
      owner: target.owner,
      priority: target.priority,
      progress: String(target.progress),
      startMonth: String(target.startMonth),
      endMonth: String(target.endMonth),
    })
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
      priority: target.priority,
      kind: target.kind,
      memo: target.memo,
    })
  }

  const removeProject = (projectId: string) => {
    const remainingProjects = projects.filter((project) => project.id !== projectId)
    setProjects(remainingProjects)
    setSchedules((current) => current.filter((schedule) => schedule.projectId !== projectId))

    if (editingProjectId === projectId) {
      resetProjectForm()
    }

    if (scheduleForm.projectId === projectId) {
      resetScheduleForm(remainingProjects[0]?.id ?? '')
    }
  }

  const removeSchedule = (scheduleId: string) => {
    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
    if (editingScheduleId === scheduleId) {
      resetScheduleForm(scheduleForm.projectId)
    }
  }

  const openGoogleCalendar = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-50 via-surface to-teal-300/30 p-6 shadow-l md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-[760px] space-y-4">
              <div className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 shadow-s">
                <Text variant="detail20" color="text-blue-900">
                  개인 프로젝트 일정 대시보드
                </Text>
              </div>
              <Text variant="heading" as="h1" color="text-fg-primary" className="max-w-[900px]">
                반년짜리 프로젝트도 끊기지 않게, 지금 진행 중인 업무를 한 화면에서 봅니다.
              </Text>
              <Text variant="body24" color="text-fg-secondary" className="max-w-[820px]">
                길게 이어지는 프로젝트 기간, 중간 마일스톤, 이번 주에 바로 챙겨야 할 일정까지
                한 번에 정리한 개인용 업무 스케줄 보드입니다.
              </Text>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
              <Button variant="primary" size="sm" shape="round">
                이번 주 일정 보기
              </Button>
              <Button variant="outlineDark" size="sm" shape="round">
                구글 캘린더 열기
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <Card
                key={card.label}
                padding="md"
                className="border-transparent bg-white/80 backdrop-blur"
              >
                <div className="space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary">
                    {card.label}
                  </Text>
                  <Text variant="body24" as="p" color="text-fg-primary">
                    {card.value}
                  </Text>
                  <Text variant="detail20" color="text-fg-secondary">
                    {card.note}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <Card padding="lg" className="border-transparent bg-white shadow-m">
            <div className="space-y-6">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-primary">
                  주요 일정과 일반 일정 구분하기
                </Text>
                <Text variant="detail20" color="text-fg-secondary">
                  일정 성격과 우선순위를 먼저 정하면, 어디에 얼마나 강조해서 보여줄지 바로
                  결정할 수 있습니다.
                </Text>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                <div className="space-y-6">
                  <label className="block space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      일정 이름
                    </Text>
                    <input
                      value={scheduleForm.title}
                      onChange={handleScheduleChange('title')}
                      className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      placeholder="일정 이름을 입력하세요"
                    />
                  </label>

                  <label className="block space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      연결할 프로젝트
                    </Text>
                    <select
                      value={scheduleForm.projectId}
                      onChange={handleScheduleChange('projectId')}
                      className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                    >
                      {projectOptions.map((project) => (
                        <option key={project.value} value={project.value}>
                          {project.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      일정 구분
                    </Text>
                    <div className="grid gap-3 md:grid-cols-2">
                      {scheduleTypeCards.map((option) => {
                        const isSelected = scheduleForm.kind === option.key

                        return (
                          <label
                            key={option.key}
                            className={[
                              'cursor-pointer rounded-[28px] border p-4 transition',
                              isSelected
                                ? 'border-blue-800 bg-blue-50 shadow-s'
                                : 'border-[var(--color-border)] bg-surface',
                            ].join(' ')}
                          >
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() =>
                                setScheduleForm((current) => ({ ...current, kind: option.key }))
                              }
                              className="sr-only"
                            />
                            <div className="space-y-2">
                              <Text variant="body24" color="text-fg-primary">
                                {option.title}
                              </Text>
                              <Text variant="detail20" color="text-fg-secondary">
                                {option.description}
                              </Text>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      우선순위
                    </Text>
                    <div className="grid gap-3 md:grid-cols-3">
                      {priorityCards.map((option) => {
                        const isSelected = scheduleForm.priority === option.key

                        return (
                          <label
                            key={option.key}
                            className={[
                              'cursor-pointer rounded-[28px] border p-4 transition',
                              isSelected
                                ? 'border-gray-800 bg-gray-800 text-white shadow-s'
                                : 'border-[var(--color-border)] bg-surface',
                            ].join(' ')}
                          >
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() =>
                                setScheduleForm((current) => ({
                                  ...current,
                                  priority: option.key,
                                }))
                              }
                              className="sr-only"
                            />
                            <div className="space-y-2">
                              <Text
                                variant="body24"
                                color={isSelected ? 'text-fg-inverse' : 'text-fg-primary'}
                              >
                                {option.title}
                              </Text>
                              <Text
                                variant="detail20"
                                color={isSelected ? 'text-alpha-white-700' : 'text-fg-secondary'}
                              >
                                {option.description}
                              </Text>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <Card
                  padding="lg"
                  className={`border ${priorityAccent[scheduleForm.priority]} shadow-s`}
                >
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start gap-2">
                      <ScheduleTypeBadge kind={scheduleForm.kind} />
                      <PriorityBadge priority={scheduleForm.priority} />
                    </div>
                    <div className="space-y-2">
                      <Text variant="body24" as="h3" color="text-fg-primary">
                        {scheduleForm.title || '일정 미리보기'}
                      </Text>
                      <Text variant="detail20" color="text-fg-secondary">
                        {formatDateLabel(scheduleForm.date, scheduleForm.time)}
                      </Text>
                    </div>
                    <div className="rounded-[24px] bg-white/80 p-4">
                      <Text variant="detail20" color="text-fg-tertiary">
                        표시 방식
                      </Text>
                      <Text variant="body24" color="text-fg-primary" className="mt-1">
                        {selectedDetail.visibility}
                      </Text>
                      <Text variant="detail20" color="text-fg-secondary" className="mt-2">
                        {selectedDetail.summary}
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="border-transparent bg-gray-800 shadow-m">
            <div className="space-y-5">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-inverse">
                  일정 우선순위 가이드
                </Text>
                <Text variant="detail20" color="text-alpha-white-700">
                  우선순위를 정해두면 급한 일정과 일반 일정을 섞지 않고 바로 구분할 수
                  있습니다.
                </Text>
              </div>

              <div className="space-y-3">
                {priorityCards.map((option) => (
                  <div key={option.key} className="rounded-[24px] bg-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Text variant="body24" color="text-fg-inverse">
                        {option.title}
                      </Text>
                      <PriorityBadge priority={option.key} />
                    </div>
                    <Text variant="detail20" color="text-alpha-white-700" className="mt-2">
                      {option.description}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,1fr)]">
          <Card padding="lg" className="border-transparent bg-white shadow-m">
            <div className="space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <Text variant="body24" as="h2" color="text-fg-primary">
                    프로젝트 추가와 수정
                  </Text>
                  <Text variant="detail20" color="text-fg-secondary">
                    새 프로젝트를 만들고 기간, 우선순위, 진행률을 직접 바꿔서 메인 타임라인에
                    연결합니다.
                  </Text>
                </div>
                <Text variant="detail20" color="text-fg-tertiary">
                  {editingProjectId ? '현재 프로젝트 수정 중' : '새 프로젝트 작성 중'}
                </Text>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
                <div className="space-y-4">
                  <label className="block space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      프로젝트 이름
                    </Text>
                    <input
                      value={projectForm.name}
                      onChange={handleProjectChange('name')}
                      className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      placeholder="프로젝트 이름을 입력하세요"
                    />
                  </label>

                  <label className="block space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      담당 조직
                    </Text>
                    <input
                      value={projectForm.owner}
                      onChange={handleProjectChange('owner')}
                      className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      placeholder="담당 팀 또는 담당자를 입력하세요"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        시작 월
                      </Text>
                      <select
                        value={projectForm.startMonth}
                        onChange={handleProjectChange('startMonth')}
                        className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      >
                        {timelineMonths.map((month, index) => (
                          <option key={`start-${month}`} value={String(index)}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        종료 월
                      </Text>
                      <select
                        value={projectForm.endMonth}
                        onChange={handleProjectChange('endMonth')}
                        className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      >
                        {timelineMonths.map((month, index) => (
                          <option key={`end-${month}`} value={String(index)}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        우선순위
                      </Text>
                      <select
                        value={projectForm.priority}
                        onChange={handleProjectChange('priority')}
                        className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      >
                        {priorityCards.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        진행률
                      </Text>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={projectForm.progress}
                        onChange={handleProjectChange('progress')}
                        className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" size="sm" shape="round" onClick={saveProject}>
                      {editingProjectId ? '프로젝트 수정 저장' : '새 프로젝트 추가'}
                    </Button>
                    <Button variant="outlineDark" size="sm" shape="round" onClick={resetProjectForm}>
                      입력 초기화
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {projectTimelineCards.map((project) => (
                    <Card
                      key={project.id}
                      padding="md"
                      className={`border ${priorityAccent[project.priority]} shadow-s`}
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <Text variant="body24" as="h3" color="text-fg-primary">
                              {project.name}
                            </Text>
                            <Text variant="detail20" color="text-fg-secondary">
                              {project.owner}
                            </Text>
                          </div>
                          <PriorityBadge priority={project.priority} />
                        </div>

                        <TimelineTrack startMonth={project.startMonth} endMonth={project.endMonth} />

                        <div className="rounded-[24px] bg-white/80 p-4">
                          <Text variant="detail20" color="text-fg-tertiary">
                            다음 주요 일정
                          </Text>
                          <Text variant="body24" color="text-fg-primary" className="mt-1">
                            {project.milestone.label}
                          </Text>
                          <Text variant="detail20" color="text-fg-secondary" className="mt-1">
                            {project.milestone.date}
                          </Text>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outlineDark"
                            size="sm"
                            shape="round"
                            onClick={() => editProject(project.id)}
                          >
                            프로젝트 수정
                          </Button>
                          <Button
                            variant="outlineDark"
                            size="sm"
                            shape="round"
                            onClick={() => removeProject(project.id)}
                          >
                            프로젝트 삭제
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="border-transparent bg-surface-primary shadow-m">
            <div className="space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <Text variant="body24" as="h2" color="text-fg-primary">
                    등록된 일정 관리
                  </Text>
                  <Text variant="detail20" color="text-fg-secondary">
                    저장한 일정은 바로 목록에 반영되고, 수정과 삭제도 이 영역에서 처리합니다.
                  </Text>
                </div>
                <Text variant="detail20" color="text-fg-tertiary">
                  총 {sortedSchedules.length}개 일정
                </Text>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary">
                    날짜
                  </Text>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={handleScheduleChange('date')}
                    className="w-full rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                  />
                </label>
                <label className="block space-y-3">
                  <Text variant="detail20" color="text-fg-tertiary">
                    시간
                  </Text>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={handleScheduleChange('time')}
                    className="w-full rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                  />
                </label>
              </div>

              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">
                  일정 메모
                </Text>
                <input
                  value={scheduleForm.memo}
                  onChange={handleScheduleChange('memo')}
                  className="w-full rounded-[24px] border border-[var(--color-border)] bg-white px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                  placeholder="일정 메모를 입력하세요"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm" shape="round" onClick={saveSchedule}>
                  {editingScheduleId ? '일정 수정 저장' : '새 일정 추가'}
                </Button>
                <Button
                  variant="outlineDark"
                  size="sm"
                  shape="round"
                  onClick={() => resetScheduleForm(scheduleForm.projectId)}
                >
                  입력 초기화
                </Button>
              </div>

              <div className="space-y-3">
                {sortedSchedules.map((schedule) => {
                  const project = projects.find((item) => item.id === schedule.projectId)

                  return (
                    <Card
                      key={schedule.id}
                      padding="md"
                      className={`border ${priorityAccent[schedule.priority]} shadow-s`}
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <ScheduleTypeBadge kind={schedule.kind} />
                              <PriorityBadge priority={schedule.priority} />
                            </div>
                            <Text variant="body24" as="h3" color="text-fg-primary">
                              {schedule.title}
                            </Text>
                            <Text variant="detail20" color="text-fg-secondary">
                              {project?.name ?? '연결된 프로젝트 없음'}
                            </Text>
                          </div>
                          <Text variant="detail20" color="text-fg-tertiary">
                            {formatDateLabel(schedule.date, schedule.time)}
                          </Text>
                        </div>

                        <Text variant="detail20" color="text-fg-primary">
                          {schedule.memo}
                        </Text>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outlineDark"
                            size="sm"
                            shape="round"
                            onClick={() =>
                              openGoogleCalendar(
                                buildGoogleCalendarEventUrl(schedule, project?.name),
                              )
                            }
                          >
                            구글 캘린더에 추가
                          </Button>
                          <Button
                            variant="outlineDark"
                            size="sm"
                            shape="round"
                            onClick={() => editSchedule(schedule.id)}
                          >
                            일정 수정
                          </Button>
                          <Button
                            variant="outlineDark"
                            size="sm"
                            shape="round"
                            onClick={() => removeSchedule(schedule.id)}
                          >
                            일정 삭제
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
          <Card padding="lg" className="border-transparent bg-white shadow-m">
            <div className="space-y-6">
              <div className="space-y-2">
                <Text variant="body24" as="h2" color="text-fg-primary">
                  구글 캘린더 연동
                </Text>
                <Text variant="detail20" color="text-fg-secondary">
                  일정은 바로 구글 캘린더에 추가하고, 자주 보는 캘린더는 같은 화면에서 함께
                  열어볼 수 있습니다.
                </Text>
              </div>

              <label className="block space-y-3">
                <Text variant="detail20" color="text-fg-tertiary">
                  열어볼 캘린더 ID 또는 이메일
                </Text>
                <input
                  value={calendarId}
                  onChange={(event) => setCalendarId(event.target.value)}
                  className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                  placeholder="example@group.calendar.google.com"
                />
              </label>

              <div className="rounded-[28px] bg-surface-primary p-5">
                <Text variant="detail20" color="text-fg-tertiary">
                  연동 방식
                </Text>
                <Text variant="body24" color="text-fg-primary" className="mt-2">
                  1. 원하는 일정에서 "구글 캘린더에 추가" 버튼을 누릅니다.
                </Text>
                <Text variant="body24" color="text-fg-primary" className="mt-2">
                  2. 아래 캘린더 미리보기와 "캘린더 크게 열기"로 같은 캘린더를 바로 확인합니다.
                </Text>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  shape="round"
                  onClick={() => openGoogleCalendar(calendarViewUrl)}
                >
                  캘린더 크게 열기
                </Button>
                <Button
                  variant="outlineDark"
                  size="sm"
                  shape="round"
                  onClick={() =>
                    openGoogleCalendar(
                      buildGoogleCalendarEventUrl(
                        {
                          id: 'preview',
                          projectId: scheduleForm.projectId,
                          title: scheduleForm.title || '새 일정',
                          date: scheduleForm.date,
                          time: scheduleForm.time,
                          priority: scheduleForm.priority,
                          kind: scheduleForm.kind,
                          memo: scheduleForm.memo || '메모 없음',
                        },
                        projects.find((project) => project.id === scheduleForm.projectId)?.name,
                      ),
                    )
                  }
                >
                  현재 입력 일정 추가
                </Button>
              </div>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden border-transparent bg-white shadow-m">
            <div className="border-b border-[var(--color-border)] px-6 py-5">
              <Text variant="body24" as="h2" color="text-fg-primary">
                선택한 구글 캘린더 보기
              </Text>
              <Text variant="detail20" color="text-fg-secondary" className="mt-2">
                {calendarId || '캘린더 ID를 입력하면 여기에 표시됩니다.'}
              </Text>
            </div>
            <iframe
              title="Google Calendar Preview"
              src={calendarEmbedUrl}
              className="h-[520px] w-full border-0"
            />
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <Card padding="lg" className="border-transparent bg-surface-primary shadow-m">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <Text variant="body24" as="h2" color="text-fg-primary">
                    진행 중인 프로젝트 타임라인
                  </Text>
                  <Text variant="detail20" color="text-fg-secondary">
                    긴 일정도 월 단위로 이어서 보고, 다음 마일스톤을 바로 확인할 수 있습니다.
                  </Text>
                </div>
                <div className="rounded-full bg-white px-4 py-2 shadow-s">
                  <Text variant="detail20" color="text-blue-900">
                    현재 기준: 2026년 3월 마지막 주
                  </Text>
                </div>
              </div>

              <div className="space-y-4">
                {projectTimelineCards.map((project) => (
                  <Card
                    key={project.id}
                    padding="md"
                    className="border-transparent bg-white shadow-s"
                  >
                    <div className="space-y-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <Text variant="body24" as="h3" color="text-fg-primary">
                            {project.name}
                          </Text>
                          <div className="flex flex-wrap items-center gap-2">
                            <Text variant="detail20" color="text-fg-secondary">
                              {project.duration}
                            </Text>
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            <Text variant="detail20" color="text-fg-secondary">
                              {project.owner}
                            </Text>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={project.priority} />
                          <div className="rounded-full bg-blue-50 px-3 py-2">
                            <Text variant="detail20" color="text-blue-900">
                              진행률 {project.progress}%
                            </Text>
                          </div>
                        </div>
                      </div>

                      <TimelineTrack startMonth={project.startMonth} endMonth={project.endMonth} />

                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div className="rounded-[24px] bg-surface-primary p-4">
                          <Text variant="detail20" color="text-fg-tertiary">
                            다음 주요 일정
                          </Text>
                          <Text variant="body24" color="text-fg-primary" className="mt-1">
                            {project.milestone.label}
                          </Text>
                          <Text variant="detail20" color="text-fg-secondary" className="mt-1">
                            {project.milestone.date}
                          </Text>
                        </div>

                        <Button variant="outlineDark" size="sm" shape="round">
                          상세 보기
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card padding="lg" className="border-transparent bg-gray-800 shadow-m">
              <div className="space-y-4">
                <Text variant="body24" as="h2" color="text-fg-inverse">
                  오늘 바로 챙길 일정
                </Text>
                <Text variant="detail20" color="text-alpha-white-700">
                  오늘 날짜에 잡힌 일정만 따로 모아서 바로 확인할 수 있습니다.
                </Text>

                <div className="space-y-3">
                  {todaySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`rounded-[24px] border p-4 backdrop-blur ${priorityAccent[schedule.priority]}`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <ScheduleTypeBadge kind={schedule.kind} />
                          <PriorityBadge priority={schedule.priority} />
                        </div>
                        <Text variant="body24" color="text-fg-inverse">
                          {schedule.title}
                        </Text>
                        <Text variant="detail20" color="text-alpha-white-700">
                          {formatDateLabel(schedule.date, schedule.time)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card padding="lg" className="border-transparent bg-white shadow-m">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Text variant="body24" as="h2" color="text-fg-primary">
                    곧 다가오는 일정
                  </Text>
                  <Text variant="detail20" color="text-fg-secondary">
                    새로 추가한 일정도 시간 순서대로 바로 반영됩니다.
                  </Text>
                </div>

                <div className="space-y-3">
                  {upcomingSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`rounded-[24px] border p-4 ${priorityAccent[schedule.priority]}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <ScheduleTypeBadge kind={schedule.kind} />
                            <PriorityBadge priority={schedule.priority} />
                          </div>
                          <Text variant="body24" color="text-fg-primary">
                            {schedule.title}
                          </Text>
                          <Text variant="detail20" color="text-fg-secondary">
                            {formatDateLabel(schedule.date, schedule.time)}
                          </Text>
                        </div>
                        <Text variant="detail20" color="text-fg-tertiary">
                          {schedule.kind === 'major' ? '요약 카드 노출' : '세부 일정 보관'}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
