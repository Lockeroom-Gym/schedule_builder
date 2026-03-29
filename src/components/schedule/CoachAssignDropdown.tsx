import { useState, useRef, useEffect, useMemo } from 'react'
import type { StaffMember, StaffLeave } from '../../types/database'
import { useAssignCoach } from '../../hooks/useMutateCoachAssignment'
import { getInitials } from '../../lib/scheduleUtils'

interface CoachAssignDropdownProps {
  sessionId: string
  weekStart: string
  sessionDate: string
  alreadyAssignedIds: string[]
  slotOrder: number
  staff: StaffMember[]
  leaveData: StaffLeave[]
  onClose: () => void
}

export function CoachAssignDropdown({
  sessionId,
  weekStart,
  sessionDate,
  alreadyAssignedIds,
  slotOrder,
  staff,
  leaveData,
  onClose,
}: CoachAssignDropdownProps) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const assignCoach = useAssignCoach()

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const leaveOnDate = useMemo(() => {
    const ids = new Set(leaveData.filter((l) => l.leave_date === sessionDate).map((l) => l.staff_id))
    return ids
  }, [leaveData, sessionDate])

  const available = useMemo(() => {
    return staff
      .filter((s) => s.staff_status === 'active')
      .filter((s) => !alreadyAssignedIds.includes(s.id))
      .filter((s) =>
        search.trim() === '' ||
        (s.coach_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
  }, [staff, alreadyAssignedIds, search])

  const handleAssign = async (coach: StaffMember) => {
    await assignCoach.mutateAsync({
      sessionId,
      coachId: coach.id,
      slotOrder,
      weekStart,
    })
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coach..."
          className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="max-h-52 overflow-y-auto">
        {available.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No coaches available</p>
        )}
        {available.map((coach) => {
          const onLeave = leaveOnDate.has(coach.id)
          const colour = coach.rgb_colour ?? '#6366f1'
          return (
            <button
              key={coach.id}
              onClick={() => !onLeave && handleAssign(coach)}
              disabled={onLeave || assignCoach.isPending}
              className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colour }}
              >
                <span className="text-[9px] text-white font-bold">{getInitials(coach.coach_name)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800 truncate">{coach.coach_name}</p>
                <p className="text-[10px] text-gray-400 truncate">{coach.role}</p>
              </div>
              {onLeave && (
                <span className="text-[10px] text-red-400 font-medium flex-shrink-0">Leave</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
