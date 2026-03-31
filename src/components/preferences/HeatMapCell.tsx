export interface HeatMapCoach {
  staffId: string
  coachName: string
  coachColour: string
}

export interface HeatMapCellData {
  preferred: HeatMapCoach[]
  soft: HeatMapCoach[]
  hard: HeatMapCoach[]
}

export type PreferenceType = 'preferred' | 'soft' | 'hard'

interface HeatMapCellProps {
  data: HeatMapCellData
  activeTypes: Set<PreferenceType>
}

// Map preference types to pill Tailwind classes
const PILL_STYLES = {
  preferred: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  soft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200',
}

export function HeatMapCell({ data, activeTypes }: HeatMapCellProps) {
  // We only show types that have coaches AND are active
  const segments = (['preferred', 'soft', 'hard'] as PreferenceType[]).filter(
    (type) => activeTypes.has(type) && data[type].length > 0
  )

  if (segments.length === 0) {
    return (
      <div 
        className="w-full h-full min-h-[60px] flex flex-col items-center justify-center p-1 rounded-md border border-dashed border-gray-200"
      >
        <span className="text-[10px] text-gray-400 select-none">No prefs</span>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[60px] flex flex-wrap content-start gap-1.5 p-1">
      {segments.flatMap((type) => {
        const coaches = data[type]
        const styleClass = PILL_STYLES[type]
        
        return coaches.map((coach) => (
          <div
            key={`${type}-${coach.staffId}`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium ${styleClass}`}
            title={`${coach.coachName} (${type})`}
          >
            <div
              className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
              style={{ backgroundColor: coach.coachColour }}
            />
            <span className="truncate max-w-[80px]">
              {coach.coachName}
            </span>
          </div>
        ))
      })}
    </div>
  )
}
