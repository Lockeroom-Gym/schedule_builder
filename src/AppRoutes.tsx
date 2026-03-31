import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { SchedulePage } from './pages/SchedulePage'
import { PreferencesPage } from './pages/PreferencesPage'
import { CoachesPage } from './pages/CoachesPage'
import { useSchedulePeriods } from './hooks/useSchedulePeriods'
import { getPeriodPhase, formatWeekStartKey } from './lib/dateUtils'

export default function AppRoutes() {
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const { data: periods } = useSchedulePeriods()

  useEffect(() => {
    if (periods?.length && !selectedPeriodId) {
      const currentWeekStart = formatWeekStartKey(new Date())
      // Default to the current week if it exists, otherwise the first available upcoming week
      const defaultPeriod = periods.find((p) => p.week_start === currentWeekStart) 
        ?? periods.find((p) => p.week_start > currentWeekStart) 
        ?? periods[0]
        
      if (defaultPeriod) setSelectedPeriodId(defaultPeriod.id)
    }
  }, [periods, selectedPeriodId])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppShell
              selectedPeriodId={selectedPeriodId}
              onPeriodChange={setSelectedPeriodId}
            />
          }
        >
          <Route index element={<Navigate to="/schedule" replace />} />
          <Route
            path="/schedule"
            element={
              <SchedulePage
                selectedPeriodId={selectedPeriodId}
                onPeriodChange={setSelectedPeriodId}
              />
            }
          />
          <Route
            path="/preferences"
            element={<PreferencesPage selectedPeriodId={selectedPeriodId} />}
          />
          <Route path="/coaches" element={<CoachesPage selectedPeriodId={selectedPeriodId} />} />
          <Route path="*" element={<Navigate to="/schedule" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
