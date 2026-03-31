import type { StaffMember, ViewStaffSessionBracket } from '../types/database'
import type { CoachSessionCount, SessionWithCoaches } from '../types/schedule'
import { ROLE_SENIORITY_ORDER } from './constants'

export function sortCoachesBySeniority(coaches: StaffMember[]): StaffMember[] {
  return [...coaches].sort((a, b) => {
    const aIdx = ROLE_SENIORITY_ORDER.indexOf(a.role)
    const bIdx = ROLE_SENIORITY_ORDER.indexOf(b.role)
    const aOrder = aIdx === -1 ? 999 : aIdx
    const bOrder = bIdx === -1 ? 999 : bIdx
    if (aOrder !== bOrder) return aOrder - bOrder
    return (a.coach_name ?? '').localeCompare(b.coach_name ?? '')
  })
}

export function parseBracket(bracketName: string | null): { min: number; max: number } | null {
  if (!bracketName) return null
  const match = bracketName.match(/(\d+)[_\-](\d+)/)
  if (!match) return null
  return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) }
}

export function buildCoachSessionCounts(
  staff: StaffMember[],
  brackets: ViewStaffSessionBracket[],
  sessionCoaches: { coach_id: string }[]
): CoachSessionCount[] {
  const countMap: Record<string, number> = {}
  for (const sc of sessionCoaches) {
    countMap[sc.coach_id] = (countMap[sc.coach_id] ?? 0) + 1
  }

  const bracketMap: Record<string, ViewStaffSessionBracket> = {}
  for (const b of brackets) {
    bracketMap[b.staff_id] = b
  }

  return staff.map((coach) => {
    const count = countMap[coach.id] ?? 0
    const bracketInfo = bracketMap[coach.id]
    const parsed = parseBracket(bracketInfo?.session_bracket_name ?? null)
    
    // Target is now the average of the session bracket (e.g. 30_35 -> 32.5)
    const target = parsed ? (parsed.min + parsed.max) / 2 : null
    const delta = target !== null ? count - target : null

    let hasWarning = false
    if (parsed) {
      hasWarning = count < parsed.min || count > parsed.max
    }

    return {
      coachId: coach.id,
      coachName: coach.coach_name,
      count,
      target,
      delta,
      bracketMin: parsed?.min ?? null,
      bracketMax: parsed?.max ?? null,
      hasWarning,
      rgbColour: coach.rgb_colour,
      role: coach.role,
    }
  })
}

export function computeTotalSpots(session: SessionWithCoaches): number {
  const coachCount = session.coaches.length
  const clientsPerCoach = session.session_type?.clients_per_coach ?? 1
  return coachCount * clientsPerCoach
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(99,102,241,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

export function getSessionCardStyle(label: string | undefined, defaultColor: string): { bg: string, text: string } {
  if (!label) return { bg: hexToRgba(defaultColor, 0.15), text: defaultColor }
  const l = label.toLowerCase()
  if (l.includes('perform')) return { bg: '#dbeafe', text: '#1d4ed8' } // blue-100 bg, blue-700 text
  if (l.includes('vo2')) return { bg: '#e5e7eb', text: '#374151' } // gray-200 bg, gray-700 text
  if (l.includes('box')) return { bg: '#ffedd5', text: '#c2410c' } // orange-100 bg, orange-700 text
  if (l.includes('squad')) return { bg: '#d1fae5', text: '#047857' } // emerald-100 bg, emerald-700 text
  return { bg: hexToRgba(defaultColor, 0.15), text: defaultColor }
}

/**
 * Returns all sessions (from allSessions) where the given coach is already
 * assigned to a session on the same day that has a DIFFERENT flow_label than
 * the target session. This flags cross-flow scheduling (e.g. assigning an
 * A-flow coach into a B-flow session).
 */
export function findCoachTimeConflicts(
  coachId: string,
  targetSession: SessionWithCoaches,
  allSessions: SessionWithCoaches[],
): SessionWithCoaches[] {
  return allSessions.filter((s) => {
    if (s.id === targetSession.id) return false
    if (s.day_name !== targetSession.day_name) return false
    if (!s.coaches.some((c) => c.coach_id === coachId)) return false

    // Conflict only when flows differ — same flow = no conflict
    return (s.flow_label ?? 'A') !== (targetSession.flow_label ?? 'A')
  })
}
