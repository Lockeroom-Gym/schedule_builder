import type { DayName, GymName } from '../types/database'

export const DAYS_OF_WEEK: { key: DayName; label: string; short: string }[] = [
  { key: 'MON', label: 'Monday', short: 'Mon' },
  { key: 'TUE', label: 'Tuesday', short: 'Tue' },
  { key: 'WED', label: 'Wednesday', short: 'Wed' },
  { key: 'THU', label: 'Thursday', short: 'Thu' },
  { key: 'FRI', label: 'Friday', short: 'Fri' },
  { key: 'SAT', label: 'Saturday', short: 'Sat' },
  { key: 'SUN', label: 'Sunday', short: 'Sun' },
]

export const GYMS: { key: GymName; label: string }[] = [
  { key: 'BLIGH', label: 'Bligh St' },
  { key: 'BRIDGE', label: 'Bridge St' },
  { key: 'COLLINS', label: 'Collins St' },
]

export const ROLE_SENIORITY_ORDER: string[] = [
  'Head of Exercise',
  'Gym Manager',
  'Senior Coach',
  'Advanced Coach',
  'Coach',
  'Casual Coach',
]

export const SESSION_TIME_OPTIONS: string[] = [
  '05:00', '05:15', '05:30', '05:45',
  '06:00', '06:15', '06:30', '06:45',
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30',
]

export const PREFERENCE_TYPE_COLORS: Record<string, string> = {
  preferred: 'bg-emerald-100 text-emerald-700',
  soft: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export const GYM_COLORS: Record<string, { border: string; label: string }> = {
  BLIGH:   { border: '#d97706', label: 'Bligh' },
  BRIDGE:  { border: '#7c3aed', label: 'Bridge' },
  COLLINS: { border: '#6b7280', label: 'Collins' },
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  public_holiday: 'Public Holiday',
  birthday: 'Birthday Leave',
}
