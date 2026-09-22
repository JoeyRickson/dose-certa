export type DoseStatus = 'pending' | 'taken' | 'missed' | 'break';
export type DoseKind = 'pill' | 'break';
export type ReminderMode = 'notification' | 'alarm';

export interface AlarmPreferences {
  mode: ReminderMode;
  repeatMinutes: number;
  repeatCount: number;
}

export interface MedicationPlan {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  pill_count: number;
  break_days: number;
  medication_time: string;
  reminder_minutes: number;
  notifications_enabled: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface PlanInput {
  name: string;
  startDate: string;
  endDate: string | null;
  pillCount: number;
  breakDays: number;
  medicationTime: string;
  reminderMinutes: number;
  notificationsEnabled: boolean;
}

export interface DoseRecord {
  id: number;
  plan_id: number;
  scheduled_date: string;
  scheduled_time: string;
  kind: DoseKind;
  pill_number: number | null;
  status: DoseStatus;
  taken_at: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
