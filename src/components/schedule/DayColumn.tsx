import { useState } from 'react'
import type { SessionWithCoaches } from '../../types/schedule'
import type { StaffMember, StaffLeave } from '../../types/database'
import type { DayName } from '../../types/database'
import { SessionRow } from './SessionRow'
import { LEAVE_TYPE_LABELS } from '../../lib/constants'
import { formatDateShort } from '../../lib/dateUtils'

interface DayColumnProps {
  dayName: DayName
  dayLabel: string
  sessionDate: string
  sessions: SessionWithCoaches[]
  staff: StaffMember[]
  leaveData: StaffLeave[]
  weekStart: string
  isLocked: boolean
  onAddSession: (day: DayName) => void
}

export function DayColumn({
  dayName,
  dayLabel,
  sessionDate,
  sessions,
  staff,
  leaveData,
  weekStart,
  isLocked,
  onAddSession,
}: DayColumnProps) {
  const [collapsed, setCollapsed] = useState(false)

  const leaveOnDay = leaveData.filter((l) => l.leave_date === sessionDate)
  const sessionCount = sessions.length
  const totalSpots = sessions.reduce((sum, s) => sum + s.total_spots, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              className={`w-3.5 h-3.5 transition-transform ${collapsed ? '-rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900">{dayLabel}</p>
            <p className="text-xs text-gray-400">{formatDateShort(sessionDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-[11px] text-gray-400">sessions</p>
            <p className="text-sm font-semibold text-gray-700">{sessionCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">spots</p>
            <p className="text-sm font-semibold text-gray-700">{totalSpots}</p>
          </div>
        </div>
      </div>

      {/* Leave banner */}
      {!collapsed && leaveOnDay.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-3 py-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <svg className="w-3 h-3 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[11px] font-medium text-red-600">On leave: </span>
            {leaveOnDay.map((l) => (
              <span key={l.id} className="text-[11px] text-red-500">
                {l.coach_name}
                <span className="text-red-400"> ({LEAVE_TYPE_LABELS[l.leave_type] ?? l.leave_type})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Session rows */}
      {!collapsed && (
        <>
          {/* Column headers */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
            <div className="w-12 flex-shrink-0">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Time</span>
            </div>
            <div className="w-16 flex-shrink-0">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</span>
            </div>
            <div className="w-14 flex-shrink-0">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Spots</span>
            </div>
            <div className="w-12 flex-shrink-0">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Peak</span>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Coaches</span>
            </div>
          </div>

          {sessions.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-gray-400">No sessions</p>
            </div>
          )}

          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              weekStart={weekStart}
              staff={staff}
              leaveData={leaveData}
              isLocked={isLocked}
            />
          ))}

          {!isLocked && (
            <div className="px-3 py-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddSession(dayName)
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors group"
              >
                <span className="w-5 h-5 border border-dashed border-gray-300 rounded group-hover:border-blue-400 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                Add session
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
