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
  isOngoing?: boolean
  numWeeks?: number
  originalCoachId?: string
  sessionDetails?: {
    gym: string
    day_name: string
    session_time: string
    session_type_id: string
    flow_label: string
    session_date: string
  }
}

export function useSwapCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SwapCoachPayload) => {
      // 1. Swap the current assignment
      const { data, error } = await supabase
        .from('schedule_session_coaches')
        .update({ coach_id: payload.newCoachId })
        .eq('id', payload.assignmentId)
        .select('*, coach:staff_database(*)')
        .single()
      if (error) throw error

      // 2. If it's ongoing, update future sessions
      if (payload.isOngoing && payload.sessionDetails && payload.originalCoachId) {
        const { gym, day_name, session_time, session_type_id, flow_label, session_date } = payload.sessionDetails
        
        let query = supabase
          .from('schedule_sessions')
          .select('id, session_date')
          .eq('gym', gym)
          .eq('day_name', day_name)
          .eq('session_time', session_time)
          .eq('session_type_id', session_type_id)
          .eq('flow_label', flow_label)
          .gt('session_date', session_date)
          .order('session_date', { ascending: true })
          
        if (payload.numWeeks) {
           query = query.limit(payload.numWeeks)
        }
        
        const { data: futureSessions, error: fsError } = await query
        if (fsError) throw fsError
        
        if (futureSessions && futureSessions.length > 0) {
          const sessionIds = futureSessions.map(s => s.id)
          
          const { error: updateError } = await supabase
            .from('schedule_session_coaches')
            .update({ coach_id: payload.newCoachId })
            .in('session_id', sessionIds)
            .eq('coach_id', payload.originalCoachId)
            
          if (updateError) throw updateError
        }
      }

      return data
    },
    onSuccess: (_, variables) => {
      if (variables.isOngoing) {
        queryClient.invalidateQueries({ queryKey: ['session-coaches'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['session-coaches', variables.weekStart] })
      }
    },
  })
}
