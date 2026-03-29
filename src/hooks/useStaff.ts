import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { StaffMember, ViewStaffSessionBracket } from '../types/database'
import { sortCoachesBySeniority } from '../lib/scheduleUtils'

export function useStaff(activeOnly = true) {
  return useQuery({
    queryKey: ['staff', activeOnly],
    queryFn: async (): Promise<StaffMember[]> => {
      let query = supabase.from('staff_database').select('*')
      if (activeOnly) query = query.eq('staff_status', 'active')
      const { data, error } = await query
      if (error) throw error
      return sortCoachesBySeniority(data ?? [])
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useStaffBrackets() {
  return useQuery({
    queryKey: ['staff-brackets'],
    queryFn: async (): Promise<ViewStaffSessionBracket[]> => {
      const { data, error } = await supabase
        .from('view_staff_session_bracket')
        .select('*')
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}
