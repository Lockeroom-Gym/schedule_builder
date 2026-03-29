import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { StaffLeave } from '../types/database'
import { parseISO, format, addDays } from 'date-fns'

export function useLeave(weekStart: string | null) {
  return useQuery({
    queryKey: ['leave', weekStart],
    queryFn: async (): Promise<StaffLeave[]> => {
      if (!weekStart) return []
      const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('staff_leave_confirmed')
        .select('*')
        .gte('leave_date', weekStart)
        .lte('leave_date', weekEnd)
      if (error) throw error
      return data ?? []
    },
    enabled: !!weekStart,
    staleTime: 2 * 60 * 1000,
  })
}
