import type { StaffMember, StaffLeave } from '../../types/database'
import { Badge } from '../ui/Badge'
import { LEAVE_TYPE_LABELS } from '../../lib/constants'

interface CoachCardProps {
  coach: StaffMember
  weekLeave: StaffLeave[]
  sessionCount?: number
}

export function CoachCard({ coach, weekLeave, sessionCount }: CoachCardProps) {
  const colour = coach.rgb_colour ?? '#6366f1'
  const isOnLeave = weekLeave.length > 0
  const leaveLabel = isOnLeave
    ? LEAVE_TYPE_LABELS[weekLeave[0].leave_type] ?? 'On Leave'
    : null

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative overflow-hidden"
      style={{ borderLeftColor: colour, borderLeftWidth: 4 }}
    >
      {isOnLeave && (
        <div className="absolute top-3 right-3">
          <Badge variant="red" size="xs">{leaveLabel}</Badge>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{ backgroundColor: colour }}
        >
          {coach.first_name?.[0]}{coach.last_name?.[0]}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{coach.coach_name}</h3>
          <p className="text-xs text-gray-500 truncate">{coach.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
        <div>
          <p className="text-gray-400 uppercase tracking-wide font-medium text-[10px] mb-0.5">State</p>
          <Badge variant={coach.state === 'NSW' ? 'blue' : 'purple'} size="xs">
            {coach.state ?? '—'}
          </Badge>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wide font-medium text-[10px] mb-0.5">Type</p>
          <span className="text-gray-700 font-medium">{coach.employment_type ?? '—'}</span>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wide font-medium text-[10px] mb-0.5">Home Gym</p>
          <span className="text-gray-700 font-medium">{coach.home_gym ?? '—'}</span>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wide font-medium text-[10px] mb-0.5">Sessions</p>
          <span className="text-gray-700 font-medium">
            {sessionCount ?? 0}
            {coach.rm_ceiling != null && (
              <span className="text-gray-400"> / {coach.rm_ceiling}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
