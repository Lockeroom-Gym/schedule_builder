import { MultiSelect } from '../ui/MultiSelect'
import { GYMS } from '../../lib/constants'
import type { SystemSessionType } from '../../types/database'

interface FilterBarProps {
  selectedGyms: string[]
  onGymsChange: (v: string[]) => void
  selectedSessionTypes: string[]
  onSessionTypesChange: (v: string[]) => void
  sessionTypes: SystemSessionType[]
}

export function FilterBar({
  selectedGyms,
  onGymsChange,
  selectedSessionTypes,
  onSessionTypesChange,
  sessionTypes,
}: FilterBarProps) {
  const gymOptions = GYMS.map((g) => ({ value: g.key, label: g.label }))
  const typeOptions = sessionTypes.map((st) => ({
    value: st.id,
    label: st.label,
    color: st.color_hex,
  }))

  const hasFilters = selectedGyms.length > 0 || selectedSessionTypes.length > 0

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-gray-500 font-medium">Filter:</span>
      <MultiSelect
        options={gymOptions}
        value={selectedGyms}
        onChange={onGymsChange}
        placeholder="All gyms"
      />
      <MultiSelect
        options={typeOptions}
        value={selectedSessionTypes}
        onChange={onSessionTypesChange}
        placeholder="All types"
      />
      {hasFilters && (
        <button
          onClick={() => {
            onGymsChange([])
            onSessionTypesChange([])
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
