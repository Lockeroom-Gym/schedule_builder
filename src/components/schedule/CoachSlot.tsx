import { useState } from 'react'
import type { ScheduleSessionCoach, StaffMember } from '../../types/database'
import { getInitials, hexToRgba } from '../../lib/scheduleUtils'
import { LEAVE_TYPE_LABELS } from '../../lib/constants'
import { useRemoveCoach } from '../../hooks/useMutateCoachAssignment'

interface CoachSlotFilledProps {
  assignment: ScheduleSessionCoach & { coach: StaffMember }
  isOnLeave: boolean
  leaveType?: string
  weekStart: string
  isLocked: boolean
}

export function CoachSlotFilled({
  assignment,
  isOnLeave,
  leaveType,
  weekStart,
  isLocked,
}: CoachSlotFilledProps) {
  const [hovered, setHovered] = useState(false)
  const removeCoach = useRemoveCoach()
  const colour = assignment.coach.rgb_colour ?? '#6366f1'

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLocked) return
    if (!confirm(`Remove ${assignment.coach.coach_name ?? 'this coach'} from this session?`)) return
    removeCoach.mutate({ assignmentId: assignment.id, weekStart })
  }

  if (isOnLeave) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
        <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] text-red-600 font-bold">{getInitials(assignment.coach.coach_name)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-red-500 truncate leading-none">
            {(assignment.coach.coach_name ?? '').split(' ')[0] || '?'}
          </p>
          <p className="text-[9px] text-red-400 italic leading-none mt-0.5">
            {leaveType ? LEAVE_TYPE_LABELS[leaveType] ?? 'Leave' : 'Leave'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-default relative group"
      style={{
        backgroundColor: hexToRgba(colour, 0.12),
        borderWidth: 1,
        borderColor: hexToRgba(colour, 0.3),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: colour }}
      >
        <span className="text-[9px] text-white font-bold">{getInitials(assignment.coach.coach_name)}</span>
      </div>
      <p
        className="text-[11px] font-medium truncate leading-none"
        style={{ color: colour }}
      >
        {(assignment.coach.coach_name ?? '').split(' ')[0] || '?'}
      </p>
      {!isLocked && hovered && (
        <button
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-500 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface CoachSlotEmptyProps {
  onClick: () => void
  isLocked: boolean
}

export function CoachSlotEmpty({ onClick, isLocked }: CoachSlotEmptyProps) {
  if (isLocked) {
    return (
      <div className="w-16 h-7 border border-dashed border-gray-200 rounded-md flex items-center justify-center">
        <span className="text-[10px] text-gray-300">—</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-16 h-7 border border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
    >
      <svg
        className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
