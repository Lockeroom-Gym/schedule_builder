import { useSchedulePeriods } from '../hooks/useSchedulePeriods'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { PageLoader } from '../components/ui/LoadingSpinner'

interface SchedulePageProps {
  selectedPeriodId: string
  onPeriodChange: (id: string) => void
}

export function SchedulePage({ selectedPeriodId, onPeriodChange }: SchedulePageProps) {
  const { data: periods, isLoading } = useSchedulePeriods()

  if (isLoading) return <PageLoader />

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <ScheduleGrid
        periods={periods ?? []}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={onPeriodChange}
      />
    </div>
  )
}
