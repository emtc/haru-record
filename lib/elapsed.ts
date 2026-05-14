import { differenceInCalendarDays, differenceInMonths } from 'date-fns';
import { ElapsedTime } from '../types';

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
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays[date.getDay()];
  return `${y}.${m}.${d}（${w}）`;
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
  if (e.totalDays === 0) return '当日';
  if (e.months === 0) return `${e.totalDays}日`;
  return `${e.months}ヶ月${e.days}日`;
}

export function daysAfterTreatment(treatmentDate: string, photoDate: string): number {
  const t = new Date(treatmentDate + 'T00:00:00');
  const p = new Date(photoDate + 'T00:00:00');
  return differenceInCalendarDays(p, t);
}

export function photoLabelFromDays(days: number): string {
  if (days < 0) return `施術前${Math.abs(days)}日`;
  if (days === 0) return '当日';
  if (days === 1) return '翌日';
  if (days === 7) return '1週間後';
  if (days === 14) return '2週間後';
  if (days === 30) return '1ヶ月後';
  if (days === 60) return '2ヶ月後';
  if (days === 90) return '3ヶ月後';
  if (days === 180) return '半年後';
  if (days >= 365) return '1年後';
  return `${days}日後`;
}
