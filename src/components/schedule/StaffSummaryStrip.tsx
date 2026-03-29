import { useMemo } from 'react'
import { StaffSummaryCard } from './StaffSummaryCard'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { buildCoachSessionCounts } from '../../lib/scheduleUtils'
import type { StaffMember, ViewStaffSessionBracket, ScheduleSessionCoach, StaffLeave } from '../../types/database'

interface StaffSummaryStripProps {
  staff: StaffMember[]
  brackets: ViewStaffSessionBracket[]
  sessionCoaches: ScheduleSessionCoach[]
  leaveData: StaffLeave[]
  isLoading: boolean
}

export function StaffSummaryStrip({
  staff,
  brackets,
  sessionCoaches,
  leaveData,
  isLoading,
}: StaffSummaryStripProps) {
  const counts = useMemo(
    () => buildCoachSessionCounts(staff, brackets, sessionCoaches),
    [staff, brackets, sessionCoaches]
  )

  const coachesOnLeave = useMemo(() => {
    const ids = new Set(leaveData.map((l) => l.staff_id))
    return ids
  }, [leaveData])

  const totalSessions = useMemo(
    () => counts.reduce((sum, c) => sum + c.count, 0),
    [counts]
  )

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff</span>
        <span className="text-xs text-gray-400">{totalSessions} sessions assigned</span>
        {isLoading && <LoadingSpinner size="sm" />}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
        {counts.map((c) => (
          <StaffSummaryCard
            key={c.coachId}
            data={c}
            isOnLeave={coachesOnLeave.has(c.coachId)}
          />
        ))}
      </div>
    </div>
  )
}
