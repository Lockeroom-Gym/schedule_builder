import type { SchedulePeriodEffective } from '../../types/database'
import { formatWeekLabel } from '../../lib/dateUtils'
import { PeriodBadge } from './PeriodBadge'
import type { PeriodPhase } from '../../types/schedule'

interface WeekNavigatorProps {
  periods: SchedulePeriodEffective[]
  selectedPeriodId: string
  onPeriodChange: (id: string) => void
  phase: PeriodPhase
}

export function WeekNavigator({ periods, selectedPeriodId, onPeriodChange, phase }: WeekNavigatorProps) {
  const currentIdx = periods.findIndex((p) => p.id === selectedPeriodId)
  const currentPeriod = periods[currentIdx]

  const canGoPrev = currentIdx < periods.length - 1
  const canGoNext = currentIdx > 0

  const goPrev = () => {
    if (canGoPrev) onPeriodChange(periods[currentIdx + 1].id)
  }
  const goNext = () => {
    if (canGoNext) onPeriodChange(periods[currentIdx - 1].id)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous week"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">
          {currentPeriod ? formatWeekLabel(currentPeriod.week_start) : 'Select a period'}
        </span>
        {currentPeriod && (
          <PeriodBadge phase={phase} isLocked={currentPeriod.is_locked_effective} />
        )}
      </div>

      <button
        onClick={goNext}
        disabled={!canGoNext}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Next week"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
