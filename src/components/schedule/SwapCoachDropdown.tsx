import { useState, useRef, useEffect, useMemo } from 'react'
import type { StaffMember, StaffLeave, ScheduleSessionCoach } from '../../types/database'
import type { SessionWithCoaches } from '../../types/schedule'
import { useSwapCoach } from '../../hooks/useMutateCoachAssignment'
import { usePreferences } from '../../hooks/usePreferences'
import { useScheduleBlocks } from '../../hooks/useScheduleBlocks'
import { getInitials, findCoachTimeConflicts } from '../../lib/scheduleUtils'
import { Modal } from '../ui/Modal'
import { GYM_COLORS } from '../../lib/constants'
import { formatTime } from '../../lib/dateUtils'

interface SwapCoachDropdownProps {
  assignment: ScheduleSessionCoach & { coach: StaffMember }
  session: SessionWithCoaches
  allSessions: SessionWithCoaches[]
  staff: StaffMember[]
  leaveData: StaffLeave[]
  weekStart: string
  onClose: () => void
}

export function SwapCoachDropdown({
  assignment,
  session,
  allSessions,
  staff,
  leaveData,
  weekStart,
  onClose,
}: SwapCoachDropdownProps) {
  const [search, setSearch] = useState('')
  const [pendingSwap, setPendingSwap] = useState<{
    coach: StaffMember
    conflicts: SessionWithCoaches[]
  } | null>(null)
  
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const swapCoach = useSwapCoach()
  const { data: preferences = [] } = usePreferences(session.period_id)
  const { data: blockConfigs = [] } = useScheduleBlocks()

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
    return new Set(leaveData.filter((l) => l.leave_date === session.session_date).map((l) => l.staff_id))
  }, [leaveData, session.session_date])

  const alreadyAssignedIds = useMemo(() => {
    return new Set(session.coaches.map(c => c.coach_id))
  }, [session.coaches])

  // Determine the block for this session
  const sessionBlockId = useMemo(() => {
    const time = session.session_time.substring(0, 5)
    const dayKey = session.day_name.substring(0, 3).toUpperCase()
    
    for (const bc of blockConfigs) {
      if (!bc.block_id.startsWith(dayKey + '_')) continue
      const blockStart = bc.block_start.substring(0, 5)
      const blockEnd = bc.block_end.substring(0, 5)
      if (time >= blockStart && time < blockEnd) {
        return bc.block_id
      }
    }
    return null
  }, [session, blockConfigs])

  // Helper to convert HH:MM:SS to minutes for time comparisons
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  // Get options
  const swapOptions = useMemo(() => {
    const targetTimeMin = timeToMinutes(session.session_time)
    const targetDuration = session.session_type?.duration_minutes ?? 60
    const targetEndMin = targetTimeMin + targetDuration

    // 1. Find coaches working within 39 minutes
    // 2. Calculate the min start and max end times for every coach on this day
    const unavailableCoachIds = new Set<string>()
    const coachDaySpans: Record<string, { minStart: number, maxEnd: number }> = {}

    for (const s of allSessions) {
      if (s.day_name === session.day_name) {
        const sTimeMin = timeToMinutes(s.session_time)
        const sDuration = s.session_type?.duration_minutes ?? 60
        const sEndMin = sTimeMin + sDuration

        for (const c of s.coaches) {
          const cid = c.coach_id
          
          // Check 39-minute overlap rule
          if (Math.abs(sTimeMin - targetTimeMin) <= 39) {
            unavailableCoachIds.add(cid)
          }

          // Track min/max times for the span calculation
          if (!coachDaySpans[cid]) {
            coachDaySpans[cid] = { minStart: sTimeMin, maxEnd: sEndMin }
          } else {
            coachDaySpans[cid].minStart = Math.min(coachDaySpans[cid].minStart, sTimeMin)
            coachDaySpans[cid].maxEnd = Math.max(coachDaySpans[cid].maxEnd, sEndMin)
          }
        }
      }
    }

    const availableStaff = staff
      .filter((s) => s.staff_status === 'active')
      .filter((s) => !alreadyAssignedIds.has(s.id))
      .filter((s) => !leaveOnDate.has(s.id))
      .filter((s) => !unavailableCoachIds.has(s.id)) // Exclude if already coaching within 39m
      .filter((s) => {
        // Enforce 10-hour (600 minute) maximum span rule
        const span = coachDaySpans[s.id]
        if (span) {
          const newMinStart = Math.min(span.minStart, targetTimeMin)
          const newMaxEnd = Math.max(span.maxEnd, targetEndMin)
          if (newMaxEnd - newMinStart > 600) {
            return false // Span exceeds 10 hours
          }
        }
        return true
      })
      .filter((s) => {
        // State-based location restrictions
        if (session.gym === 'COLLINS') return s.state === 'VIC'
        if (session.gym === 'BRIDGE' || session.gym === 'BLIGH') return s.state === 'NSW'
        return true
      })
      .filter((s) =>
        search.trim() === '' ||
        (s.coach_name ?? '').toLowerCase().includes(search.toLowerCase())
      )

    // Score and sort staff
    const scoredStaff = availableStaff.map(coach => {
      let prefType = 'none'
      if (sessionBlockId) {
        const coachPref = preferences.find(p => p.staff_id === coach.id && p.block === sessionBlockId)
        if (coachPref) prefType = (coachPref.preference_type as string).toLowerCase()
      }

      // Check conflicts
      const conflicts = findCoachTimeConflicts(coach.id, session, allSessions)
      
      let score = 0
      
      // Tier 1: Preference or no preference
      if (prefType === 'preferred') score = 100
      else if (prefType === 'none') score = 80
      // Tier 2: Soft unavailability
      else if (prefType === 'soft') score = 40
      // Tier 3: Hard unavailability
      else if (prefType === 'hard') score = 10

      // Penalise if they have conflicts (cross-flow)
      if (conflicts.length > 0) score -= 50

      return { coach, prefType, score, conflicts }
    })

    return scoredStaff
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Always aim to provide ideally 10 options
  }, [staff, alreadyAssignedIds, leaveOnDate, search, preferences, sessionBlockId, session, allSessions])

  const doSwap = async (coach: StaffMember) => {
    await swapCoach.mutateAsync({
      assignmentId: assignment.id,
      newCoachId: coach.id,
      weekStart,
    })
    onClose()
  }

  const handleSwap = (option: typeof swapOptions[0]) => {
    if (option.conflicts.length > 0) {
      setPendingSwap({ coach: option.coach, conflicts: option.conflicts })
    } else {
      void doSwap(option.coach)
    }
  }

  return (
    <>
      <div
        ref={ref}
        className="absolute z-50 top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="p-2 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-700 mb-2 px-1">Suggested Swaps</p>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coach..."
            className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {swapOptions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No suitable swaps found</p>
          )}
          {swapOptions.map((opt) => {
            const { coach, prefType, conflicts } = opt
            const colour = coach.rgb_colour ?? '#6366f1'
            
            let prefLabel = ''
            let prefColor = ''
            if (prefType === 'preferred') { prefLabel = 'Preferred'; prefColor = 'text-green-600 bg-green-50' }
            else if (prefType === 'soft') { prefLabel = 'Soft Unavail'; prefColor = 'text-amber-600 bg-amber-50' }
            else if (prefType === 'hard') { prefLabel = 'Hard Unavail'; prefColor = 'text-red-600 bg-red-50' }
            else { prefLabel = 'No Pref'; prefColor = 'text-gray-500 bg-gray-100' }

            return (
              <button
                key={coach.id}
                onClick={() => handleSwap(opt)}
                disabled={swapCoach.isPending}
                className="flex flex-col w-full px-2 py-1.5 hover:bg-gray-50 border-b last:border-0 border-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colour }}
                  >
                    <span className="text-[9px] text-white font-bold">{getInitials(coach.coach_name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gray-800 truncate leading-tight">{coach.coach_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] px-1 py-0.5 rounded font-medium leading-none ${prefColor}`}>
                        {prefLabel}
                      </span>
                      {conflicts.length > 0 && (
                        <span className="text-[8px] text-amber-600 font-medium leading-none">Cross-flow</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cross-flow confirmation modal */}
      {pendingSwap && (
        <Modal
          isOpen
          onClose={() => setPendingSwap(null)}
          title="Cross-flow swap"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: pendingSwap.coach.rgb_colour ?? '#6366f1' }}
              >
                <span className="text-xs text-white font-bold">
                  {getInitials(pendingSwap.coach.coach_name)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {pendingSwap.coach.coach_name}
                </p>
                <p className="text-xs text-gray-500">{pendingSwap.coach.role}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              This coach is already assigned to a{' '}
              <span className="font-semibold text-violet-700">
                {pendingSwap.conflicts[0]?.flow_label ?? 'A'}-flow
              </span>{' '}
              session today, but you are swapping them into a{' '}
              <span className="font-semibold text-violet-700">
                {session.flow_label ?? 'A'}-flow
              </span>{' '}
              session. Cross-flow assignments mean this coach will be running two different
              session series on the same day.
            </p>

            <ul className="space-y-1.5">
              {pendingSwap.conflicts.map((s) => {
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
                    <span
                      className="font-bold px-1 py-0.5 rounded text-[9px]"
                      style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}
                    >
                      {s.flow_label ?? 'A'}-flow
                    </span>
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

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setPendingSwap(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const coach = pendingSwap.coach
                  setPendingSwap(null)
                  void doSwap(coach)
                }}
                disabled={swapCoach.isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Swap anyway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
