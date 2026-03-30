import { useMemo } from 'react'
import { usePreferences, useCoachCompliance } from '../hooks/usePreferences'
import { useStaff } from '../hooks/useStaff'
import { useSchedulePeriods } from '../hooks/useSchedulePeriods'
import { PreferenceTable } from '../components/preferences/PreferenceTable'
import { ComplianceCard } from '../components/preferences/ComplianceCard'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { getPeriodPhase } from '../lib/dateUtils'

interface PreferencesPageProps {
  selectedPeriodId: string
}

export function PreferencesPage({ selectedPeriodId }: PreferencesPageProps) {
  const { data: periods } = useSchedulePeriods()
  const { data: preferences, isLoading: prefsLoading } = usePreferences(selectedPeriodId || null)
  const { data: compliance, isLoading: complianceLoading } = useCoachCompliance(selectedPeriodId || null)
  const { data: staff = [] } = useStaff(false)

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId)
  const isLocked = selectedPeriod ? getPeriodPhase(selectedPeriod.week_start) !== 'draft' : false

  const staffMap = useMemo(() => {
    const m: Record<string, { name: string | null; colour: string | null }> = {}
    for (const s of staff) m[s.id] = { name: s.coach_name, colour: s.rgb_colour }
    return m
  }, [staff])

  if (prefsLoading || complianceLoading) return <PageLoader />

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto">
      <div className="px-6 pt-6 pb-2">
        <h1 className="font-bold text-2xl text-gray-900">Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">Coach preference submissions and compliance</p>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {/* 6-week lock banner */}
        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Submission window closed</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Preferences can only be submitted for periods starting 6+ weeks from today. This period is within the locked window.
              </p>
            </div>
          </div>
        )}

        {/* Compliance cards */}
        {compliance && compliance.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Compliance Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {compliance.map((c) => (
                <ComplianceCard
                  key={c.staff_id}
                  compliance={c}
                  coachName={staffMap[c.staff_id]?.name ?? c.staff_id}
                  coachColour={staffMap[c.staff_id]?.colour}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preference table */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Preference Submissions
          </h2>
          {!selectedPeriodId ? (
            <EmptyState
              title="No period selected"
              description="Select a period from the dropdown in the header to view preferences."
            />
          ) : (
            <PreferenceTable preferences={preferences ?? []} staff={staff} />
          )}
        </div>
      </div>
    </div>
  )
}
