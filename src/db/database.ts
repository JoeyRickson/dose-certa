import * as SQLite from 'expo-sqlite';
import { DoseRecord, DoseStatus, MedicationPlan, PlanInput } from '../types';
import { addDaysISO, diffDays, monthBounds, todayISO } from '../utils/date';

const dbPromise = SQLite.openDatabaseAsync('pilula-em-dia.db');

async function db() {
  return dbPromise;
}

export async function initDatabase() {
  const database = await db();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS medication_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT,
      pill_count INTEGER NOT NULL,
      break_days INTEGER NOT NULL DEFAULT 0,
      medication_time TEXT NOT NULL,
      reminder_minutes INTEGER NOT NULL DEFAULT 30,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dose_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      kind TEXT NOT NULL,
      pill_number INTEGER,
      status TEXT NOT NULL,
      taken_at TEXT,
      notes TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(plan_id) REFERENCES medication_plan(id) ON DELETE CASCADE,
      UNIQUE(plan_id, scheduled_date)
    );

    CREATE INDEX IF NOT EXISTS idx_dose_records_date
      ON dose_records(plan_id, scheduled_date);

    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL
    );
  `);
}

export async function getActivePlan() {
  const database = await db();
  return database.getFirstAsync<MedicationPlan>(
    'SELECT * FROM medication_plan WHERE active = 1 ORDER BY id DESC LIMIT 1'
  );
}

export async function savePlan(input: PlanInput, existingId?: number) {
  const database = await db();
  const now = new Date().toISOString();

  if (existingId) {
    await database.runAsync(
      `UPDATE medication_plan
       SET name = ?, start_date = ?, end_date = ?, pill_count = ?, break_days = ?,
           medication_time = ?, reminder_minutes = ?, notifications_enabled = ?, updated_at = ?
       WHERE id = ?`,
      input.name.trim(),
      input.startDate,
      input.endDate,
      input.pillCount,
      input.breakDays,
      input.medicationTime,
      input.reminderMinutes,
      input.notificationsEnabled ? 1 : 0,
      now,
      existingId
    );
    return existingId;
  }

  const result = await database.runAsync(
    `INSERT INTO medication_plan
      (name, start_date, end_date, pill_count, break_days, medication_time,
       reminder_minutes, notifications_enabled, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    input.name.trim(),
    input.startDate,
    input.endDate,
    input.pillCount,
    input.breakDays,
    input.medicationTime,
    input.reminderMinutes,
    input.notificationsEnabled ? 1 : 0,
    now,
    now
  );
  return Number(result.lastInsertRowId);
}

export async function rebuildFutureRecords(plan: MedicationPlan, fromDate: string) {
  const database = await db();
  await database.runAsync(
    'DELETE FROM dose_records WHERE plan_id = ? AND scheduled_date >= ?',
    plan.id,
    fromDate
  );
  await ensureDoseRecords(plan, fromDate, 400);
}

export async function ensureDoseRecords(plan: MedicationPlan, fromDate = todayISO(), horizonDays = 400) {
  const database = await db();
  const start = fromDate < plan.start_date ? plan.start_date : fromDate;
  let end = addDaysISO(start, horizonDays);
  if (plan.end_date && plan.end_date < end) end = plan.end_date;
  if (end < start) return;

  const existing = await database.getAllAsync<{ scheduled_date: string }>(
    `SELECT scheduled_date FROM dose_records
     WHERE plan_id = ? AND scheduled_date BETWEEN ? AND ?`,
    plan.id,
    start,
    end
  );
  const existingDates = new Set(existing.map((row) => row.scheduled_date));
  const cycleLength = Math.max(1, plan.pill_count + plan.break_days);
  const now = new Date().toISOString();

  for (let date = start; date <= end; date = addDaysISO(date, 1)) {
    if (existingDates.has(date)) continue;
    const offset = diffDays(plan.start_date, date);
    if (offset < 0) continue;
    const cycleDay = offset % cycleLength;
    const isPill = cycleDay < plan.pill_count;
    const kind = isPill ? 'pill' : 'break';
    const status = isPill ? 'pending' : 'break';
    const pillNumber = isPill ? cycleDay + 1 : null;

    await database.runAsync(
      `INSERT OR IGNORE INTO dose_records
       (plan_id, scheduled_date, scheduled_time, kind, pill_number, status,
        taken_at, notes, deleted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
      plan.id,
      date,
      plan.medication_time,
      kind,
      pillNumber,
      status,
      now,
      now
    );
  }
}

export async function getDoseByDate(planId: number, date: string) {
  const database = await db();
  return database.getFirstAsync<DoseRecord>(
    `SELECT * FROM dose_records
     WHERE plan_id = ? AND scheduled_date = ? AND deleted_at IS NULL`,
    planId,
    date
  );
}

export async function getDoseById(id: number) {
  const database = await db();
  return database.getFirstAsync<DoseRecord>(
    'SELECT * FROM dose_records WHERE id = ? AND deleted_at IS NULL',
    id
  );
}

export async function getMonthDoses(planId: number, year: number, monthZeroBased: number) {
  const database = await db();
  const { first, last } = monthBounds(year, monthZeroBased);
  return database.getAllAsync<DoseRecord>(
    `SELECT * FROM dose_records
     WHERE plan_id = ? AND scheduled_date BETWEEN ? AND ? AND deleted_at IS NULL
     ORDER BY scheduled_date`,
    planId,
    first,
    last
  );
}

export async function updateDose(
  id: number,
  status: DoseStatus,
  takenAt: string | null,
  notes: string | null
) {
  const database = await db();
  const now = new Date().toISOString();
  await database.runAsync(
    `UPDATE dose_records
     SET status = ?, taken_at = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    status,
    status === 'taken' ? takenAt : null,
    notes?.trim() || null,
    now,
    id
  );
}

export async function markDoseByDate(planId: number, date: string, status: DoseStatus) {
  const dose = await getDoseByDate(planId, date);
  if (!dose) return;
  await updateDose(
    dose.id,
    status,
    status === 'taken' ? new Date().toISOString() : null,
    dose.notes
  );
}

export async function softDeleteDose(id: number) {
  const database = await db();
  const now = new Date().toISOString();
  await database.runAsync(
    'UPDATE dose_records SET deleted_at = ?, updated_at = ? WHERE id = ?',
    now,
    now,
    id
  );
}

export async function countDeletedDoses(planId: number) {
  const database = await db();
  const row = await database.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM dose_records WHERE plan_id = ? AND deleted_at IS NOT NULL',
    planId
  );
  return row?.total ?? 0;
}

export async function restoreDeletedDoses(planId: number) {
  const database = await db();
  const now = new Date().toISOString();
  await database.runAsync(
    'UPDATE dose_records SET deleted_at = NULL, updated_at = ? WHERE plan_id = ? AND deleted_at IS NOT NULL',
    now,
    planId
  );
}

export async function deleteAllData() {
  const database = await db();
  await database.execAsync(`
    DELETE FROM dose_records;
    DELETE FROM medication_plan;
    DELETE FROM app_settings;
    DELETE FROM sqlite_sequence WHERE name IN ('dose_records', 'medication_plan');
  `);
}

export async function getRecentDoses(planId: number, limit = 60) {
  const database = await db();
  const safeLimit = Math.max(1, Math.min(365, Math.trunc(limit)));
  return database.getAllAsync<DoseRecord>(
    `SELECT * FROM dose_records
     WHERE plan_id = ? AND scheduled_date <= ? AND deleted_at IS NULL
     ORDER BY scheduled_date DESC
     LIMIT ${safeLimit}`,
    planId,
    todayISO()
  );
}


export async function getAppSetting(key: string) {
  const database = await db();
  const row = await database.getFirstAsync<{ setting_value: string }>(
    'SELECT setting_value FROM app_settings WHERE setting_key = ?',
    key
  );
  return row?.setting_value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  const database = await db();
  await database.runAsync(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
    key,
    value
  );
}
