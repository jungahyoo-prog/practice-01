'use client'

import initSqlJs from 'sql.js'
import type { BindParams, Database as SqlDatabase, SqlJsStatic, SqlValue } from 'sql.js'
import type { DashboardProject, DashboardSchedule } from '@/db/dashboard'

const SQLITE_WASM_FILENAME = 'sql-wasm.wasm'
const SQLITE_INDEXED_DB_NAME = 'dashboard-local-sqlite'
const SQLITE_OBJECT_STORE_NAME = 'files'
const SQLITE_DATABASE_KEY = 'dashboard.sqlite'
const LOCAL_STORAGE_USER_ID = 'local-user'

const schemaSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS dashboard_projects (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dashboard_schedules (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    priority TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('major', 'general')),
    repeat_type TEXT NOT NULL DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily', 'weekday', 'weekly', 'monthly', 'yearly', 'custom')),
    repeat_custom TEXT NOT NULL DEFAULT '',
    repeat_custom_label TEXT NOT NULL DEFAULT '',
    memo TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES dashboard_projects(id) ON DELETE CASCADE
  );
`

type LocalProjectRow = {
  id: string
  name: string
  owner: string
  priority: DashboardProject['priority']
  progress: number
  start_date: string
  end_date: string
}

type LocalScheduleRow = {
  id: string
  project_id: string
  title: string
  date: string
  time: string
  priority: DashboardSchedule['priority']
  kind: DashboardSchedule['kind']
  repeat_type: DashboardSchedule['repeatType']
  repeat_custom: string
  repeat_custom_label: string
  memo: string
}

let sqlJsPromise: Promise<SqlJsStatic> | null = null
let databasePromise: Promise<SqlDatabase> | null = null
let writeQueue = Promise.resolve()

function getSqliteWasmPath() {
  if (typeof window === 'undefined') {
    return `/${SQLITE_WASM_FILENAME}`
  }

  const assetScript = Array.from(document.scripts)
    .map((script) => script.src)
    .find((src) => src.includes('/_next/'))

  if (assetScript) {
    const assetPath = new URL(assetScript, window.location.origin).pathname
    const basePath = assetPath.split('/_next/')[0] ?? ''
    return `${basePath}/${SQLITE_WASM_FILENAME}`.replace(/\/{2,}/g, '/')
  }

  return `${window.location.pathname.replace(/\/$/, '')}/${SQLITE_WASM_FILENAME}`.replace(/\/{2,}/g, '/')
}

function openIndexedDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('INDEXED_DB_UNAVAILABLE'))
      return
    }

    const request = window.indexedDB.open(SQLITE_INDEXED_DB_NAME, 1)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(SQLITE_OBJECT_STORE_NAME)) {
        database.createObjectStore(SQLITE_OBJECT_STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_OPEN_FAILED'))
  })
}

async function readPersistedDatabase() {
  const indexedDb = await openIndexedDb()

  try {
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const transaction = indexedDb.transaction(SQLITE_OBJECT_STORE_NAME, 'readonly')
      const store = transaction.objectStore(SQLITE_OBJECT_STORE_NAME)
      const request = store.get(SQLITE_DATABASE_KEY)

      request.onsuccess = () => {
        const value = request.result

        if (!value) {
          resolve(null)
          return
        }

        if (value instanceof Uint8Array) {
          resolve(value)
          return
        }

        if (value instanceof ArrayBuffer) {
          resolve(new Uint8Array(value))
          return
        }

        resolve(new Uint8Array(value as ArrayLike<number>))
      }

      request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_READ_FAILED'))
    })
  } finally {
    indexedDb.close()
  }
}

async function persistDatabase(database: SqlDatabase) {
  await persistDatabaseBytes(database.export())
}

async function persistDatabaseBytes(payload: Uint8Array) {
  const indexedDb = await openIndexedDb()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = indexedDb.transaction(SQLITE_OBJECT_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SQLITE_OBJECT_STORE_NAME)
      const request = store.put(payload, SQLITE_DATABASE_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('INDEXED_DB_WRITE_FAILED'))
    })
  } finally {
    indexedDb.close()
  }
}

async function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => getSqliteWasmPath(),
    })
  }

  return sqlJsPromise
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const SQL = await getSqlJs()
      const persisted = await readPersistedDatabase()
      const database = new SQL.Database(persisted ?? undefined)

      database.exec(schemaSql)
      return database
    })()
  }

  return databasePromise
}

function mapProjectRow(row: LocalProjectRow): DashboardProject {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    priority: row.priority,
    progress: Number(row.progress),
    startDate: row.start_date,
    endDate: row.end_date,
  }
}

function mapScheduleRow(row: LocalScheduleRow): DashboardSchedule {
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

function selectRows<T extends Record<string, SqlValue>>(database: SqlDatabase, sql: string, params?: BindParams) {
  const statement = database.prepare(sql, params)
  const rows: T[] = []

  try {
    while (statement.step()) {
      rows.push(statement.getAsObject() as T)
    }
  } finally {
    statement.free()
  }

  return rows
}

async function runWrite<T>(callback: (database: SqlDatabase) => T | Promise<T>) {
  const task = writeQueue.then(async () => {
    const database = await getDatabase()
    const result = await callback(database)
    await persistDatabase(database)
    return result
  })

  writeQueue = task.then(
    () => undefined,
    () => undefined,
  )

  return task
}

export async function loadLocalDashboardData() {
  const database = await getDatabase()
  const projects = selectRows<LocalProjectRow>(
    database,
    `
      SELECT id, name, owner, priority, progress, start_date, end_date
      FROM dashboard_projects
      ORDER BY start_date ASC, name ASC
    `,
  ).map(mapProjectRow)

  const schedules = selectRows<LocalScheduleRow>(
    database,
    `
      SELECT id, project_id, title, date, time, priority, kind, repeat_type, repeat_custom, repeat_custom_label, memo
      FROM dashboard_schedules
      ORDER BY date ASC, time ASC, title ASC
    `,
  ).map(mapScheduleRow)

  return { projects, schedules }
}

export async function seedLocalDashboardData(projects: DashboardProject[], schedules: DashboardSchedule[]) {
  await runWrite((database) => {
    projects.forEach((project) => {
      database.run(
        `
          INSERT INTO dashboard_projects (id, user_id, name, owner, priority, progress, start_date, end_date, updated_at)
          VALUES (:id, :user_id, :name, :owner, :priority, :progress, :start_date, :end_date, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            owner = excluded.owner,
            priority = excluded.priority,
            progress = excluded.progress,
            start_date = excluded.start_date,
            end_date = excluded.end_date,
            updated_at = CURRENT_TIMESTAMP
        `,
        {
          ':id': project.id,
          ':user_id': LOCAL_STORAGE_USER_ID,
          ':name': project.name,
          ':owner': project.owner,
          ':priority': project.priority,
          ':progress': project.progress,
          ':start_date': project.startDate,
          ':end_date': project.endDate,
        },
      )
    })

    schedules.forEach((schedule) => {
      database.run(
        `
          INSERT INTO dashboard_schedules (
            id, user_id, project_id, title, date, time, priority, kind, repeat_type, repeat_custom, repeat_custom_label, memo, updated_at
          )
          VALUES (
            :id, :user_id, :project_id, :title, :date, :time, :priority, :kind, :repeat_type, :repeat_custom, :repeat_custom_label, :memo, CURRENT_TIMESTAMP
          )
          ON CONFLICT(id) DO UPDATE SET
            project_id = excluded.project_id,
            title = excluded.title,
            date = excluded.date,
            time = excluded.time,
            priority = excluded.priority,
            kind = excluded.kind,
            repeat_type = excluded.repeat_type,
            repeat_custom = excluded.repeat_custom,
            repeat_custom_label = excluded.repeat_custom_label,
            memo = excluded.memo,
            updated_at = CURRENT_TIMESTAMP
        `,
        {
          ':id': schedule.id,
          ':user_id': LOCAL_STORAGE_USER_ID,
          ':project_id': schedule.projectId,
          ':title': schedule.title,
          ':date': schedule.date,
          ':time': schedule.time,
          ':priority': schedule.priority,
          ':kind': schedule.kind,
          ':repeat_type': schedule.repeatType,
          ':repeat_custom': schedule.repeatCustom,
          ':repeat_custom_label': schedule.repeatCustomLabel,
          ':memo': schedule.memo,
        },
      )
    })
  })

  return loadLocalDashboardData()
}

export async function saveLocalDashboardProject(project: DashboardProject) {
  await runWrite((database) => {
    database.run(
      `
        INSERT INTO dashboard_projects (id, user_id, name, owner, priority, progress, start_date, end_date, updated_at)
        VALUES (:id, :user_id, :name, :owner, :priority, :progress, :start_date, :end_date, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          owner = excluded.owner,
          priority = excluded.priority,
          progress = excluded.progress,
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          updated_at = CURRENT_TIMESTAMP
      `,
      {
        ':id': project.id,
        ':user_id': LOCAL_STORAGE_USER_ID,
        ':name': project.name,
        ':owner': project.owner,
        ':priority': project.priority,
        ':progress': project.progress,
        ':start_date': project.startDate,
        ':end_date': project.endDate,
      },
    )
  })

  return project
}

export async function saveLocalDashboardSchedule(schedule: DashboardSchedule) {
  await runWrite((database) => {
    database.run(
      `
        INSERT INTO dashboard_schedules (
          id, user_id, project_id, title, date, time, priority, kind, repeat_type, repeat_custom, repeat_custom_label, memo, updated_at
        )
        VALUES (
          :id, :user_id, :project_id, :title, :date, :time, :priority, :kind, :repeat_type, :repeat_custom, :repeat_custom_label, :memo, CURRENT_TIMESTAMP
        )
        ON CONFLICT(id) DO UPDATE SET
          project_id = excluded.project_id,
          title = excluded.title,
          date = excluded.date,
          time = excluded.time,
          priority = excluded.priority,
          kind = excluded.kind,
          repeat_type = excluded.repeat_type,
          repeat_custom = excluded.repeat_custom,
          repeat_custom_label = excluded.repeat_custom_label,
          memo = excluded.memo,
          updated_at = CURRENT_TIMESTAMP
      `,
      {
        ':id': schedule.id,
        ':user_id': LOCAL_STORAGE_USER_ID,
        ':project_id': schedule.projectId,
        ':title': schedule.title,
        ':date': schedule.date,
        ':time': schedule.time,
        ':priority': schedule.priority,
        ':kind': schedule.kind,
        ':repeat_type': schedule.repeatType,
        ':repeat_custom': schedule.repeatCustom,
        ':repeat_custom_label': schedule.repeatCustomLabel,
        ':memo': schedule.memo,
      },
    )
  })

  return schedule
}

export async function deleteLocalDashboardProject(projectId: string) {
  await runWrite((database) => {
    database.run('DELETE FROM dashboard_projects WHERE id = :id', { ':id': projectId })
  })
}

export async function deleteLocalDashboardSchedule(scheduleId: string) {
  await runWrite((database) => {
    database.run('DELETE FROM dashboard_schedules WHERE id = :id', { ':id': scheduleId })
  })
}

export async function exportLocalDashboardDatabase() {
  const database = await getDatabase()
  return database.export()
}

export async function importLocalDashboardDatabase(bytes: Uint8Array) {
  const SQL = await getSqlJs()
  const importedDatabase = new SQL.Database(bytes)

  importedDatabase.exec(schemaSql)
  await persistDatabaseBytes(importedDatabase.export())

  databasePromise = Promise.resolve(importedDatabase)
}
