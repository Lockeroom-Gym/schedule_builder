import { useMemo, useState } from 'react'
import { useScheduleBlocks } from '../../hooks/useScheduleBlocks'
import type { SchedulePreference, StaffMember } from '../../types/database'
import { HeatMapCell } from './HeatMapCell'
import type { HeatMapCellData, PreferenceType } from './HeatMapCell'
import { DAYS_OF_WEEK } from '../../lib/constants'

// We only want Mon-Fri
const WEEK_DAYS = DAYS_OF_WEEK.slice(0, 5)

interface PreferenceHeatMapProps {
  preferences: SchedulePreference[]
  staff: StaffMember[]
}

export function PreferenceHeatMap({ preferences, staff }: PreferenceHeatMapProps) {
  const { data: blocks = [] } = useScheduleBlocks()
  
  // State for toggles
  const [activeTypes, setActiveTypes] = useState<Set<PreferenceType>>(
    new Set(['preferred', 'soft', 'hard'])
  )

  const toggleType = (type: PreferenceType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type) // prevent unselecting all
      } else {
        next.add(type)
      }
      return next
    })
  }

  // Aggregate data
  const { cellDataMap } = useMemo(() => {
    const map: Record<string, HeatMapCellData> = {}
    
    // Initialize map with empty data for all blockIds
    for (const block of blocks) {
      if (WEEK_DAYS.some(d => d.key === block.day_name)) {
        map[block.block_id] = { preferred: [], soft: [], hard: [] }
      }
    }

    const staffMap = staff.reduce((acc, s) => {
      acc[s.id] = s
      return acc
    }, {} as Record<string, StaffMember>)

    // Populate data
    for (const pref of preferences) {
      if (!map[pref.block]) {
        map[pref.block] = { preferred: [], soft: [], hard: [] }
      }
      const pType = pref.preference_type.toLowerCase() as PreferenceType
      const s = staffMap[pref.staff_id]
      
      // Safety check: ensure valid preference type
      if (pType !== 'preferred' && pType !== 'soft' && pType !== 'hard') continue

      map[pref.block][pType].push({
        staffId: pref.staff_id,
        coachName: pref.coach_name || 'Unknown',
        coachColour: s?.rgb_colour || '#6366f1'
      })
    }

    return { cellDataMap: map }
  }, [preferences, staff, blocks])

  // Get unique block labels (rows) sorted by start time
  const rowBlocks = useMemo(() => {
    const unique = new Map<string, { label: string; start: string }>()
    for (const b of blocks) {
      if (!unique.has(b.block_label)) {
        unique.set(b.block_label, { label: b.block_label, start: b.block_start })
      }
    }
    return Array.from(unique.values()).sort((a, b) => a.start.localeCompare(b.start))
  }, [blocks])

  if (blocks.length === 0) return null

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px]">
      {/* Controls Bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Layers</span>
        <div className="flex items-center gap-2">
          {([
            { id: 'preferred', label: 'Preferred', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200', inactiveClass: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' },
            { id: 'soft', label: 'Soft Unavail', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200', inactiveClass: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' },
            { id: 'hard', label: 'Hard Unavail', colorClass: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200', inactiveClass: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' },
          ] as const).map(t => {
            const isActive = activeTypes.has(t.id)
            return (
              <button
                key={t.id}
                onClick={() => toggleType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${isActive ? t.colorClass : t.inactiveClass}`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-current opacity-70' : 'bg-gray-300'}`} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative flex flex-col">
        <div className="min-w-[700px] h-full flex flex-col">
          {/* Header Row */}
          <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm flex-shrink-0">
            {/* Top-left empty corner */}
            <div className="w-[80px] flex-shrink-0 border-r border-gray-200 bg-white sticky left-0 z-30" />
            
            {WEEK_DAYS.map(day => (
              <div key={day.key} className="flex-1 min-w-[120px] border-r border-gray-200 p-2.5 text-center bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900">{day.label}</p>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {rowBlocks.map((rowBlock) => (
              <div key={rowBlock.label} className="flex flex-1 border-b border-gray-100 last:border-b-0 min-h-[100px]">
                {/* Y-axis label */}
                <div className="w-[80px] flex-shrink-0 border-r border-gray-200 bg-white sticky left-0 z-10 flex flex-col items-center justify-center p-2">
                  <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wide">
                    {rowBlock.label.toLowerCase()}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 font-medium">
                    {rowBlock.start.substring(0, 5)}
                  </span>
                </div>

                {/* Day Cells */}
                {WEEK_DAYS.map(day => {
                  const blockId = `${day.key}_${rowBlock.label}`
                  const data = cellDataMap[blockId] || { preferred: [], soft: [], hard: [] }
                  
                  return (
                    <div key={blockId} className="flex-1 min-w-[120px] border-r border-gray-100 last:border-r-0 p-1.5 hover:bg-gray-50/50 transition-colors">
                      <HeatMapCell 
                        data={data}
                        activeTypes={activeTypes}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
