import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { SchedulePage } from './pages/SchedulePage'
import { PreferencesPage } from './pages/PreferencesPage'
import { CoachesPage } from './pages/CoachesPage'
import { useSchedulePeriods } from './hooks/useSchedulePeriods'

export default function AppRoutes() {
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const { data: periods } = useSchedulePeriods()

  useEffect(() => {
    if (periods?.length && !selectedPeriodId) {
      const now = new Date().toISOString().split('T')[0]
      const upcoming = periods.find((p) => p.week_start >= now) ?? periods[0]
      if (upcoming) setSelectedPeriodId(upcoming.id)
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
