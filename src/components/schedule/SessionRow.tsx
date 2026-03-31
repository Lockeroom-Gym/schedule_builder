import { useState } from 'react'
import type { SessionWithCoaches } from '../../types/schedule'
import type { StaffMember, StaffLeave } from '../../types/database'
import { CoachSlotFilled, CoachSlotEmpty } from './CoachSlot'
import { CoachAssignDropdown } from './CoachAssignDropdown'
import { formatTime } from '../../lib/dateUtils'
import { useDeleteSession } from '../../hooks/useMutateSession'
import { getSessionCardStyle } from '../../lib/scheduleUtils'

interface SessionRowProps {
  session: SessionWithCoaches
  weekStart: string
  staff: StaffMember[]
  leaveData: StaffLeave[]
  isLocked: boolean
  allSessions: SessionWithCoaches[]
}

export function SessionRow({ session, weekStart, staff, leaveData, isLocked, allSessions }: SessionRowProps) {
  const [assigningSlot, setAssigningSlot] = useState<number | null>(null)
  const [swapMenuOpenCoachId, setSwapMenuOpenCoachId] = useState<string | null>(null)
  const deleteSession = useDeleteSession()

  const handleDeleteSession = () => {
    if (!confirm('Delete this session and all coach assignments?')) return
    deleteSession.mutate({ sessionId: session.id, weekStart })
  }

  const assignedIds = session.coaches.map((c) => c.coach_id)
  const leaveOnDate = leaveData.filter((l) => l.leave_date === session.session_date)
  const leaveMap: Record<string, string> = {}
  for (const l of leaveOnDate) leaveMap[l.staff_id] = l.leave_type

  const sessionTypeLabel = session.session_type?.label ?? '?'
  const sessionTypeColor = session.session_type?.color_hex ?? '#6366f1'
  const isDraft = session.status === 'proposed'
  const isAnyMenuOpen = assigningSlot !== null || swapMenuOpenCoachId !== null
  const cardStyle = getSessionCardStyle(session.session_type?.label, sessionTypeColor)

  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 border-b border-gray-50 group transition-colors relative ${
        isDraft ? 'border-l-2 border-l-dashed' : 'border-l-2'
      } ${isAnyMenuOpen ? 'z-50' : 'z-10'}`}
      style={{ borderLeftColor: sessionTypeColor, backgroundColor: cardStyle.bg }}
    >
      {/* Time */}
      <div className="w-12 flex-shrink-0 pt-0.5">
        <span className="text-xs font-semibold text-gray-700">{formatTime(session.session_time)}</span>
      </div>

      {/* Session type */}
      <div className="w-16 flex-shrink-0 pt-0.5">
        <span
          className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded"
          style={{ color: cardStyle.text }}
        >
          {sessionTypeLabel}
        </span>
      </div>

      {/* Spots */}
      <div className="w-14 flex-shrink-0 pt-0.5">
        <span className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">{session.total_spots}</span>
          <span className="text-gray-400"> spots</span>
        </span>
      </div>

      {/* Peak / Off-peak */}
      <div className="w-12 flex-shrink-0 pt-0.5">
        {session.is_peak ? (
          <span className="text-[10px] text-amber-600 font-medium">Peak</span>
        ) : (
          <span className="text-[10px] text-gray-400">Off-peak</span>
        )}
      </div>

      {/* Coach slots */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1 relative">
        {[...session.coaches].sort((a, b) => {
          const aLeave = !!leaveMap[a.coach_id]
          const bLeave = !!leaveMap[b.coach_id]
          if (aLeave && !bLeave) return -1
          if (!aLeave && bLeave) return 1
          return a.slot_order - b.slot_order
        }).map((sc) => (
          <CoachSlotFilled
            key={sc.id}
            assignment={sc as any}
            isOnLeave={!!leaveMap[sc.coach_id]}
            weekStart={weekStart}
            isLocked={isLocked}
            session={session}
            allSessions={allSessions}
            staff={staff}
            leaveData={leaveData}
            onMenuOpenChange={(isOpen) => setSwapMenuOpenCoachId(isOpen ? sc.coach_id : null)}
          />
        ))}

        {!isLocked && (
          <div className="relative">
            <CoachSlotEmpty
              isLocked={isLocked}
              onClick={() => setAssigningSlot(session.coaches.length + 1)}
            />
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
                currentSession={session}
                allSessions={allSessions}
              />
            )}
          </div>
        )}
      </div>

      {/* Draft badge */}
      {isDraft && (
        <div className="flex-shrink-0 pt-0.5">
          <span className="text-[10px] text-gray-400 italic">draft</span>
        </div>
      )}

      {/* Delete button */}
      {!isLocked && (
        <button
          onClick={handleDeleteSession}
          disabled={deleteSession.isPending}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
          title="Delete session"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
