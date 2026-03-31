'use client'

import { ChangeEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'

type ScheduleKind = 'major' | 'general'
type PriorityLevel = '최우선' | '높음' | '보통'

const timelineMonths = ['1월', '2월', '3월', '4월', '5월', '6월']

const summaryCards = [
  { label: '진행 중 프로젝트', value: '4개', note: '이번 분기 기준' },
  { label: '다가오는 주요 일정', value: '7건', note: '2주 안에 확인 필요' },
  { label: '높은 우선순위 업무', value: '5건', note: '이번 주 집중 구간' },
]

const projectTimelines = [
  {
    name: '2026 상반기 브랜드 개편',
    duration: '2026.01 - 2026.06',
    owner: '브랜드 경험팀',
    priority: '최우선' as PriorityLevel,
    progress: 58,
    startMonth: 0,
    endMonth: 5,
    milestone: { label: '중간 점검', date: '4월 12일 14:00' },
  },
  {
    name: '신규 구독 전환 실험',
    duration: '2026.02 - 2026.05',
    owner: 'Growth Squad',
    priority: '높음' as PriorityLevel,
    progress: 41,
    startMonth: 1,
    endMonth: 4,
    milestone: { label: 'A/B 테스트 오픈', date: '4월 5일 10:30' },
  },
  {
    name: '사내 운영 자동화 정비',
    duration: '2026.03 - 2026.06',
    owner: 'Operations',
    priority: '보통' as PriorityLevel,
    progress: 24,
    startMonth: 2,
    endMonth: 5,
    milestone: { label: '업무 플로우 리뷰', date: '4월 18일 16:00' },
  },
]

const milestoneGroups = [
  {
    title: '오늘 바로 볼 일정',
    items: [
      {
        name: '브랜드 개편 주간 싱크',
        time: '오늘 15:00',
        priority: '최우선' as PriorityLevel,
        kind: 'major' as ScheduleKind,
      },
      {
        name: '자동화 정비 킥오프 점검',
        time: '오늘 17:30',
        priority: '높음' as PriorityLevel,
        kind: 'general' as ScheduleKind,
      },
    ],
  },
  {
    title: '이번 주 주요 일정',
    items: [
      {
        name: 'A/B 테스트 결과 공유',
        time: '4월 3일 11:00',
        priority: '높음' as PriorityLevel,
        kind: 'major' as ScheduleKind,
      },
      {
        name: '프로젝트 리스크 점검',
        time: '4월 4일 14:00',
        priority: '보통' as PriorityLevel,
        kind: 'general' as ScheduleKind,
      },
      {
        name: '상반기 중간 리뷰',
        time: '4월 5일 16:30',
        priority: '최우선' as PriorityLevel,
        kind: 'major' as ScheduleKind,
      },
    ],
  },
]

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
  const [scheduleTitle, setScheduleTitle] = useState('상반기 중간 리뷰')
  const [scheduleType, setScheduleType] = useState<ScheduleKind>('major')
  const [schedulePriority, setSchedulePriority] = useState<PriorityLevel>('최우선')
  const [scheduleDate, setScheduleDate] = useState('2026-04-05')
  const [scheduleTime, setScheduleTime] = useState('16:30')
  const [scheduleMemo, setScheduleMemo] = useState(
    '프로젝트 리더와 핵심 담당자가 함께 참석하는 중간 점검 일정',
  )

  const selectedDetail = detailDescriptions[scheduleType]

  const handleInputChange =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
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
                  <div className="space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      일정 이름
                    </Text>
                    <label className="block">
                      <input
                        value={scheduleTitle}
                        onChange={handleInputChange(setScheduleTitle)}
                        className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                        placeholder="일정 이름을 입력하세요"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      일정 구분
                    </Text>
                    <div className="grid gap-3 md:grid-cols-2">
                      {scheduleTypeCards.map((option) => {
                        const isSelected = scheduleType === option.key

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
                              name="schedule-type"
                              value={option.key}
                              checked={isSelected}
                              onChange={() => setScheduleType(option.key)}
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
                        const isSelected = schedulePriority === option.key

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
                              name="priority-level"
                              value={option.key}
                              checked={isSelected}
                              onChange={() => setSchedulePriority(option.key)}
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        날짜
                      </Text>
                      <label className="block">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={handleInputChange(setScheduleDate)}
                          className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                        />
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        시간
                      </Text>
                      <label className="block">
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={handleInputChange(setScheduleTime)}
                          className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Text variant="detail20" color="text-fg-tertiary">
                      일정 메모
                    </Text>
                    <label className="block">
                      <input
                        value={scheduleMemo}
                        onChange={handleInputChange(setScheduleMemo)}
                        className="w-full rounded-[24px] border border-[var(--color-border)] bg-surface px-5 py-4 text-body1 text-fg-primary outline-none transition focus:border-blue-800"
                        placeholder="일정 메모를 입력하세요"
                      />
                    </label>
                  </div>
                </div>

                <Card
                  padding="lg"
                  className={`border ${priorityAccent[schedulePriority]} shadow-s`}
                >
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start gap-2">
                      <ScheduleTypeBadge kind={scheduleType} />
                      <PriorityBadge priority={schedulePriority} />
                    </div>

                    <div className="space-y-2">
                      <Text variant="body24" as="h3" color="text-fg-primary">
                        {scheduleTitle}
                      </Text>
                      <Text variant="detail20" color="text-fg-secondary">
                        {scheduleDate} {scheduleTime}
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

                    <div className="rounded-[24px] bg-white/80 p-4">
                      <Text variant="detail20" color="text-fg-tertiary">
                        일정 메모
                      </Text>
                      <Text variant="detail20" color="text-fg-primary" className="mt-2">
                        {scheduleMemo}
                      </Text>
                    </div>

                    <div className="space-y-3">
                      <Text variant="detail20" color="text-fg-tertiary">
                        상세 정보 요약
                      </Text>
                      <div className="space-y-2 rounded-[24px] bg-white/80 p-4">
                        <Text variant="detail20" color="text-fg-secondary">
                          일정 종류
                        </Text>
                        <Text variant="body24" color="text-fg-primary">
                          {selectedDetail.label}
                        </Text>
                      </div>
                      <div className="space-y-2 rounded-[24px] bg-white/80 p-4">
                        <Text variant="detail20" color="text-fg-secondary">
                          우선 확인 포인트
                        </Text>
                        <Text variant="body24" color="text-fg-primary">
                          {schedulePriority === '최우선'
                            ? '알림과 요약에서 가장 먼저 보여줘야 합니다.'
                            : schedulePriority === '높음'
                              ? '이번 주 체크 영역에 우선 배치하면 좋습니다.'
                              : '프로젝트 세부 일정 안에서 꾸준히 관리하면 됩니다.'}
                        </Text>
                      </div>
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
                {projectTimelines.map((project) => (
                  <Card
                    key={project.name}
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

                      <TimelineTrack
                        startMonth={project.startMonth}
                        endMonth={project.endMonth}
                      />

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
                  지금 바로 챙길 일정
                </Text>
                <Text variant="detail20" color="text-alpha-white-700">
                  급한 일정만 따로 모아 두어서 오늘과 이번 주 해야 할 일을 빠르게 판단할 수
                  있습니다.
                </Text>

                <div className="space-y-3">
                  {milestoneGroups[0].items.map((item) => (
                    <div
                      key={item.name}
                      className={`rounded-[24px] border p-4 backdrop-blur ${priorityAccent[item.priority]}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2">
                            <ScheduleTypeBadge kind={item.kind} />
                            <PriorityBadge priority={item.priority} />
                          </div>
                          <Text variant="body24" color="text-fg-inverse" className="mt-3">
                            {item.name}
                          </Text>
                          <Text variant="detail20" color="text-alpha-white-700">
                            {item.time}
                          </Text>
                        </div>
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
                    이번 주 주요 일정
                  </Text>
                  <Text variant="detail20" color="text-fg-secondary">
                    프로젝트를 눌러 들어가지 않아도, 중요한 일정만 빠르게 훑을 수 있는
                    영역입니다.
                  </Text>
                </div>

                <div className="space-y-3">
                  {milestoneGroups[1].items.map((item) => (
                    <div
                      key={item.name}
                      className={`rounded-[24px] border p-4 ${priorityAccent[item.priority]}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <ScheduleTypeBadge kind={item.kind} />
                            <PriorityBadge priority={item.priority} />
                          </div>
                          <Text variant="body24" color="text-fg-primary">
                            {item.name}
                          </Text>
                          <Text variant="detail20" color="text-fg-secondary">
                            {item.time}
                          </Text>
                        </div>
                        <Text variant="detail20" color="text-fg-tertiary">
                          {item.kind === 'major' ? '요약 카드 노출' : '세부 일정 보관'}
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
