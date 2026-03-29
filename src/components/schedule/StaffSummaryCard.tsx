import type { CoachSessionCount } from '../../types/schedule'

interface StaffSummaryCardProps {
  data: CoachSessionCount
  isOnLeave: boolean
}

export function StaffSummaryCard({ data, isOnLeave }: StaffSummaryCardProps) {
  const colour = data.rgbColour ?? '#6366f1'
  const deltaPositive = data.delta !== null && data.delta >= 0
  const deltaLabel = data.delta !== null
    ? `${data.delta >= 0 ? '+' : ''}${data.delta}`
    : null

  return (
    <div
      className="flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5 w-[110px] relative"
      style={{ borderTopColor: colour, borderTopWidth: 3 }}
    >
      {isOnLeave && (
        <div
          className="absolute inset-0 rounded-xl opacity-10 pointer-events-none"
          style={{ backgroundColor: '#ef4444' }}
        />
      )}

      {/* Session count */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-lg font-bold text-gray-900 leading-none">{data.count}</span>
        {data.target != null && (
          <span className="text-xs text-gray-400">/{data.target}</span>
        )}
        {deltaLabel && (
          <span
            className={`text-xs font-medium ml-auto ${
              deltaPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {deltaLabel}
          </span>
        )}
      </div>

      {/* Coach name */}
      <p
        className="text-xs font-semibold truncate leading-tight"
        style={{ color: colour }}
        title={data.coachName ?? undefined}
      >
        {data.coachName ?? '—'}
      </p>

      {/* Role + bracket warning */}
      <div className="flex items-center gap-1 mt-0.5">
        <p className="text-[10px] text-gray-400 truncate flex-1">{data.role}</p>
        {data.hasWarning && (
          <span
            title={`Outside bracket ${data.bracketMin}–${data.bracketMax}`}
            className="text-amber-500 flex-shrink-0"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        )}
        {isOnLeave && (
          <span className="text-[10px] text-red-400 font-medium flex-shrink-0">Leave</span>
        )}
      </div>
    </div>
  )
}
