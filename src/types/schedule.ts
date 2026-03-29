import type { ScheduleSession, ScheduleSessionCoach, StaffMember, SystemSessionType, StaffLeave } from './database'

export interface SessionWithCoaches extends ScheduleSession {
  coaches: (ScheduleSessionCoach & { coach: StaffMember })[]
  session_type: SystemSessionType
  total_spots: number
}

export interface DaySchedule {
  dayName: string
  date: string
  sessions: SessionWithCoaches[]
  leaveCoaches: StaffLeave[]
}

export interface WeekSchedule {
  weekStart: string
  days: DaySchedule[]
}

export interface CoachSessionCount {
  coachId: string
  coachName: string | null
  count: number
  target: number | null
  delta: number | null
  bracketMin: number | null
  bracketMax: number | null
  hasWarning: boolean
  rgbColour: string | null
  role: string
}

export type PeriodPhase = 'build' | 'booking' | 'manage' | 'locked'

export interface FilterState {
  gyms: string[]
  sessionTypes: string[]
  states: string[]
  activeOnly: boolean
}
