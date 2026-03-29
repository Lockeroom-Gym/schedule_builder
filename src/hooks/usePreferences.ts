import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SchedulePreference, ViewPreferencePolicyCheck } from '../types/database'

export function usePreferences(periodId: string | null) {
  return useQuery({
    queryKey: ['preferences', periodId],
    queryFn: async (): Promise<SchedulePreference[]> => {
      if (!periodId) return []
      const { data, error } = await supabase
        .from('schedule_preferences')
        .select('*')
        .eq('period_id', periodId)
        .order('coach_name')
        .order('preference_type')
      if (error) throw error
      return data ?? []
    },
    enabled: !!periodId,
    staleTime: 60 * 1000,
  })
}

export function useCoachCompliance(periodId: string | null) {
  return useQuery({
    queryKey: ['coach-compliance', periodId],
    queryFn: async (): Promise<ViewPreferencePolicyCheck[]> => {
      if (!periodId) return []
      const { data, error } = await supabase
        .from('view_preference_policy_check')
        .select('*')
        .eq('period_id', periodId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!periodId,
    staleTime: 60 * 1000,
  })
}
