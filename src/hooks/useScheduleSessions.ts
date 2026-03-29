import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ScheduleSession, ScheduleSessionCoach } from '../types/database'
import type { SessionWithCoaches } from '../types/schedule'

export function useScheduleSessions(weekStart: string | null) {
  return useQuery({
    queryKey: ['schedule-sessions', weekStart],
    queryFn: async (): Promise<ScheduleSession[]> => {
      if (!weekStart) return []
      const { data, error } = await supabase
        .from('schedule_sessions')
        .select('*, session_type:system_session_types(*)')
        .eq('week_start', weekStart)
        .order('session_date')
        .order('session_time')
      if (error) throw error
      return data ?? []
    },
    enabled: !!weekStart,
    staleTime: 30 * 1000,
  })
}

export function useSessionCoaches(weekStart: string | null) {
  return useQuery({
    queryKey: ['session-coaches', weekStart],
    queryFn: async (): Promise<ScheduleSessionCoach[]> => {
      if (!weekStart) return []
      const sessionsRes = await supabase
        .from('schedule_sessions')
        .select('id')
        .eq('week_start', weekStart)
      if (sessionsRes.error) throw sessionsRes.error
      const sessionIds = (sessionsRes.data ?? []).map((s) => s.id)
      if (sessionIds.length === 0) return []
      const { data, error } = await supabase
        .from('schedule_session_coaches')
        .select(`*, coach:staff_database(*)`)
        .in('session_id', sessionIds)
        .order('slot_order')
      if (error) throw error
      return data ?? []
    },
    enabled: !!weekStart,
    staleTime: 30 * 1000,
  })
}

export function useSessionsWithCoaches(weekStart: string | null): {
  data: SessionWithCoaches[] | undefined
  isLoading: boolean
  error: Error | null
} {
  const sessionsQuery = useScheduleSessions(weekStart)
  const coachesQuery = useSessionCoaches(weekStart)

  const isLoading = sessionsQuery.isLoading || coachesQuery.isLoading
  const error = (sessionsQuery.error ?? coachesQuery.error) as Error | null

  if (!sessionsQuery.data || !coachesQuery.data) {
    return { data: undefined, isLoading, error }
  }

  const coachesBySession: Record<string, ScheduleSessionCoach[]> = {}
  for (const sc of coachesQuery.data) {
    if (!coachesBySession[sc.session_id]) coachesBySession[sc.session_id] = []
    coachesBySession[sc.session_id].push(sc)
  }

  const sessions: SessionWithCoaches[] = sessionsQuery.data.map((session) => {
    const coaches = (coachesBySession[session.id] ?? []) as any[]
    const sessionType = (session as any).session_type
    const coachCount = coaches.length
    const clientsPerCoach = sessionType?.clients_per_coach ?? 1
    return {
      ...session,
      coaches,
      session_type: sessionType,
      total_spots: coachCount * clientsPerCoach,
    }
  })

  return { data: sessions, isLoading, error }
}
