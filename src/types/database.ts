export type StaffStatus = 'active' | 'inactive'
export type DayName = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
export type GymName = 'BLIGH' | 'BRIDGE' | 'COLLINS'
export type SessionStatus = 'proposed' | 'final' | 'cancelled'
export type PreferenceType = 'preferred' | 'soft' | 'hard'
export type LeaveType = 'annual' | 'sick' | 'public_holiday' | 'birthday'

export interface StaffMember {
  id: string
  first_name: string | null
  last_name: string | null
  coach_name: string | null
  role: string
  staff_status: StaffStatus
  home_gym: string | null
  state: string | null
  employment_type: string | null
  rm_ceiling: number | null
  session_bracket_fk: string | null
  sb_selector: string | null
  sb_recommended: string | null
  direct_report: string | null
  rgb_colour: string | null
  executive: boolean | null
  supplementary_roles: string[] | null
  lockeroom_email: string | null
  slack_member_id: string | null
  updated_at: string | null
}

export interface SchedulePeriod {
  id: string
  label: string
  week_start: string
  week_end: string
  submission_deadline: string | null
  is_locked: boolean
  created_at: string
}

export interface SchedulePeriodEffective extends SchedulePeriod {
  is_locked_effective: boolean
}

export interface ScheduleBlockConfig {
  block_id: string
  day_name: DayName
  block_label: string
  block_start: string
  block_end: string
  updated_at: string | null
}

export interface SystemSessionType {
  id: string
  name: string
  label: string
  clients_per_coach: number
  color_hex: string
  sort_order: number
  created_at: string
}

export interface SystemSessionGymCapacity {
  id: string
  session_type_id: string
  gym: GymName
  max_coaches: number
}

export interface ScheduleSession {
  id: string
  period_id: string | null
  week_start: string
  day_name: DayName
  session_date: string
  session_time: string
  session_type_id: string
  gym: GymName
  is_peak: boolean
  status: SessionStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  session_type?: SystemSessionType
}

export interface ScheduleSessionCoach {
  id: string
  session_id: string
  coach_id: string
  slot_order: number
  assigned_by: string | null
  created_at: string
  // Joined
  coach?: StaffMember
}

export interface StaffLeave {
  id: string
  staff_id: string
  leave_date: string
  leave_type: LeaveType
  coach_name: string
  date_created: string
  leave_request_id: string | null
}

export interface SchedulePreference {
  id: string
  staff_id: string
  period_id: string
  block: string
  preference_type: PreferenceType
  rank: number | null
  submitted_at: string | null
  status: string | null
  valid: string | null
  coach_name: string
  created_at: string
  updated_at: string
}

export interface ViewStaffSessionBracket {
  staff_id: string
  coach_name: string
  role: string
  staff_status: StaffStatus
  rm_ceiling: number | null
  session_bracket_fk: string | null
  session_bracket_name: string | null
}

export interface ViewPreferencePolicyCheck {
  staff_id: string
  period_id: string
  bracket_enum: string | null
  max_hard_blocks: number | null
  max_soft_blocks: number | null
  hard_count: number
  soft_count: number
  preferred_points: number | null
  points_target: number | null
  hard_ok: boolean | null
  soft_ok: boolean | null
  preferred_ok: boolean | null
  points_shortfall: number | null
  hard_over_by: number
  soft_over_by: number
  is_locked_effective: boolean | null
  can_submit: boolean | null
}

export interface CoachSessionBalance {
  coach_name: string
  staff_id: string
  week_start: string
  session_expectation: number | null
  total_hours: number | null
  expected_hours_adjusted: number | null
  actual_hours: number | null
  hours_balance_adjusted: number | null
  business_days_this_week: number | null
  leave_weekdays: number | null
  holiday_weekdays: number | null
}
