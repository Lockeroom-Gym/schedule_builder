import { useState, useMemo } from 'react'
import { useStaff } from '../../hooks/useStaff'
import { useLeave } from '../../hooks/useLeave'
import { useSessionCoaches } from '../../hooks/useScheduleSessions'
import { useSchedulePeriods } from '../../hooks/useSchedulePeriods'
import { CoachCard } from './CoachCard'
import { Toggle } from '../ui/Toggle'
import { MultiSelect } from '../ui/MultiSelect'
import { PageLoader } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import type { StaffLeave } from '../../types/database'

interface CoachGridProps {
  selectedPeriodId: string
}

export function CoachGrid({ selectedPeriodId }: CoachGridProps) {
  const [activeOnly, setActiveOnly] = useState(true)
  const [states, setStates] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])

  const { data: staff, isLoading: staffLoading } = useStaff(false)
  const { data: periods } = useSchedulePeriods()

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId)
  const weekStart = selectedPeriod?.week_start ?? null

  const { data: sessionCoaches } = useSessionCoaches(weekStart)
  const { data: leaveData } = useLeave(weekStart)

  const roleOptions = useMemo(() => {
    const unique = [...new Set(staff?.map((s) => s.role).filter(Boolean) ?? [])]
    return unique.map((r) => ({ value: r, label: r }))
  }, [staff])

  const sessionCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const sc of sessionCoaches ?? []) {
      map[sc.coach_id] = (map[sc.coach_id] ?? 0) + 1
    }
    return map
  }, [sessionCoaches])

  const leaveByCoach = useMemo(() => {
    const map: Record<string, StaffLeave[]> = {}
    for (const leave of leaveData ?? []) {
      if (!map[leave.staff_id]) map[leave.staff_id] = []
      map[leave.staff_id].push(leave)
    }
    return map
  }, [leaveData])

  const filtered = useMemo(() => {
    let list = staff ?? []
    if (activeOnly) list = list.filter((s) => s.staff_status === 'active')
    if (states.length) list = list.filter((s) => s.state && states.includes(s.state))
    if (roles.length) list = list.filter((s) => roles.includes(s.role))
    return list
  }, [staff, activeOnly, states, roles])

  if (staffLoading) return <PageLoader />

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Toggle checked={activeOnly} onChange={setActiveOnly} label="Active only" />
        <div className="h-5 w-px bg-gray-200" />
        <MultiSelect
          options={[
            { value: 'NSW', label: 'NSW' },
            { value: 'VIC', label: 'VIC' },
          ]}
          value={states}
          onChange={setStates}
          placeholder="All states"
        />
        <MultiSelect
          options={roleOptions}
          value={roles}
          onChange={setRoles}
          placeholder="All roles"
        />
        {(states.length > 0 || roles.length > 0) && (
          <button
            onClick={() => { setStates([]); setRoles([]) }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} coaches</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No coaches found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filtered.map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              weekLeave={leaveByCoach[coach.id] ?? []}
              sessionCount={sessionCountMap[coach.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
