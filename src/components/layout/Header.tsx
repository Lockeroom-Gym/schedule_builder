import { NavLink } from 'react-router-dom'
import { useSchedulePeriods } from '../../hooks/useSchedulePeriods'
import type { SchedulePeriodEffective } from '../../types/database'
import { formatDateShort } from '../../lib/dateUtils'

interface HeaderProps {
  selectedPeriodId: string
  onPeriodChange: (id: string) => void
}

export function Header({ selectedPeriodId, onPeriodChange }: HeaderProps) {
  const { data: periods } = useSchedulePeriods()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-0 flex items-center gap-6 h-14 sticky top-0 z-40">
      {/* Logo / App name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-sm">Lockeroom Schedule</span>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1 justify-center">
        {[
          { to: '/schedule', label: 'Schedule' },
          { to: '/preferences', label: 'Preferences' },
          { to: '/coaches', label: 'Coaches' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400 font-medium">Period</span>
        <select
          value={selectedPeriodId}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 max-w-[220px]"
        >
          {!periods?.length && <option value="">Loading periods...</option>}
          {periods?.map((p: SchedulePeriodEffective) => (
            <option key={p.id} value={p.id}>
              {p.label} ({formatDateShort(p.week_start)})
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
