import { useState } from 'react'
import type { SessionWithCoaches } from '../../types/schedule'
import type { StaffMember, StaffLeave } from '../../types/database'
import { CoachSlotFilled } from './CoachSlot'
import { CoachAssignDropdown } from './CoachAssignDropdown'
import { useDeleteSession } from '../../hooks/useMutateSession'
import { GYM_COLORS } from '../../lib/constants'

interface SessionCellProps {
  session: SessionWithCoaches
  weekStart: string
  staff: StaffMember[]
  leaveData: StaffLeave[]
  isLocked: boolean
  showCoaches: boolean
  isSelected: boolean
  onToggleSelect: () => void
}

export function SessionCell({
  session,
  weekStart,
  staff,
  leaveData,
  isLocked,
  showCoaches,
  isSelected,
  onToggleSelect,
}: SessionCellProps) {
  const [assigningSlot, setAssigningSlot] = useState<number | null>(null)
  const deleteSession = useDeleteSession()

  const gymConfig = GYM_COLORS[session.gym] ?? { border: '#9ca3af', label: session.gym }
  const sessionTypeColor = session.session_type?.color_hex ?? '#6366f1'
  const isDraft = session.status === 'proposed'

  const assignedIds = session.coaches.map((c) => c.coach_id)
  const leaveOnDate = leaveData.filter((l) => l.leave_date === session.session_date)
  const leaveMap: Record<string, string> = {}
  for (const l of leaveOnDate) leaveMap[l.staff_id] = l.leave_type

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this session and all coach assignments?')) return
    deleteSession.mutate({ sessionId: session.id, weekStart })
  }

  return (
    <div
      className={`rounded border transition-all group relative ${
        isSelected ? 'bg-blue-50' : 'bg-white hover:shadow-sm'
      }`}
      style={{
        borderColor: isSelected ? '#93c5fd' : '#e5e7eb',
        borderLeftWidth: 3,
        borderLeftColor: gymConfig.border,
      }}
    >
      {/* Info line */}
      <div className="flex items-center gap-1 px-1.5 py-1 min-h-[26px]">
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-3 h-3 rounded border-gray-300 cursor-pointer flex-shrink-0 accent-blue-600"
        />

        {/* Session type badge */}
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0 whitespace-nowrap"
          style={{
            backgroundColor: `${sessionTypeColor}22`,
            color: sessionTypeColor,
          }}
        >
          {session.session_type?.label ?? '?'}
        </span>

        {/* Gym badge */}
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0 whitespace-nowrap"
          style={{ color: gymConfig.border, backgroundColor: `${gymConfig.border}18` }}
        >
          {gymConfig.label}
        </span>

        {/* Spots */}
        <span className="text-[9px] text-gray-500 leading-none flex-shrink-0 whitespace-nowrap">
          <span className="font-semibold text-gray-700">{session.total_spots}</span>sp
        </span>

        {/* Peak indicator */}
        {session.is_peak && (
          <span className="text-[8px] text-amber-600 font-bold leading-none flex-shrink-0">PK</span>
        )}

        {/* Draft indicator */}
        {isDraft && (
          <span className="text-[8px] text-gray-400 italic leading-none flex-shrink-0">draft</span>
        )}

        {/* Delete button (hover-reveal) */}
        {!isLocked && (
          <button
            onClick={handleDelete}
            disabled={deleteSession.isPending}
            className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
            title="Delete session"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Coaches line */}
      {showCoaches && (
        <div className="flex items-center gap-1 px-1.5 pb-1.5 flex-wrap relative">
          {session.coaches.map((sc) => (
            <CoachSlotFilled
              key={sc.id}
              assignment={sc as any}
              isOnLeave={!!leaveMap[sc.coach_id]}
              leaveType={leaveMap[sc.coach_id]}
              weekStart={weekStart}
              isLocked={isLocked}
            />
          ))}
          {!isLocked && (
            <div className="relative">
              <button
                onClick={() => setAssigningSlot(session.coaches.length + 1)}
                className="w-7 h-6 border border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-500"
                title="Assign coach"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {assigningSlot !== null && (
                <CoachAssignDropdown
                  sessionId={session.id}
                  weekStart={weekStart}
                  sessionDate={session.session_date}
                  alreadyAssignedIds={assignedIds}
                  slotOrder={assigningSlot}
                  staff={staff}
                  leaveData={leaveData}
                  onClose={() => setAssigningSlot(null)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
