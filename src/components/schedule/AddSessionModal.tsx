import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { useCreateSession } from '../../hooks/useMutateSession'
import type { SystemSessionType } from '../../types/database'
import type { DayName, GymName } from '../../types/database'
import { DAYS_OF_WEEK, GYMS, SESSION_TIME_OPTIONS } from '../../lib/constants'

interface AddSessionModalProps {
  isOpen: boolean
  onClose: () => void
  weekStart: string
  periodId: string | null
  sessionTypes: SystemSessionType[]
  defaultDay?: DayName
  defaultGym?: GymName
}

export function AddSessionModal({
  isOpen,
  onClose,
  weekStart,
  periodId,
  sessionTypes,
  defaultDay,
  defaultGym,
}: AddSessionModalProps) {
  const [dayName, setDayName] = useState<DayName>(defaultDay ?? 'MON')
  const [sessionTime, setSessionTime] = useState('05:30')
  const [sessionTypeId, setSessionTypeId] = useState(sessionTypes[0]?.id ?? '')

  useEffect(() => {
    if (!sessionTypeId && sessionTypes.length > 0) {
      setSessionTypeId(sessionTypes[0].id)
    }
  }, [sessionTypes, sessionTypeId])
  const [gym, setGym] = useState<GymName>(defaultGym ?? 'BLIGH')
  const [isPeak, setIsPeak] = useState(true)
  const [status, setStatus] = useState<'proposed' | 'final'>('proposed')

  const createSession = useCreateSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionTypeId) return
    await createSession.mutateAsync({
      weekStart,
      periodId,
      dayName,
      sessionTime,
      sessionTypeId,
      gym,
      isPeak,
      status,
    })
    onClose()
  }

  const inputClass =
    'border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full text-gray-700'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
            <select
              value={dayName}
              onChange={(e) => setDayName(e.target.value as DayName)}
              className={inputClass}
            >
              {DAYS_OF_WEEK.slice(0, 6).map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
            <select
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              className={inputClass}
            >
              {SESSION_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Session Type</label>
            <select
              value={sessionTypeId}
              onChange={(e) => setSessionTypeId(e.target.value)}
              className={inputClass}
            >
              {sessionTypes.map((st) => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gym</label>
            <select
              value={gym}
              onChange={(e) => setGym(e.target.value as GymName)}
              className={inputClass}
            >
              {GYMS.map((g) => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'proposed' | 'final')}
              className={inputClass}
            >
              <option value="proposed">Draft / Proposed</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPeak}
                onChange={(e) => setIsPeak(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Peak session</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createSession.isPending || !sessionTypeId || sessionTypes.length === 0}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createSession.isPending ? 'Adding...' : 'Add Session'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
