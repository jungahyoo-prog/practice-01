'use client'

import { getSupabaseBrowserClient, isLocalStorageProvider, requireSupabaseStorageAccount } from '@/db/client'
import { deleteLocalDashboardProject, deleteLocalDashboardSchedule, loadLocalDashboardData, saveLocalDashboardProject, saveLocalDashboardSchedule, seedLocalDashboardData } from '@/db/sqlite'
import type { Database } from '@/db/types/database'

export type DashboardPriority = '최우선' | '높음' | '보통'
export type DashboardScheduleKind = 'major' | 'general'
export type DashboardRepeatType = 'none' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type DashboardProject = {
  id: string
  name: string
  owner: string
  priority: DashboardPriority
  progress: number
  startDate: string
  endDate: string
}

export type DashboardSchedule = {
  id: string
  projectId: string
  title: string
  date: string
  time: string
  priority: DashboardPriority
  kind: DashboardScheduleKind
  repeatType: DashboardRepeatType
  repeatCustom: string
  repeatCustomLabel: string
  memo: string
}

type ProjectRow = Database['public']['Tables']['dashboard_projects']['Row']
type ProjectInsert = Database['public']['Tables']['dashboard_projects']['Insert']
type ScheduleRow = Database['public']['Tables']['dashboard_schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['dashboard_schedules']['Insert']

function buildScopedSeedId(userId: string, id: string) {
  return `${userId}:${id}`
}

function mapProjectRow(row: ProjectRow): DashboardProject {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    priority: row.priority,
    progress: row.progress,
    startDate: row.start_date,
    endDate: row.end_date,
  }
}

function mapScheduleRow(row: ScheduleRow): DashboardSchedule {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    date: row.date,
    time: row.time.slice(0, 5),
    priority: row.priority,
    kind: row.kind,
    repeatType: row.repeat_type,
    repeatCustom: row.repeat_custom,
    repeatCustomLabel: row.repeat_custom_label,
    memo: row.memo,
  }
}

async function fetchProjects() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('dashboard_projects')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) throw error

  return (data ?? []).map(mapProjectRow)
}

async function fetchSchedules() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('dashboard_schedules')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error

  return (data ?? []).map(mapScheduleRow)
}

export async function loadSupabaseDashboardData() {
  await requireSupabaseStorageAccount()
  const [projects, schedules] = await Promise.all([fetchProjects(), fetchSchedules()])

  return { projects, schedules }
}

export async function loadDashboardData() {
  if (isLocalStorageProvider) {
    return loadLocalDashboardData()
  }

  return loadSupabaseDashboardData()
}

export async function seedDashboardData(projects: DashboardProject[], schedules: DashboardSchedule[]) {
  if (isLocalStorageProvider) {
    return seedLocalDashboardData(projects, schedules)
  }

  const supabase = getSupabaseBrowserClient()
  const user = await requireSupabaseStorageAccount()
  const scopedProjectIdMap = new Map(projects.map((project) => [project.id, buildScopedSeedId(user.id, project.id)]))

  const projectRows: ProjectInsert[] = projects.map((project) => ({
    id: scopedProjectIdMap.get(project.id) ?? project.id,
    user_id: user.id,
    name: project.name,
    owner: project.owner,
    priority: project.priority,
    progress: project.progress,
    start_date: project.startDate,
    end_date: project.endDate,
  }))

  const scheduleRows: ScheduleInsert[] = schedules.map((schedule) => ({
    id: buildScopedSeedId(user.id, schedule.id),
    user_id: user.id,
    project_id: scopedProjectIdMap.get(schedule.projectId) ?? schedule.projectId,
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    priority: schedule.priority,
    kind: schedule.kind,
    repeat_type: schedule.repeatType,
    repeat_custom: schedule.repeatCustom,
    repeat_custom_label: schedule.repeatCustomLabel,
    memo: schedule.memo,
  }))

  const { error: projectError } = await supabase.from('dashboard_projects').upsert(projectRows, { onConflict: 'id' })
  if (projectError) throw projectError

  const { error: scheduleError } = await supabase.from('dashboard_schedules').upsert(scheduleRows, { onConflict: 'id' })
  if (scheduleError) throw scheduleError

  return loadDashboardData()
}

export async function saveDashboardProject(project: DashboardProject) {
  if (isLocalStorageProvider) {
    return saveLocalDashboardProject(project)
  }

  const supabase = getSupabaseBrowserClient()
  const user = await requireSupabaseStorageAccount()

  const payload: ProjectInsert = {
    id: project.id,
    user_id: user.id,
    name: project.name,
    owner: project.owner,
    priority: project.priority,
    progress: project.progress,
    start_date: project.startDate,
    end_date: project.endDate,
  }

  const { data, error } = await supabase
    .from('dashboard_projects')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error

  return mapProjectRow(data)
}

export async function saveDashboardSchedule(schedule: DashboardSchedule) {
  if (isLocalStorageProvider) {
    return saveLocalDashboardSchedule(schedule)
  }

  const supabase = getSupabaseBrowserClient()
  const user = await requireSupabaseStorageAccount()

  const payload: ScheduleInsert = {
    id: schedule.id,
    user_id: user.id,
    project_id: schedule.projectId,
    title: schedule.title,
    date: schedule.date,
    time: schedule.time,
    priority: schedule.priority,
    kind: schedule.kind,
    repeat_type: schedule.repeatType,
    repeat_custom: schedule.repeatCustom,
    repeat_custom_label: schedule.repeatCustomLabel,
    memo: schedule.memo,
  }

  const { data, error } = await supabase
    .from('dashboard_schedules')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error

  return mapScheduleRow(data)
}

export async function deleteDashboardProject(projectId: string) {
  if (isLocalStorageProvider) {
    await deleteLocalDashboardProject(projectId)
    return
  }

  const supabase = getSupabaseBrowserClient()
  await requireSupabaseStorageAccount()

  const { error } = await supabase.from('dashboard_projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function deleteDashboardSchedule(scheduleId: string) {
  if (isLocalStorageProvider) {
    await deleteLocalDashboardSchedule(scheduleId)
    return
  }

  const supabase = getSupabaseBrowserClient()
  await requireSupabaseStorageAccount()

  const { error } = await supabase.from('dashboard_schedules').delete().eq('id', scheduleId)
  if (error) throw error
}
