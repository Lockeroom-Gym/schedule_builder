import { useMemo, useState } from 'react'
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
  selectedCoachId: string | null
  onCoachSelect: (coachId: string | null) => void
}

export function StaffSummaryStrip({
  staff,
  brackets,
  sessionCoaches,
  leaveData,
  isLoading,
  selectedCoachId,
  onCoachSelect,
}: StaffSummaryStripProps) {
  const [showCasuals, setShowCasuals] = useState(false)

  const counts = useMemo(
    () => buildCoachSessionCounts(staff, brackets, sessionCoaches),
    [staff, brackets, sessionCoaches]
  )

  const coachesOnLeave = useMemo(() => {
    const ids = new Set(leaveData.map((l) => l.staff_id))
    return ids
  }, [leaveData])

  const { fullTimers, casuals } = useMemo(() => {
    const fullTimers: typeof counts = []
    const casuals: typeof counts = []
    
    for (const c of counts) {
      if (c.role === 'Casual Coach') {
        casuals.push(c)
      } else {
        fullTimers.push(c)
      }
    }
    
    return { fullTimers, casuals }
  }, [counts])

  const totalSessions = useMemo(
    () => counts.reduce((sum, c) => sum + c.count, 0),
    [counts]
  )

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3 flex flex-col gap-3">
      {/* Full-timers row */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff</span>
          <span className="text-xs text-gray-400">{totalSessions} sessions assigned</span>
          {isLoading && <LoadingSpinner size="sm" />}
          {casuals.length > 0 && (
            <button
              onClick={() => setShowCasuals(!showCasuals)}
              className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              {showCasuals ? 'Hide Casuals' : 'Show Casuals'}
            </button>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
          {fullTimers.map((c) => (
            <StaffSummaryCard
              key={c.coachId}
              data={c}
              isOnLeave={coachesOnLeave.has(c.coachId)}
              isSelected={selectedCoachId === c.coachId}
              onSelect={() => onCoachSelect(selectedCoachId === c.coachId ? null : c.coachId)}
            />
          ))}
        </div>
      </div>

      {/* Casuals row */}
      {showCasuals && casuals.length > 0 && (
        <div className="pt-2 border-t border-gray-50">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Casuals</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
            {casuals.map((c) => (
              <StaffSummaryCard
                key={c.coachId}
                data={c}
                isOnLeave={coachesOnLeave.has(c.coachId)}
                isSelected={selectedCoachId === c.coachId}
                onSelect={() => onCoachSelect(selectedCoachId === c.coachId ? null : c.coachId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
