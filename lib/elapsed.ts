import { differenceInCalendarDays, differenceInMonths } from 'date-fns';
import { ElapsedTime } from '../types';
import { t } from './i18n';

export function getElapsed(dateStr: string): ElapsedTime {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const totalDays = differenceInCalendarDays(now, date);
  const months = differenceInMonths(now, date);
  const days = Math.max(0, totalDays - months * 30);
  return { months, days, totalDays };
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekdayKeys = ['weekdays.sun', 'weekdays.mon', 'weekdays.tue', 'weekdays.wed', 'weekdays.thu', 'weekdays.fri', 'weekdays.sat'];
  const w = t(weekdayKeys[date.getDay()]);
  return t('date_format', { y, m, d, w });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatElapsed(e: ElapsedTime): string {
  if (e.totalDays === 0) return t('elapsed.today');
  if (e.months === 0) return `${e.totalDays}${t('elapsed.days_unit')}`;
  return `${e.months}${t('elapsed.months_unit')}${e.days}${t('elapsed.days_unit')}`;
}

export function daysAfterTreatment(treatmentDate: string, photoDate: string): number {
  const tr = new Date(treatmentDate + 'T00:00:00');
  const p = new Date(photoDate + 'T00:00:00');
  return differenceInCalendarDays(p, tr);
}

export function photoLabelFromDays(days: number): string {
  if (days < 0) return t('elapsed.before', { n: Math.abs(days) });
  if (days === 0) return t('elapsed.today');
  if (days === 1) return t('elapsed.next_day');
  if (days === 7) return t('elapsed.one_week');
  if (days === 14) return t('elapsed.two_weeks');
  if (days === 30) return t('elapsed.one_month');
  if (days === 60) return t('elapsed.two_months');
  if (days === 90) return t('elapsed.three_months');
  if (days === 180) return t('elapsed.half_year');
  if (days >= 365) return t('elapsed.one_year');
  return t('elapsed.days_after', { n: days });
}
