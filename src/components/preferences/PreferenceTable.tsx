import { useState, useMemo } from 'react'
import type { SchedulePreference, StaffMember } from '../../types/database'
import { Badge } from '../ui/Badge'

interface PreferenceTableProps {
  preferences: SchedulePreference[]
  staff: StaffMember[]
}

const prefTypeVariant = {
  preferred: 'emerald' as const,
  soft: 'amber' as const,
  hard: 'red' as const,
}

export function PreferenceTable({ preferences, staff }: PreferenceTableProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const staffMap = useMemo(() => {
    const m: Record<string, StaffMember> = {}
    for (const s of staff) m[s.id] = s
    return m
  }, [staff])

  const filtered = useMemo(() => {
    let list = preferences
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.coach_name.toLowerCase().includes(q))
    }
    if (typeFilter !== 'all') {
      list = list.filter((p) => p.preference_type === typeFilter)
    }
    return list
  }, [preferences, search, typeFilter])

  return (
    <div>
      {/* Table filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search coach..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48"
        />
        <div className="flex items-center gap-1">
          {(['all', 'preferred', 'soft', 'hard'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                typeFilter === type
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} entries</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Coach', 'Block', 'Type', 'Rank', 'Status', 'Valid', 'Submitted'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-gray-400">
                    No preferences found
                  </td>
                </tr>
              )}
              {filtered.map((pref) => {
                const coachData = staffMap[pref.staff_id]
                const colour = coachData?.rgb_colour ?? '#6366f1'
                const variant = prefTypeVariant[pref.preference_type] ?? 'default'

                return (
                  <tr key={pref.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colour }}
                        />
                        <span className="text-sm text-gray-800 font-medium">{pref.coach_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{pref.block}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={variant} size="xs">
                        {pref.preference_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{pref.rank ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{pref.status ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      {pref.valid ? (
                        <Badge variant={pref.valid === 'valid' ? 'emerald' : 'red'} size="xs">
                          {pref.valid}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
                      {pref.submitted_at
                        ? new Date(pref.submitted_at).toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
