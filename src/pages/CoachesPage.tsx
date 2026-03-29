import { CoachGrid } from '../components/coaches/CoachGrid'

interface CoachesPageProps {
  selectedPeriodId: string
}

export function CoachesPage({ selectedPeriodId }: CoachesPageProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-2">
        <h1 className="font-bold text-2xl text-gray-900">Coaches</h1>
        <p className="text-sm text-gray-500 mt-1">Active staff roster and weekly session overview</p>
      </div>
      <CoachGrid selectedPeriodId={selectedPeriodId} />
    </div>
  )
}
