import { Outlet } from 'react-router-dom'
import { Header } from './Header'

interface AppShellProps {
  selectedPeriodId: string
  onPeriodChange: (id: string) => void
}

export function AppShell({ selectedPeriodId, onPeriodChange }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header selectedPeriodId={selectedPeriodId} onPeriodChange={onPeriodChange} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
