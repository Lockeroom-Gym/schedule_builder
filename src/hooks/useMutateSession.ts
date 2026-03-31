import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DayName, GymName, SessionStatus } from '../types/database'
import { getSessionDateForDay } from '../lib/dateUtils'

interface CreateSessionPayload {
  weekStart: string
  periodId: string | null
  dayName: DayName
  sessionTime: string
  sessionTypeId: string
  gym: GymName
  isPeak: boolean
  status?: SessionStatus
  createdBy?: string
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSessionPayload) => {
      const sessionDate = getSessionDateForDay(payload.weekStart, payload.dayName)
      const { data, error } = await supabase
        .from('schedule_sessions')
        .insert({
          period_id: payload.periodId,
          week_start: payload.weekStart,
          day_name: payload.dayName,
          session_date: sessionDate,
          session_time: payload.sessionTime,
          session_type_id: payload.sessionTypeId,
          gym: payload.gym,
          is_peak: payload.isPeak,
          status: payload.status ?? 'proposed',
          created_by: payload.createdBy ?? null,
        })
        .select('*, session_type:system_session_types(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-sessions', variables.weekStart] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string; weekStart: string }) => {
      const { error } = await supabase
        .from('schedule_sessions')
        .delete()
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-sessions', variables.weekStart] })
      queryClient.invalidateQueries({ queryKey: ['session-coaches', variables.weekStart] })
    },
  })
}

export function useUpdateSessionFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      flowLabel,
    }: {
      sessionId: string
      flowLabel: string
      weekStart: string
    }) => {
      const { error } = await supabase
        .from('schedule_sessions')
        .update({ flow_label: flowLabel })
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-sessions', variables.weekStart] })
    },
  })
}
