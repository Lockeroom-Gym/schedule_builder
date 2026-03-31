import { useState, useRef, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import type { SchedulePeriodEffective } from '../../types/database'
import { getPeriodPhase } from '../../lib/dateUtils'

interface CalendarDropdownProps {
  periods: SchedulePeriodEffective[]
  selectedPeriodId: string
  onPeriodChange: (id: string) => void
  children: React.ReactNode
}

export function CalendarDropdown({
  periods,
  selectedPeriodId,
  onPeriodChange,
  children,
}: CalendarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId)
  const initialMonth = selectedPeriod ? parseISO(selectedPeriod.week_start) : new Date()
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfMonth(initialMonth))

  // Sync display month when selected period changes externally
  useEffect(() => {
    if (selectedPeriod) {
      setDisplayMonth(startOfMonth(parseISO(selectedPeriod.week_start)))
    }
  }, [selectedPeriodId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  // Build a set of valid week_starts for fast lookup
  const periodByWeekStart = new Map<string, SchedulePeriodEffective>()
  for (const p of periods) {
    periodByWeekStart.set(p.week_start, p)
  }

  // Find the period that contains a given date (any day of that week)
  const getPeriodForDate = (date: Date): SchedulePeriodEffective | null => {
    for (const p of periods) {
      const ws = parseISO(p.week_start)
      const we = parseISO(p.week_end)
      if (isWithinInterval(date, { start: ws, end: we })) return p
    }
    return null
  }

  // Calendar grid: build weeks for the display month
  const monthStart = startOfMonth(displayMonth)
  const monthEnd = endOfMonth(displayMonth)
  // Expand to full Mon–Sun grid rows
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Chunk into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  // The following was unused but keeping the logic in case it's needed later
  // const handleDayClick = (date: Date) => {
  //   const period = getPeriodForDate(date)
  //   if (!period) return
  //   const phase = getPeriodPhase(period.week_start)
  //   if (period.is_locked || phase === 'locked') return
  //   onPeriodChange(period.id)
  //   setIsOpen(false)
  // }

  const getDayStyle = (date: Date): {
    inCurrentMonth: boolean
    period: SchedulePeriodEffective | null
    isSelected: boolean
    isLocked: boolean
  } => {
    const period = getPeriodForDate(date)
    const phase = period ? getPeriodPhase(period.week_start) : null
    const isLocked = !period || period.is_locked || phase === 'locked'
    const isSelected = !!period && period.id === selectedPeriodId
    return {
      inCurrentMonth: isSameMonth(date, displayMonth),
      period,
      isSelected,
      isLocked,
    }
  }

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
        aria-expanded={isOpen}
      >
        {children}
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ width: 280 }}
        >
          {/* Month navigation header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <button
              onClick={() => setDisplayMonth((m) => subMonths(m, 1))}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {format(displayMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week header row */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          <div className="py-1">
            {weeks.map((week, wi) => {
              // Check if this week row corresponds to a selected period
              const weekMonday = week[0]
              const mondayStr = format(weekMonday, 'yyyy-MM-dd')
              const weekPeriod = periodByWeekStart.get(mondayStr)
              const isWeekSelected = weekPeriod?.id === selectedPeriodId
              const weekPhase = weekPeriod ? getPeriodPhase(weekPeriod.week_start) : null
              const weekLocked = !weekPeriod || weekPeriod.is_locked || weekPhase === 'locked'

              return (
                <div
                  key={wi}
                  className={`grid grid-cols-7 ${
                    isWeekSelected
                      ? 'bg-blue-50 rounded-lg mx-1'
                      : weekPeriod && !weekLocked
                      ? 'hover:bg-gray-50 rounded-lg mx-1 cursor-pointer'
                      : ''
                  }`}
                  onClick={() => {
                    if (weekPeriod && !weekLocked) {
                      onPeriodChange(weekPeriod.id)
                      setIsOpen(false)
                    }
                  }}
                >
                  {week.map((date, di) => {
                    const { inCurrentMonth, period, isSelected, isLocked } = getDayStyle(date)
                    const isWeekend = di >= 5
                    return (
                      <div
                        key={di}
                        className={`
                          flex items-center justify-center h-8 text-xs
                          ${!period ? 'text-gray-300' : ''}
                          ${period && isLocked && !isSelected ? 'text-gray-400' : ''}
                          ${period && !isLocked && !isSelected ? (inCurrentMonth ? 'text-gray-700 font-medium' : 'text-gray-400') : ''}
                          ${isSelected ? 'text-blue-700 font-semibold' : ''}
                          ${isWeekend && period && !isLocked ? 'text-indigo-500' : ''}
                        `}
                      >
                        <span
                          className={`
                            w-7 h-7 flex items-center justify-center rounded-full
                            ${isSelected && di === 0 ? 'bg-blue-600 text-white font-bold' : ''}
                          `}
                        >
                          {format(date, 'd')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-[10px] text-gray-500">Selected week</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span className="text-[10px] text-gray-500">Locked / no period</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
