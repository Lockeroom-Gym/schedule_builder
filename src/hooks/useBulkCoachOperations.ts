import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface SlotInsert {
  sessionId: string
  slotOrder: number
}

interface BulkAssignParams {
  inserts: SlotInsert[]
  coachId: string
  weekStart: string
}

interface BulkRemoveParams {
  assignmentIds: string[]
  weekStart: string
}

interface BulkSubstituteParams {
  assignmentIds: string[]
  inserts: SlotInsert[]
  newCoachId: string
  weekStart: string
}

export function useBulkCoachOperations() {
  const queryClient = useQueryClient()

  const invalidate = (weekStart: string) => {
    queryClient.invalidateQueries({ queryKey: ['session-coaches', weekStart] })
  }

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ inserts, coachId }: BulkAssignParams) => {
      const rows = inserts.map(({ sessionId, slotOrder }) => ({
        session_id: sessionId,
        coach_id: coachId,
        slot_order: slotOrder,
      }))
      const { error } = await supabase
        .from('schedule_session_coaches')
        .upsert(rows, { onConflict: 'session_id,coach_id' })
      if (error) throw error
    },
    onSuccess: (_, vars) => invalidate(vars.weekStart),
  })

  const bulkRemoveMutation = useMutation({
    mutationFn: async ({ assignmentIds }: BulkRemoveParams) => {
      if (assignmentIds.length === 0) return
      const { error } = await supabase
        .from('schedule_session_coaches')
        .delete()
        .in('id', assignmentIds)
      if (error) throw error
    },
    onSuccess: (_, vars) => invalidate(vars.weekStart),
  })

  const bulkSubstituteMutation = useMutation({
    mutationFn: async ({ assignmentIds, inserts, newCoachId }: BulkSubstituteParams) => {
      if (assignmentIds.length > 0) {
        const { error: removeErr } = await supabase
          .from('schedule_session_coaches')
          .delete()
          .in('id', assignmentIds)
        if (removeErr) throw removeErr
      }
      const rows = inserts.map(({ sessionId, slotOrder }) => ({
        session_id: sessionId,
        coach_id: newCoachId,
        slot_order: slotOrder,
      }))
      const { error: addErr } = await supabase
        .from('schedule_session_coaches')
        .upsert(rows, { onConflict: 'session_id,coach_id' })
      if (addErr) throw addErr
    },
    onSuccess: (_, vars) => invalidate(vars.weekStart),
  })

  return {
    bulkAssign: bulkAssignMutation.mutateAsync,
    bulkRemove: bulkRemoveMutation.mutateAsync,
    bulkSubstitute: bulkSubstituteMutation.mutateAsync,
    isPending:
      bulkAssignMutation.isPending ||
      bulkRemoveMutation.isPending ||
      bulkSubstituteMutation.isPending,
  }
}
