export function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1, 12, 0, 0, 0);
}

export function addDaysISO(value: string, days: number) {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function diffDays(startISO: string, endISO: string) {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDateBR(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateLong(value: string) {
  return parseISODate(value).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function brToISO(value: string): string | null {
  const clean = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(clean);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return toISODate(date);
}

export function isoToBR(value: string | null | undefined) {
  return value ? formatDateBR(value) : '';
}

export function isValidTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function nowTime() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function dateAtTime(dateISO: string, time: string, plusMinutes = 0) {
  const date = parseISODate(dateISO);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  if (plusMinutes) date.setMinutes(date.getMinutes() + plusMinutes);
  return date;
}

export function monthBounds(year: number, monthZeroBased: number) {
  const first = new Date(year, monthZeroBased, 1, 12);
  const last = new Date(year, monthZeroBased + 1, 0, 12);
  return { first: toISODate(first), last: toISODate(last) };
}
