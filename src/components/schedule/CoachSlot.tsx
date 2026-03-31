import { useState } from 'react'
import type { ScheduleSessionCoach, StaffMember, StaffLeave } from '../../types/database'
import type { SessionWithCoaches } from '../../types/schedule'
import { getInitials, hexToRgba } from '../../lib/scheduleUtils'
import { useRemoveCoach } from '../../hooks/useMutateCoachAssignment'
import { SwapCoachDropdown } from './SwapCoachDropdown'

interface CoachSlotFilledProps {
  assignment: ScheduleSessionCoach & { coach: StaffMember }
  isOnLeave: boolean
  leaveType?: string
  weekStart: string
  isLocked: boolean
  session?: SessionWithCoaches
  allSessions?: SessionWithCoaches[]
  staff?: StaffMember[]
  leaveData?: StaffLeave[]
  onMenuOpenChange?: (isOpen: boolean) => void
}

export function CoachSlotFilled({
  assignment,
  isOnLeave,
  weekStart,
  isLocked,
  session,
  allSessions,
  staff,
  leaveData,
  onMenuOpenChange,
}: CoachSlotFilledProps) {
  const [hovered, setHovered] = useState(false)
  const [swapMenuOpen, setSwapMenuOpen] = useState(false)
  const removeCoach = useRemoveCoach()
  const colour = assignment.coach.rgb_colour ?? '#6366f1'

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLocked) return
    if (!confirm(`Remove ${assignment.coach.coach_name ?? 'this coach'} from this session?`)) return
    removeCoach.mutate({ assignmentId: assignment.id, weekStart })
  }

  const toggleSwapMenu = (open: boolean) => {
    setSwapMenuOpen(open)
    onMenuOpenChange?.(open)
  }

  if (isOnLeave) {
    return (
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); if (!isLocked) toggleSwapMenu(!swapMenuOpen) }}
          className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border-2 border-red-500 rounded-md hover:bg-red-100 transition-colors shadow-sm relative group"
        >
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 animate-pulse">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold text-red-700 truncate leading-none">
              {(assignment.coach.coach_name ?? '').split(' ')[0] || '?'}
            </p>
            <p className="text-[9px] font-bold text-red-600 uppercase tracking-wide leading-none mt-0.5">
              Swap Req.
            </p>
          </div>
        </button>
        {swapMenuOpen && !isLocked && session && allSessions && staff && leaveData && (
           <SwapCoachDropdown
              assignment={assignment}
              session={session}
              allSessions={allSessions}
              staff={staff}
              leaveData={leaveData}
              weekStart={weekStart}
              onClose={() => toggleSwapMenu(false)}
           />
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-default relative group shadow-sm"
      style={{
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: hexToRgba(colour, 0.4),
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
      <div className="w-16 h-7 bg-white/50 border border-dashed border-gray-200 rounded-md flex items-center justify-center">
        <span className="text-[10px] text-gray-300">—</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-16 h-7 bg-white shadow-sm border border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
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
