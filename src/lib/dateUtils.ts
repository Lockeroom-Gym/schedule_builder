import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
  differenceInWeeks,
  isValid,
  eachDayOfInterval,
  getDay,
} from 'date-fns'
import type { DayName } from '../types/database'
import type { PeriodPhase } from '../types/schedule'

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 })
}

export function formatWeekLabel(weekStart: string | Date): string {
  const start = typeof weekStart === 'string' ? parseISO(weekStart) : weekStart
  const end = endOfWeek(start, { weekStartsOn: 1 })
  return `Week of ${format(start, 'EEE d MMM')} – ${format(end, 'EEE d MMM yyyy')}`
}

export function formatWeekStartKey(date: Date): string {
  return format(getWeekStart(date), 'yyyy-MM-dd')
}

export function nextWeek(weekStart: string): string {
  return format(addWeeks(parseISO(weekStart), 1), 'yyyy-MM-dd')
}

export function prevWeek(weekStart: string): string {
  return format(subWeeks(parseISO(weekStart), 1), 'yyyy-MM-dd')
}

export function getPeriodPhase(weekStart: string): PeriodPhase {
  const start = parseISO(weekStart)
  const today = new Date()
  const weeksUntil = differenceInWeeks(start, today)
  if (weeksUntil > 6) return 'build'
  if (weeksUntil >= 4) return 'booking'
  return 'manage'
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours, 10)
  const m = minutes || '00'
  const ampm = h >= 12 ? 'pm' : 'am'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${m}${ampm}`
}

export function formatDate(dateStr: string): string {
  if (!dateStr || !isValid(parseISO(dateStr))) return dateStr
  return format(parseISO(dateStr), 'EEE d MMM')
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr || !isValid(parseISO(dateStr))) return dateStr
  return format(parseISO(dateStr), 'd MMM')
}

export function getSessionDateForDay(weekStart: string, dayName: DayName): string {
  const dayIndex: Record<DayName, number> = {
    MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6,
  }
  const start = parseISO(weekStart)
  const days = eachDayOfInterval({
    start,
    end: endOfWeek(start, { weekStartsOn: 1 }),
  })
  const day = days[dayIndex[dayName]]
  return day ? format(day, 'yyyy-MM-dd') : weekStart
}

export function getDayNameFromDate(dateStr: string): DayName {
  const date = parseISO(dateStr)
  const dayOfWeek = getDay(date)
  const map: Record<number, DayName> = {
    1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT', 0: 'SUN',
  }
  return map[dayOfWeek] ?? 'MON'
}

export function isWithinSixWeeks(weekStart: string): boolean {
  const start = parseISO(weekStart)
  const today = new Date()
  return differenceInWeeks(start, today) < 6
}
