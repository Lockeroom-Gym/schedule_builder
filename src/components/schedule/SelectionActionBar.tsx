import { useState, useMemo, useRef, useEffect } from 'react'
import type { SessionWithCoaches } from '../../types/schedule'
import type { StaffMember } from '../../types/database'
import { getInitials } from '../../lib/scheduleUtils'
import { useBulkCoachOperations } from '../../hooks/useBulkCoachOperations'

type PickerMode = 'assign' | 'remove' | 'substitute-from' | 'substitute-to'

interface SelectionActionBarProps {
  selectedSessionIds: Set<string>
  sessions: SessionWithCoaches[]
  staff: StaffMember[]
  weekStart: string
  onClearSelection: () => void
}

export function SelectionActionBar({
  selectedSessionIds,
  sessions,
  staff,
  weekStart,
  onClearSelection,
}: SelectionActionBarProps) {
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null)
  const [substituteFromId, setSubstituteFromId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const { bulkAssign, bulkRemove, bulkSubstitute, isPending } = useBulkCoachOperations()

  const selectedSessions = useMemo(
    () => sessions.filter((s) => selectedSessionIds.has(s.id)),
    [sessions, selectedSessionIds]
  )

  const count = selectedSessionIds.size

  const assignedCoachIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of selectedSessions) {
      for (const c of s.coaches) ids.add(c.coach_id)
    }
    return ids
  }, [selectedSessions])

  const assignedCoaches = useMemo(
    () => staff.filter((s) => assignedCoachIds.has(s.id)),
    [staff, assignedCoachIds]
  )

  const activeStaff = useMemo(
    () => staff.filter((s) => s.staff_status === 'active'),
    [staff]
  )

  useEffect(() => {
    if (pickerMode) {
      setTimeout(() => searchRef.current?.focus(), 60)
    }
  }, [pickerMode])

  const filteredCoaches = (list: StaffMember[]) =>
    list.filter(
      (s) =>
        search.trim() === '' ||
        (s.coach_name ?? '').toLowerCase().includes(search.toLowerCase())
    )

  const closePicker = () => {
    setPickerMode(null)
    setSearch('')
    setSubstituteFromId(null)
  }

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode)
    setSearch('')
  }

  const handleAssign = async (coachId: string) => {
    const inserts = selectedSessions.map((s) => ({
      sessionId: s.id,
      slotOrder: s.coaches.length + 1,
    }))
    await bulkAssign({ inserts, coachId, weekStart })
    closePicker()
    onClearSelection()
  }

  const handleRemove = async (coachId: string) => {
    const assignmentIds = selectedSessions.flatMap((s) =>
      s.coaches.filter((c) => c.coach_id === coachId).map((c) => c.id)
    )
    await bulkRemove({ assignmentIds, weekStart })
    closePicker()
    onClearSelection()
  }

  const handleSubstituteFrom = (coachId: string) => {
    setSubstituteFromId(coachId)
    setPickerMode('substitute-to')
    setSearch('')
  }

  const handleSubstituteTo = async (newCoachId: string) => {
    if (!substituteFromId) return
    const assignmentIds = selectedSessions.flatMap((s) =>
      s.coaches.filter((c) => c.coach_id === substituteFromId).map((c) => c.id)
    )
    const inserts = selectedSessions.map((s) => {
      const remaining = s.coaches.filter((c) => c.coach_id !== substituteFromId)
      return { sessionId: s.id, slotOrder: remaining.length + 1 }
    })
    await bulkSubstitute({ assignmentIds, inserts, newCoachId, weekStart })
    closePicker()
    onClearSelection()
  }

  const currentPickerList = (): StaffMember[] => {
    if (pickerMode === 'assign') return filteredCoaches(activeStaff)
    if (pickerMode === 'remove') return filteredCoaches(assignedCoaches)
    if (pickerMode === 'substitute-from') return filteredCoaches(assignedCoaches)
    if (pickerMode === 'substitute-to')
      return filteredCoaches(activeStaff.filter((s) => s.id !== substituteFromId))
    return []
  }

  const onCoachClick = (coachId: string) => {
    if (pickerMode === 'assign') handleAssign(coachId)
    else if (pickerMode === 'remove') handleRemove(coachId)
    else if (pickerMode === 'substitute-from') handleSubstituteFrom(coachId)
    else if (pickerMode === 'substitute-to') handleSubstituteTo(coachId)
  }

  const pickerTitle: Record<PickerMode, string> = {
    assign: 'Assign to all selected sessions',
    remove: 'Remove from all selected sessions',
    'substitute-from': 'Step 1: Pick coach to replace',
    'substitute-to': 'Step 2: Pick replacement coach',
  }

  const substituteFromCoach = staff.find((s) => s.id === substituteFromId)

  return (
    <div className="relative flex-shrink-0 z-30">
      {/* Coach picker popover */}
      {pickerMode && (
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-30" onClick={closePicker} />
          <div
            className="absolute bottom-full z-40 mb-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="px-3 pt-3 pb-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">{pickerTitle[pickerMode]}</p>
              {pickerMode === 'substitute-to' && substituteFromCoach && (
                <p className="text-[11px] text-indigo-600 mb-1.5 font-medium">
                  Replacing: {substituteFromCoach.coach_name ?? '—'}
                </p>
              )}
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coach..."
                className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {currentPickerList().length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-5">No coaches found</p>
              ) : (
                currentPickerList().map((coach) => (
                  <button
                    key={coach.id}
                    onClick={() => onCoachClick(coach.id)}
                    disabled={isPending}
                    className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 text-left disabled:opacity-50 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: coach.rgb_colour ?? '#6366f1' }}
                    >
                      <span className="text-[9px] text-white font-bold">{getInitials(coach.coach_name)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{coach.coach_name ?? '—'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{coach.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Action bar */}
      <div className="bg-gray-900 border-t border-gray-800 text-white px-4 py-2.5 flex items-center gap-3">
        {/* Count badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold">{count}</span>
          </div>
          <span className="text-sm font-medium whitespace-nowrap">
            {count} session{count !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-1 ml-1">
          <button
            onClick={() => openPicker('assign')}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign Coach
          </button>
          <button
            onClick={() => openPicker('remove')}
            disabled={isPending || assignedCoachIds.size === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Remove Coach
          </button>
          <button
            onClick={() => openPicker('substitute-from')}
            disabled={isPending || assignedCoachIds.size === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Substitute
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={() => { closePicker(); onClearSelection() }}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0 ml-auto"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  )
}
