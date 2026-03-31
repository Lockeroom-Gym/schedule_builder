import { useState, useMemo } from 'react'
import type { SessionWithCoaches } from '../../types/schedule'
import { useSessionsWithCoaches, useSessionCoaches } from '../../hooks/useScheduleSessions'
import { useStaff, useStaffBrackets } from '../../hooks/useStaff'
import { useLeave } from '../../hooks/useLeave'
import { useSessionTypes } from '../../hooks/useSessionTypes'
import { useEffectiveCoachPreferences } from '../../hooks/usePreferences'
import { useScheduleBlocks } from '../../hooks/useScheduleBlocks'
import { StaffSummaryStrip } from './StaffSummaryStrip'
import { WeekNavigator } from './WeekNavigator'
import { FilterBar } from './FilterBar'
import { SessionCell } from './SessionCell'
import { SelectionActionBar } from './SelectionActionBar'
import { AddSessionModal } from './AddSessionModal'
import { CopyScheduleModal } from './CopyScheduleModal'
import { PageLoader } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import {
  getPeriodPhase,
  getSessionDateForDay,
  formatTime,
  formatDateShort,
} from '../../lib/dateUtils'
import { DAYS_OF_WEEK } from '../../lib/constants'
import type { SchedulePeriodEffective, DayName } from '../../types/database'

const BLOCK_HIGHLIGHT_COLORS: Record<string, string> = {
  hard: 'rgba(254, 202, 202, 0.5)',
  soft: 'rgba(254, 240, 138, 0.45)',
  preferred: 'rgba(167, 243, 208, 0.45)',
}

const DAYS = DAYS_OF_WEEK.slice(0, 6) // Mon–Sat
const COLLAPSED_COL_WIDTH = 40

interface ScheduleGridProps {
  periods: SchedulePeriodEffective[]
  selectedPeriodId: string
  onPeriodChange: (id: string) => void
}

export function ScheduleGrid({ periods, selectedPeriodId, onPeriodChange }: ScheduleGridProps) {
  const [selectedGyms, setSelectedGyms] = useState<string[]>([])
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([])
  const [selectedFlows, setSelectedFlows] = useState<string[]>([])
  const [addSessionDay, setAddSessionDay] = useState<DayName | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Set<DayName>>(new Set())
  const [showCoaches, setShowCoaches] = useState(true)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [showCopyModal, setShowCopyModal] = useState(false)

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId)
  const weekStart = selectedPeriod?.week_start ?? null
  const phase = weekStart ? getPeriodPhase(weekStart) : 'draft'
  const isLocked = selectedPeriod?.is_locked || phase === 'locked'

  const { data: staff = [] } = useStaff(true)
  const { data: brackets = [] } = useStaffBrackets()
  const { data: sessionCoaches = [], isLoading: coachesLoading } = useSessionCoaches(weekStart)
  const { data: leaveData = [] } = useLeave(weekStart)
  const { data: sessionTypes = [] } = useSessionTypes()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessionsWithCoaches(weekStart)
  const { data: coachPreferences = [] } = useEffectiveCoachPreferences(selectedCoachId, weekStart)
  const { data: blockConfigs = [] } = useScheduleBlocks()

  const isLoading = sessionsLoading || coachesLoading

  // Map blockId -> block config for fast lookup
  const blockConfigMap = useMemo(() => {
    const map: Record<string, { block_start: string; block_end: string }> = {}
    for (const bc of blockConfigs) {
      map[bc.block_id] = bc
    }
    return map
  }, [blockConfigs])

  // Map blockId -> preference type (lowercase) for the selected coach
  const coachBlockPrefs = useMemo(() => {
    if (!selectedCoachId || coachPreferences.length === 0) return {}
    const map: Record<string, string> = {}
    for (const pref of coachPreferences) {
      map[pref.block] = (pref.preference_type as string).toLowerCase()
    }
    return map
  }, [coachPreferences, selectedCoachId])

  // Returns the highlight type ('hard' | 'soft' | 'preferred' | null) for a given day+time cell
  const getCellHighlight = useMemo(() => {
    return (dayKey: string, time: string): string | null => {
      if (!selectedCoachId || Object.keys(coachBlockPrefs).length === 0) return null
      for (const [blockId, prefType] of Object.entries(coachBlockPrefs)) {
        if (!blockId.startsWith(dayKey + '_')) continue
        const config = blockConfigMap[blockId]
        if (!config) continue
        // Normalize DB times (HH:MM:SS) to HH:MM for comparison
        const blockStart = config.block_start.substring(0, 5)
        const blockEnd = config.block_end.substring(0, 5)
        if (time >= blockStart && time < blockEnd) return prefType
      }
      return null
    }
  }, [selectedCoachId, coachBlockPrefs, blockConfigMap])

  // Apply gym/type/flow filters — does NOT include coach filter (preserves time axis)
  const filteredSessions = useMemo(() => {
    let list: SessionWithCoaches[] = sessions ?? []
    if (selectedGyms.length > 0) list = list.filter((s) => selectedGyms.includes(s.gym))
    if (selectedSessionTypes.length > 0)
      list = list.filter((s) => selectedSessionTypes.includes(s.session_type_id))
    if (selectedFlows.length > 0)
      list = list.filter((s) => selectedFlows.includes(s.flow_label || 'A'))
    return list
  }, [sessions, selectedGyms, selectedSessionTypes, selectedFlows])

  // Coach-filtered sessions (used for time axis and session map when a coach is selected)
  const coachFilteredSessions = useMemo(() => {
    if (!selectedCoachId) return filteredSessions
    return filteredSessions.filter((s) =>
      s.coaches.some((c) => c.coach_id === selectedCoachId)
    )
  }, [filteredSessions, selectedCoachId])

  // Time axis collapses to only the selected coach's session times
  const allTimes = useMemo(() => {
    const times = new Set(coachFilteredSessions.map((s) => s.session_time))
    return Array.from(times).sort()
  }, [coachFilteredSessions])

  // Sessions indexed by "dayName::sessionTime"
  const sessionMap = useMemo(() => {
    const map: Record<string, SessionWithCoaches[]> = {}
    
    // Sort by Gym order: BRIDGE, BLIGH, COLLINS
    const GYM_ORDER: Record<string, number> = {
      BRIDGE: 1,
      BLIGH: 2,
      COLLINS: 3,
    }
    
    // Create a sorted copy of the sessions
    const sortedSessions = [...coachFilteredSessions].sort((a, b) => {
      const orderA = GYM_ORDER[a.gym] || 99
      const orderB = GYM_ORDER[b.gym] || 99
      return orderA - orderB
    })

    for (const s of sortedSessions) {
      const key = `${s.day_name}::${s.session_time}`
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return map
  }, [coachFilteredSessions])

  // Leave indexed by date string
  const leaveByDate = useMemo(() => {
    const map: Record<string, typeof leaveData> = {}
    for (const l of leaveData) {
      if (!map[l.leave_date]) map[l.leave_date] = []
      map[l.leave_date].push(l)
    }
    return map
  }, [leaveData])

  const toggleDay = (day: DayName) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const toggleSession = (id: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!selectedPeriod) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          title="No period selected"
          description="Select a schedule period from the dropdown in the header."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Staff summary strip */}
      <StaffSummaryStrip
        staff={staff}
        brackets={brackets}
        sessionCoaches={sessionCoaches}
        leaveData={leaveData}
        isLoading={coachesLoading}
        selectedCoachId={selectedCoachId}
        onCoachSelect={setSelectedCoachId}
      />

      {/* Controls bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 flex-shrink-0 flex-wrap">
        <WeekNavigator
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          onPeriodChange={onPeriodChange}
          phase={phase}
        />
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <FilterBar
            selectedGyms={selectedGyms}
            onGymsChange={setSelectedGyms}
            selectedSessionTypes={selectedSessionTypes}
            onSessionTypesChange={setSelectedSessionTypes}
            selectedFlows={selectedFlows}
            onFlowsChange={setSelectedFlows}
            sessionTypes={sessionTypes}
          />

          {/* Show/Hide Coaches toggle */}
          <button
            onClick={() => setShowCoaches(!showCoaches)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              showCoaches
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {showCoaches ? 'Hide Coaches' : 'Show Coaches'}
          </button>

          <button
            onClick={() => setShowCopyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Schedule
          </button>

          {!isLocked && (
            <button
              onClick={() => setAddSessionDay('MON')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Session
            </button>
          )}
        </div>
      </div>

      {/* Coach filter active banner */}
      {selectedCoachId && (() => {
        const coach = staff.find((s) => s.id === selectedCoachId)
        return (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-1.5 flex items-center gap-2 flex-shrink-0">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: coach?.rgb_colour ?? '#6366f1' }}
            />
            <span className="text-xs text-indigo-700 font-medium">
              Showing sessions for {coach?.coach_name ?? 'selected coach'}
            </span>
            <span className="text-xs text-indigo-400 ml-1">
              · Shaded blocks show their preferences
            </span>
            <button
              onClick={() => setSelectedCoachId(null)}
              className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          </div>
        )
      })()}

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto min-h-0 bg-gray-50/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <PageLoader />
          </div>
        ) : (
          <div style={{ minWidth: 860 }}>
            {/* ── Sticky day header row ── */}
            <div
              className="flex bg-white border-b border-gray-200 shadow-sm"
              style={{ position: 'sticky', top: 0, zIndex: 20 }}
            >
              {/* Top-left corner — sticky in both axes */}
              <div
                className="border-r border-gray-200 bg-white flex-shrink-0"
                style={{ width: 64, position: 'sticky', left: 0, zIndex: 30 }}
              />

              {DAYS.map((day) => {
                const isCollapsed = collapsedDays.has(day.key)
                const sessionDate = weekStart ? getSessionDateForDay(weekStart, day.key) : ''
                const dayLeave = leaveByDate[sessionDate] ?? []
                const dayCount = filteredSessions.filter((s) => s.day_name === day.key).length

                return (
                  <div
                    key={day.key}
                    className="border-r border-gray-200 overflow-hidden transition-all duration-200"
                    style={
                      isCollapsed
                        ? { width: COLLAPSED_COL_WIDTH, flexShrink: 0 }
                        : { flex: 1, minWidth: 150 }
                    }
                  >
                    {/* Day header button */}
                    <button
                      onClick={() => toggleDay(day.key)}
                      className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors"
                      style={{
                        padding: isCollapsed ? '10px 4px' : '8px 10px',
                        minHeight: 44,
                      }}
                    >
                      {isCollapsed ? (
                        <span
                          className="text-[10px] font-bold text-gray-500 mx-auto select-none"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {day.short}
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 min-w-0 text-left">
                            <svg
                              className="w-3 h-3 text-gray-400 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-tight">
                                {day.label}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-tight">
                                {formatDateShort(sessionDate)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-400 flex-shrink-0 ml-2">
                            {dayCount}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Leave banner (only when expanded) */}
                    {!isCollapsed && dayLeave.length > 0 && (
                      <div className="bg-red-50 border-t border-red-100 px-2 py-1 flex items-center gap-1 flex-wrap">
                        <svg
                          className="w-3 h-3 text-red-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span className="text-[9px] font-semibold text-red-600">Leave:</span>
                        {dayLeave.slice(0, 3).map((l) => (
                          <span key={l.id} className="text-[9px] text-red-500 font-medium">
                            {(l.coach_name ?? '').split(' ')[0]}
                          </span>
                        ))}
                        {dayLeave.length > 3 && (
                          <span className="text-[9px] text-red-400">+{dayLeave.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Empty state when no sessions ── */}
            {allTimes.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm font-semibold text-gray-500">No sessions this week</p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedGyms.length > 0 || selectedSessionTypes.length > 0
                    ? 'Try adjusting your filters'
                    : 'Click "+ Add Session" to get started'}
                </p>
                {!isLocked &&
                  selectedGyms.length === 0 &&
                  selectedSessionTypes.length === 0 && (
                    <button
                      onClick={() => setAddSessionDay('MON')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      + Add Session
                    </button>
                  )}
              </div>
            )}

            {/* ── Time slot rows ── */}
            {allTimes.map((time) => (
              <div key={time} className="flex border-b border-gray-100">
                {/* Sticky time label */}
                <div
                  className="bg-white border-r border-gray-100 flex items-start justify-center pt-2 pb-1.5 flex-shrink-0"
                  style={{ width: 64, position: 'sticky', left: 0, zIndex: 10 }}
                >
                  <span className="text-[11px] font-semibold text-gray-500">
                    {formatTime(time)}
                  </span>
                </div>

                {/* Day cells */}
                {DAYS.map((day) => {
                  const isCollapsed = collapsedDays.has(day.key)
                  const cellSessions = sessionMap[`${day.key}::${time}`] ?? []

                  if (isCollapsed) {
                    return (
                      <div
                        key={day.key}
                        className="border-r border-gray-100 bg-gray-50/60 flex-shrink-0"
                        style={{ width: COLLAPSED_COL_WIDTH }}
                      />
                    )
                  }

                  const highlight = getCellHighlight(day.key, time)
                  return (
                    <div
                      key={day.key}
                      className="flex-1 border-r border-gray-100 p-1.5 space-y-1"
                      style={{
                        minWidth: 150,
                        backgroundColor: highlight ? BLOCK_HIGHLIGHT_COLORS[highlight] : undefined,
                      }}
                    >
                      {cellSessions.map((session) => {
                        const FLOW_ORDER = ['A', 'B', 'C', 'D', 'E', 'F']
                        const flowIndex = Math.max(0, FLOW_ORDER.indexOf(session.flow_label ?? 'A'))
                        return (
                          <div
                            key={session.id}
                            style={{ marginLeft: flowIndex * 20 }}
                          >
                            <SessionCell
                              session={session}
                              weekStart={weekStart ?? ''}
                              staff={staff}
                              leaveData={leaveData}
                              isLocked={isLocked}
                              showCoaches={showCoaches}
                              isSelected={selectedSessionIds.has(session.id)}
                              onToggleSelect={() => toggleSession(session.id)}
                              allSessions={sessions ?? []}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* ── Footer: per-day "Add session" links ── */}
            {!isLocked && allTimes.length > 0 && (
              <div className="flex border-b border-gray-100">
                <div
                  className="bg-white border-r border-gray-100 flex-shrink-0"
                  style={{ width: 64, position: 'sticky', left: 0, zIndex: 10 }}
                />
                {DAYS.map((day) => {
                  const isCollapsed = collapsedDays.has(day.key)
                  return (
                    <div
                      key={day.key}
                      className="border-r border-gray-100"
                      style={
                        isCollapsed
                          ? { width: COLLAPSED_COL_WIDTH, flexShrink: 0 }
                          : { flex: 1, minWidth: 150, padding: '6px 6px' }
                      }
                    >
                      {!isCollapsed && (
                        <button
                          onClick={() => setAddSessionDay(day.key)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <span className="w-4 h-4 border border-dashed border-gray-300 rounded flex items-center justify-center flex-shrink-0 hover:border-blue-400">
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </span>
                          Add session
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Selection action bar (shows when sessions selected) ── */}
      {selectedSessionIds.size > 0 && (
        <SelectionActionBar
          selectedSessionIds={selectedSessionIds}
          sessions={sessions ?? []}
          staff={staff}
          weekStart={weekStart ?? ''}
          onClearSelection={() => setSelectedSessionIds(new Set())}
        />
      )}

      {/* ── Add session modal ── */}
      <AddSessionModal
        isOpen={addSessionDay !== null}
        onClose={() => setAddSessionDay(null)}
        weekStart={weekStart ?? ''}
        periodId={selectedPeriodId}
        sessionTypes={sessionTypes}
        defaultDay={addSessionDay ?? 'MON'}
      />

      {/* ── Copy schedule modal ── */}
      {weekStart && (
        <CopyScheduleModal
          isOpen={showCopyModal}
          onClose={() => setShowCopyModal(false)}
          sourceWeekStart={weekStart}
          periods={periods}
        />
      )}
    </div>
  )
}
