import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface CopyScheduleParams {
  sourceWeekStart: string
  targetWeekStarts: string[]
}

interface CopyScheduleResult {
  success: boolean
  weeks_processed: number
  sessions_copied: number
}

export function useCopySchedule() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ sourceWeekStart, targetWeekStarts }: CopyScheduleParams): Promise<CopyScheduleResult> => {
      const { data, error } = await supabase.rpc('copy_schedule_weeks', {
        source_week_start: sourceWeekStart,
        target_week_starts: targetWeekStarts,
      })
      if (error) throw error
      return data as CopyScheduleResult
    },
    onSuccess: (_data, variables) => {
      // Invalidate all affected weeks
      for (const ws of variables.targetWeekStarts) {
        queryClient.invalidateQueries({ queryKey: ['schedule-sessions', ws] })
        queryClient.invalidateQueries({ queryKey: ['session-coaches', ws] })
      }
    },
  })

  return {
    copySchedule: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
