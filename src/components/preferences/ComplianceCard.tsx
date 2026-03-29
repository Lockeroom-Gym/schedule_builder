import type { ViewPreferencePolicyCheck } from '../../types/database'
import { Badge } from '../ui/Badge'

interface ComplianceCardProps {
  compliance: ViewPreferencePolicyCheck
  coachName: string | null
  coachColour?: string | null
}

export function ComplianceCard({ compliance, coachName, coachColour }: ComplianceCardProps) {
  const colour = coachColour ?? '#6366f1'

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
      style={{ borderLeftColor: colour, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">{coachName}</p>
        <Badge variant={compliance.can_submit ? 'emerald' : 'red'}>
          {compliance.can_submit ? 'Can Submit' : 'Cannot Submit'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-gray-400 mb-0.5">Hard blocks</p>
          <p className={`font-semibold ${compliance.hard_ok ? 'text-gray-700' : 'text-red-500'}`}>
            {Number(compliance.hard_count)} / {compliance.max_hard_blocks ?? '?'}
          </p>
          {!compliance.hard_ok && (
            <p className="text-red-400 text-[10px]">Over by {Number(compliance.hard_over_by)}</p>
          )}
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Soft blocks</p>
          <p className={`font-semibold ${compliance.soft_ok ? 'text-gray-700' : 'text-red-500'}`}>
            {Number(compliance.soft_count)} / {compliance.max_soft_blocks ?? '?'}
          </p>
          {!compliance.soft_ok && (
            <p className="text-red-400 text-[10px]">Over by {Number(compliance.soft_over_by)}</p>
          )}
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Points</p>
          <p className={`font-semibold ${compliance.preferred_ok ? 'text-gray-700' : 'text-amber-500'}`}>
            {compliance.preferred_points?.toFixed(1) ?? '0'} / {compliance.points_target?.toFixed(1) ?? '?'}
          </p>
          {compliance.points_shortfall != null && compliance.points_shortfall > 0 && (
            <p className="text-amber-400 text-[10px]">Short by {compliance.points_shortfall.toFixed(1)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
