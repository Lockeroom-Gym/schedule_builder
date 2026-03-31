import { useState } from 'react'

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
  maxCounts: Record<PreferenceType, number>
}

// Matches schedule grid block highlight colors
const BASE_COLORS = {
  preferred: { r: 167, g: 243, b: 208 }, // emerald-200
  soft: { r: 254, g: 240, b: 138 },      // yellow-200
  hard: { r: 254, g: 202, b: 202 },      // red-200
}

export function HeatMapCell({ data, activeTypes, maxCounts }: HeatMapCellProps) {
  // We only show types that have coaches AND are active
  const segments = (['preferred', 'soft', 'hard'] as PreferenceType[]).filter(
    (type) => activeTypes.has(type) && data[type].length > 0
  )

  const [isHovered, setIsHovered] = useState(false)

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
    <div 
      className="w-full h-full min-h-[60px] flex flex-col gap-1 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {segments.map((type) => {
        const coaches = data[type]
        const count = coaches.length
        const max = maxCounts[type] || 1
        
        // Scale opacity from 0.2 to 0.85 based on count relative to max
        const opacity = Math.max(0.2, Math.min(0.85, (count / max) * 0.85))
        const { r, g, b } = BASE_COLORS[type]
        const bgStyle = { backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` }
        
        // When there is only 1 segment, we let it expand to fill the available space.
        const flexClass = segments.length === 1 ? 'flex-1' : 'flex-1 min-h-[28px]'

        return (
          <div
            key={type}
            className={`${flexClass} rounded-md border border-gray-100/50 flex flex-col justify-center px-1.5 py-1 cursor-default transition-all duration-200 hover:brightness-95`}
            style={bgStyle}
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold text-gray-700 capitalize leading-none">
                {type === 'preferred' ? 'Pref' : type}
              </span>
              <span className="text-[11px] font-bold text-gray-900 leading-none">
                {count}
              </span>
            </div>
            
            <div className="flex items-center gap-0.5 mt-1 flex-wrap">
              {coaches.slice(0, 6).map((coach) => (
                <div
                  key={coach.staffId}
                  className="w-2.5 h-2.5 rounded-full shadow-sm border border-black/5"
                  style={{ backgroundColor: coach.coachColour }}
                  title={coach.coachName}
                />
              ))}
              {count > 6 && (
                <span className="text-[9px] font-bold text-gray-700 ml-0.5 leading-none">
                  +{count - 6}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[60] w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-3 pointer-events-none">
          {segments.map(type => {
            const coaches = data[type]
            if (coaches.length === 0) return null
            return (
              <div key={type} className="mb-3 last:mb-0">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">
                  {type} ({coaches.length})
                </h4>
                <ul className="space-y-1.5">
                  {coaches.map(coach => (
                    <li key={coach.staffId} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: coach.coachColour }}
                      />
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {coach.coachName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
