import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SchedulePeriodEffective } from '../types/database'

export function useSchedulePeriods() {
  return useQuery({
    queryKey: ['schedule-periods'],
    queryFn: async (): Promise<SchedulePeriodEffective[]> => {
      const { data, error } = await supabase
        .from('view_schedule_periods_effective')
        .select('*')
        .order('week_start', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
