import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ScheduleBlockConfig } from '../types/database'

export function useScheduleBlocks() {
  return useQuery({
    queryKey: ['schedule-block-config'],
    queryFn: async (): Promise<ScheduleBlockConfig[]> => {
      const { data, error } = await supabase
        .from('schedule_block_config')
        .select('*')
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}
