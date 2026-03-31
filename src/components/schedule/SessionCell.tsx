import { useState, useRef, useEffect } from 'react'
import type { SessionWithCoaches } from '../../types/schedule'
import type { StaffMember, StaffLeave } from '../../types/database'
import { CoachSlotFilled } from './CoachSlot'
import { CoachAssignDropdown } from './CoachAssignDropdown'
import { useDeleteSession, useUpdateSessionFlow, useUpdateSessionTime } from '../../hooks/useMutateSession'
import { GYM_COLORS } from '../../lib/constants'
import { formatTime } from '../../lib/dateUtils'

import { getSessionCardStyle } from '../../lib/scheduleUtils'

const FLOW_OPTIONS = ['A', 'B', 'C', 'D']

const FLOW_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'A': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' }, // blue
  'B': { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, // purple
  'C': { bg: '#fce7f3', text: '#c026d3', border: '#fbcfe8' }, // pink
  'D': { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, // orange
}

interface SessionCellProps {
  session: SessionWithCoaches
  weekStart: string
  staff: StaffMember[]
  leaveData: StaffLeave[]
  isLocked: boolean
  showCoaches: boolean
  isSelected: boolean
  onToggleSelect: () => void
  allSessions: SessionWithCoaches[]
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
  allSessions,
}: SessionCellProps) {
  const [assigningSlot, setAssigningSlot] = useState<number | null>(null)
  const [flowMenuOpen, setFlowMenuOpen] = useState(false)
  const [editingTime, setEditingTime] = useState(false)
  const [draftTime, setDraftTime] = useState('')
  const [swapMenuOpenCoachId, setSwapMenuOpenCoachId] = useState<string | null>(null)
  const flowMenuRef = useRef<HTMLDivElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)
  const deleteSession = useDeleteSession()
  const updateFlow = useUpdateSessionFlow()
  const updateTime = useUpdateSessionTime()

  const flowLabel = session.flow_label ?? 'A'

  useEffect(() => {
    if (!flowMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (flowMenuRef.current && !flowMenuRef.current.contains(e.target as Node)) {
        setFlowMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [flowMenuOpen])

  const startEditingTime = (e: React.MouseEvent) => {
    if (isLocked) return
    e.stopPropagation()
    // session_time is "HH:MM:SS", input type=time needs "HH:MM"
    const parts = session.session_time.split(':')
    setDraftTime(`${parts[0]}:${parts[1]}`)
    setEditingTime(true)
  }

  const saveTime = () => {
    if (!draftTime) { setEditingTime(false); return }
    const timeValue = draftTime.length === 5 ? `${draftTime}:00` : draftTime
    if (timeValue === session.session_time) { setEditingTime(false); return }
    updateTime.mutate({ sessionId: session.id, sessionTime: timeValue, weekStart }, {
      onSettled: () => setEditingTime(false),
    })
  }

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveTime()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingTime(false)
    }
  }

  useEffect(() => {
    if (editingTime && timeInputRef.current) {
      timeInputRef.current.focus()
      timeInputRef.current.select()
    }
  }, [editingTime])

  const handleFlowChange = (label: string) => {
    setFlowMenuOpen(false)
    if (label === flowLabel) return
    updateFlow.mutate({ sessionId: session.id, flowLabel: label, weekStart })
  }

  const gymConfig = GYM_COLORS[session.gym] ?? { border: '#9ca3af', label: session.gym }
  const sessionTypeColor = session.session_type?.color_hex ?? '#6366f1'
  const sessionTypeLabel = session.session_type?.label ?? '?'
  const isDraft = session.status === 'proposed'
  const cardStyle = getSessionCardStyle(session.session_type?.label, sessionTypeColor)

  const assignedIds = session.coaches.map((c) => c.coach_id)
  const leaveOnDate = leaveData.filter((l) => l.leave_date === session.session_date)
  const leaveMap: Record<string, string> = {}
  for (const l of leaveOnDate) leaveMap[l.staff_id] = l.leave_type

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this session and all coach assignments?')) return
    deleteSession.mutate({ sessionId: session.id, weekStart })
  }

  const flowColor = FLOW_COLORS[flowLabel] || FLOW_COLORS['A']

  const isAnyMenuOpen = flowMenuOpen || assigningSlot !== null || editingTime || swapMenuOpenCoachId !== null

  return (
    <div
      className={`rounded border transition-all group relative pl-6 ${
        isSelected ? 'ring-2 ring-blue-500 ring-inset shadow-sm' : 'hover:shadow-sm'
      } ${isAnyMenuOpen ? 'z-50 shadow-md' : 'z-10'}`}
      style={{
        backgroundColor: isSelected ? '#bfdbfe' : cardStyle.bg,
        borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
        borderRightWidth: 3,
        borderRightColor: gymConfig.border,
      }}
    >
      {/* Left-edge flow bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center border-r rounded-l overflow-visible z-10"
        style={{ width: '24px', backgroundColor: flowColor.bg, borderColor: flowColor.border, color: flowColor.text }}
        ref={flowMenuRef}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); if (!isLocked) setFlowMenuOpen((o) => !o) }}
          disabled={updateFlow.isPending || isLocked}
          className="flex items-center justify-center w-full h-full text-[10px] font-bold"
          title={isLocked ? `${flowLabel} flow` : "Change flow"}
        >
          {flowLabel}
        </button>
        {flowMenuOpen && !isLocked && (
          <div className="absolute z-50 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden w-24">
            {FLOW_OPTIONS.map((opt) => {
              const optColor = FLOW_COLORS[opt] || FLOW_COLORS['A']
              return (
                <button
                  key={opt}
                  onClick={(e) => { e.stopPropagation(); handleFlowChange(opt) }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 flex items-center gap-2`}
                >
                  <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: optColor.bg, border: `1px solid ${optColor.border}` }} />
                  <span className={opt === flowLabel ? 'font-bold' : 'text-gray-700'}>{opt}-flow</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

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

        {/* Session time – click to edit inline */}
        {editingTime ? (
          <input
            ref={timeInputRef}
            type="time"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            onKeyDown={handleTimeKeyDown}
            onBlur={saveTime}
            onClick={(e) => e.stopPropagation()}
            disabled={updateTime.isPending}
            className="text-[10px] font-bold text-gray-800 bg-white border border-blue-400 rounded px-1 py-0.5 w-[90px] leading-none flex-shrink-0 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        ) : (
          <button
            onClick={startEditingTime}
            disabled={isLocked}
            className="text-[9px] font-bold text-gray-600 leading-none flex-shrink-0 hover:text-blue-600 hover:underline transition-colors disabled:pointer-events-none"
            title={isLocked ? undefined : 'Click to edit time'}
          >
            {formatTime(session.session_time)}
          </button>
        )}

        {/* Session type badge */}
        <span
          className="text-[10px] font-extrabold uppercase px-1 py-0.5 rounded leading-none flex-shrink-0 whitespace-nowrap"
          style={{ color: cardStyle.text }}
        >
          {sessionTypeLabel}
        </span>

        {/* Gym badge */}
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded leading-none flex-shrink-0 whitespace-nowrap bg-white shadow-sm border"
          style={{ color: gymConfig.border, borderColor: `${gymConfig.border}33` }}
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
              <button
                onClick={() => setAssigningSlot(session.coaches.length + 1)}
                className="w-7 h-6 bg-white shadow-sm border border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-500"
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
                  currentSession={session}
                  allSessions={allSessions}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
