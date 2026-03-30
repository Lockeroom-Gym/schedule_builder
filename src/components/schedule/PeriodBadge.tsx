import { Badge } from '../ui/Badge'
import type { PeriodPhase } from '../../types/schedule'

interface PeriodBadgeProps {
  phase: PeriodPhase
  isLocked: boolean
}

const phaseConfig: Record<PeriodPhase, { label: string; variant: 'green' | 'blue' | 'amber' | 'red' }> = {
  draft: { label: 'Draft Window', variant: 'amber' },
  live: { label: 'Live (Booking Open)', variant: 'green' },
  locked: { label: 'Locked', variant: 'red' },
}

export function PeriodBadge({ phase, isLocked }: PeriodBadgeProps) {
  if (isLocked) {
    return (
      <Badge variant="red">
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Locked
      </Badge>
    )
  }
  const config = phaseConfig[phase]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
