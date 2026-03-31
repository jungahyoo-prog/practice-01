'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'

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
    priority: '최우선',
    progress: 58,
    startMonth: 0,
    endMonth: 5,
    milestone: { label: '중간 점검', date: '4월 12일 14:00' },
  },
  {
    name: '신규 구독 전환 실험',
    duration: '2026.02 - 2026.05',
    owner: 'Growth Squad',
    priority: '높음',
    progress: 41,
    startMonth: 1,
    endMonth: 4,
    milestone: { label: 'A/B 테스트 오픈', date: '4월 5일 10:30' },
  },
  {
    name: '사내 운영 자동화 정비',
    duration: '2026.03 - 2026.06',
    owner: 'Operations',
    priority: '보통',
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
      { name: '브랜드 개편 주간 싱크', time: '오늘 15:00', priority: '최우선' },
      { name: '자동화 정비 킥오프 점검', time: '오늘 17:30', priority: '높음' },
    ],
  },
  {
    title: '이번 주 주요 일정',
    items: [
      { name: 'A/B 테스트 결과 공유', time: '4월 3일 11:00', priority: '높음' },
      { name: '프로젝트 리스크 점검', time: '4월 4일 14:00', priority: '보통' },
      { name: '상반기 중간 리뷰', time: '4월 5일 16:30', priority: '최우선' },
    ],
  },
]

const priorityTone: Record<string, string> = {
  최우선: 'bg-red-300 text-red-900',
  높음: 'bg-amber-300 text-amber-900',
  보통: 'bg-blue-50 text-blue-900',
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

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <div className={`rounded-full px-3 py-2 ${priorityTone[priority]}`}>
      <Text variant="detail20">{priority}</Text>
    </div>
  )
}

export default function Home() {
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
                          <Text
                            variant="body24"
                            color="text-fg-primary"
                            className="mt-1"
                          >
                            {project.milestone.label}
                          </Text>
                          <Text
                            variant="detail20"
                            color="text-fg-secondary"
                            className="mt-1"
                          >
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
                      className="rounded-[24px] bg-white/10 p-4 backdrop-blur"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Text variant="body24" color="text-fg-inverse">
                            {item.name}
                          </Text>
                          <Text variant="detail20" color="text-alpha-white-700">
                            {item.time}
                          </Text>
                        </div>
                        <PriorityBadge priority={item.priority} />
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
                      className="flex items-start justify-between gap-4 rounded-[24px] border border-[var(--color-border)] bg-surface p-4"
                    >
                      <div className="space-y-1">
                        <Text variant="body24" color="text-fg-primary">
                          {item.name}
                        </Text>
                        <Text variant="detail20" color="text-fg-secondary">
                          {item.time}
                        </Text>
                      </div>
                      <PriorityBadge priority={item.priority} />
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
