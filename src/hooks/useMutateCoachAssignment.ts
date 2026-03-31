import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface AssignCoachPayload {
  sessionId: string
  coachId: string
  slotOrder: number
  assignedBy?: string
  weekStart: string
}

interface RemoveCoachPayload {
  assignmentId: string
  weekStart: string
}

export function useAssignCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AssignCoachPayload) => {
      const { data, error } = await supabase
        .from('schedule_session_coaches')
        .insert({
          session_id: payload.sessionId,
          coach_id: payload.coachId,
          slot_order: payload.slotOrder,
          assigned_by: payload.assignedBy ?? null,
        })
        .select('*, coach:staff_database(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-coaches', variables.weekStart] })
    },
  })
}

export function useRemoveCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RemoveCoachPayload) => {
      const { error } = await supabase
        .from('schedule_session_coaches')
        .delete()
        .eq('id', payload.assignmentId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-coaches', variables.weekStart] })
    },
  })
}

interface SwapCoachPayload {
  assignmentId: string
  newCoachId: string
  weekStart: string
}

export function useSwapCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SwapCoachPayload) => {
      const { data, error } = await supabase
        .from('schedule_session_coaches')
        .update({ coach_id: payload.newCoachId })
        .eq('id', payload.assignmentId)
        .select('*, coach:staff_database(*)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-coaches', variables.weekStart] })
    },
  })
}
