import { useState, useRef, useEffect, useMemo } from 'react'
import type { StaffMember, StaffLeave } from '../../types/database'
import type { SessionWithCoaches } from '../../types/schedule'
import { useAssignCoach } from '../../hooks/useMutateCoachAssignment'
import { getInitials, findCoachTimeConflicts } from '../../lib/scheduleUtils'
import { Modal } from '../ui/Modal'
import { GYM_COLORS } from '../../lib/constants'
import { formatTime } from '../../lib/dateUtils'

interface CoachAssignDropdownProps {
  sessionId: string
  weekStart: string
  sessionDate: string
  alreadyAssignedIds: string[]
  slotOrder: number
  staff: StaffMember[]
  leaveData: StaffLeave[]
  onClose: () => void
  currentSession: SessionWithCoaches
  allSessions: SessionWithCoaches[]
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
  currentSession,
  allSessions,
}: CoachAssignDropdownProps) {
  const [search, setSearch] = useState('')
  const [pendingAssign, setPendingAssign] = useState<{
    coach: StaffMember
    conflicts: SessionWithCoaches[]
  } | null>(null)
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

  const doAssign = async (coach: StaffMember) => {
    await assignCoach.mutateAsync({
      sessionId,
      coachId: coach.id,
      slotOrder,
      weekStart,
    })
    onClose()
  }

  const handleAssign = (coach: StaffMember) => {
    const conflicts = findCoachTimeConflicts(coach.id, currentSession, allSessions)
    if (conflicts.length > 0) {
      setPendingAssign({ coach, conflicts })
    } else {
      void doAssign(coach)
    }
  }

  return (
    <>
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

      {/* Overlap confirmation modal — rendered outside the dropdown so z-index is clean */}
      {pendingAssign && (
        <Modal
          isOpen
          onClose={() => setPendingAssign(null)}
          title="Scheduling conflict"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: pendingAssign.coach.rgb_colour ?? '#6366f1' }}
              >
                <span className="text-xs text-white font-bold">
                  {getInitials(pendingAssign.coach.coach_name)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {pendingAssign.coach.coach_name}
                </p>
                <p className="text-xs text-gray-500">{pendingAssign.coach.role}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              This coach is already on an overlapping session:
            </p>

            <ul className="space-y-1.5">
              {pendingAssign.conflicts.map((s) => {
                const gymConfig = GYM_COLORS[s.gym] ?? { border: '#9ca3af', label: s.gym }
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: gymConfig.border }}
                    />
                    <span className="font-semibold text-gray-800">
                      {formatTime(s.session_time)}
                    </span>
                    <span className="text-gray-500">{s.session_type?.label ?? '?'}</span>
                    <span style={{ color: gymConfig.border }} className="font-medium">
                      {gymConfig.label}
                    </span>
                  </li>
                )
              })}
            </ul>

            <p className="text-xs text-gray-500">
              Scheduling this coach into both sessions will create an overlap. Only proceed if
              you intend this as a cross-session assignment.
            </p>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setPendingAssign(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const coach = pendingAssign.coach
                  setPendingAssign(null)
                  void doAssign(coach)
                }}
                disabled={assignCoach.isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Assign anyway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
