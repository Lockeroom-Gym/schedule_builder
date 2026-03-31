import { useState, useMemo, useEffect } from 'react'
import { parseISO, format } from 'date-fns'
import { Modal } from '../ui/Modal'
import { useCopySchedule } from '../../hooks/useCopySchedule'
import { formatWeekLabel } from '../../lib/dateUtils'
import type { SchedulePeriodEffective } from '../../types/database'

type CopyMode = 'single' | 'multiple' | 'cycle-end'

interface CopyScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  sourceWeekStart: string
  periods: SchedulePeriodEffective[]
}

export function CopyScheduleModal({
  isOpen,
  onClose,
  sourceWeekStart,
  periods,
}: CopyScheduleModalProps) {
  const [mode, setMode] = useState<CopyMode>('single')
  const [startPeriodId, setStartPeriodId] = useState<string>('')
  const [weekCount, setWeekCount] = useState<number>(2)
  const [isDone, setIsDone] = useState(false)
  const [result, setResult] = useState<{ weeks: number; sessions: number } | null>(null)

  const { copySchedule, isPending, error, reset } = useCopySchedule()

  // Future periods only (week_start > sourceWeekStart), sorted ascending
  const futurePeriods = useMemo(() => {
    return [...periods]
      .filter((p) => p.week_start > sourceWeekStart)
      .sort((a, b) => (a.week_start > b.week_start ? 1 : -1))
  }, [periods, sourceWeekStart])

  // Initialize startPeriodId when modal opens or futurePeriods changes
  useEffect(() => {
    if (isOpen && !startPeriodId && futurePeriods.length > 0) {
      setStartPeriodId(futurePeriods[0].id)
    }
  }, [isOpen, futurePeriods, startPeriodId])

  // Reset state when closed
  const handleClose = () => {
    setMode('single')
    setStartPeriodId('')
    setWeekCount(2)
    setIsDone(false)
    setResult(null)
    reset()
    onClose()
  }

  // Calculate available future periods from the selected start period
  const validFuturePeriods = useMemo(() => {
    if (!startPeriodId) return []
    const startIndex = futurePeriods.findIndex((p) => p.id === startPeriodId)
    if (startIndex === -1) return []
    return futurePeriods.slice(startIndex)
  }, [startPeriodId, futurePeriods])

  const maxAvailableWeeks = validFuturePeriods.length

  // Compute the target week_starts based on the selected mode
  const targetWeekStarts = useMemo((): string[] => {
    if (validFuturePeriods.length === 0) return []

    if (mode === 'single') {
      return [validFuturePeriods[0].week_start]
    }
    if (mode === 'multiple') {
      return validFuturePeriods.slice(0, weekCount).map((p) => p.week_start)
    }
    if (mode === 'cycle-end') {
      return validFuturePeriods.map((p) => p.week_start)
    }
    return []
  }, [mode, validFuturePeriods, weekCount])

  const handleCopy = async () => {
    if (targetWeekStarts.length === 0) return
    try {
      const res = await copySchedule({ sourceWeekStart, targetWeekStarts })
      setResult({ weeks: res.weeks_processed, sessions: res.sessions_copied })
      setIsDone(true)
    } catch {
      // error is surfaced via the `error` state from the hook
    }
  }

  const canConfirm = targetWeekStarts.length > 0 && !isPending

  // Friendly label for a week_start
  const weekLabel = (ws: string) => {
    const d = parseISO(ws)
    return `Week of ${format(d, 'EEE d MMM yyyy')}`
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Copy Schedule to Future Weeks" size="md">
      {isDone && result ? (
        /* ── Success state ── */
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Copy complete</p>
              <p className="text-xs text-green-700 mt-0.5">
                {result.sessions} sessions copied across {result.weeks} {result.weeks === 1 ? 'week' : 'weeks'}.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Source week */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Copying from</p>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-blue-800">{formatWeekLabel(sourceWeekStart)}</span>
            </div>
          </div>

          {/* Start week selection */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Start pasting from</p>
            {futurePeriods.length === 0 ? (
              <p className="text-xs text-amber-600 font-medium">No future weeks available in this cycle.</p>
            ) : (
              <select
                value={startPeriodId}
                onChange={(e) => {
                  setStartPeriodId(e.target.value)
                  // Adjust weekCount if it exceeds the new maxAvailableWeeks
                  const newStartIndex = futurePeriods.findIndex((p) => p.id === e.target.value)
                  const newMax = futurePeriods.length - newStartIndex
                  if (weekCount > newMax) setWeekCount(Math.max(1, newMax))
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-medium"
              >
                {futurePeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {weekLabel(p.week_start)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Copy mode selection */}
          {futurePeriods.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duration</p>
              <div className="space-y-2">
                {/* Single week */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${mode === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    className="mt-0.5 accent-blue-600"
                    checked={mode === 'single'}
                    onChange={() => setMode('single')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Just this week</p>
                    <p className="text-xs text-gray-500 mt-0.5">Copy only to the selected start week.</p>
                  </div>
                </label>

                {/* Multiple weeks */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${mode === 'multiple' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    className="mt-0.5 accent-blue-600"
                    checked={mode === 'multiple'}
                    onChange={() => setMode('multiple')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Set number of weeks</p>
                    <p className="text-xs text-gray-500 mt-0.5">Copy to multiple consecutive weeks.</p>
                    {mode === 'multiple' && (
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => e.preventDefault()}>
                        <input
                          type="number"
                          min={1}
                          max={maxAvailableWeeks}
                          value={weekCount}
                          onChange={(e) => setWeekCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxAvailableWeeks))}
                          className="w-20 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-medium text-center"
                        />
                        <span className="text-xs text-gray-500">of {maxAvailableWeeks} available weeks from start</span>
                      </div>
                    )}
                  </div>
                </label>

                {/* Until end of cycle */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${mode === 'cycle-end' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    className="mt-0.5 accent-blue-600"
                    checked={mode === 'cycle-end'}
                    onChange={() => setMode('cycle-end')}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Until end of cycle</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Copy to all {maxAvailableWeeks} remaining weeks from the start week.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Preview of target weeks */}
          {targetWeekStarts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Target weeks ({targetWeekStarts.length})
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {targetWeekStarts.map((ws) => (
                  <div key={ws} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5">
                    <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {weekLabel(ws)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overwrite warning */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-700">
              <span className="font-semibold">This will overwrite</span> all existing sessions in the selected target weeks. This action cannot be undone.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-xs text-red-700">{(error as Error).message ?? 'An error occurred. Please try again.'}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              disabled={!canConfirm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Copying…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Schedule
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
