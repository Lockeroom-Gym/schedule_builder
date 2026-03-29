import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { SystemSessionType, SystemSessionGymCapacity } from '../types/database'

export function useSessionTypes() {
  return useQuery({
    queryKey: ['session-types'],
    queryFn: async (): Promise<SystemSessionType[]> => {
      const { data, error } = await supabase
        .from('system_session_types')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useSessionGymCapacity() {
  return useQuery({
    queryKey: ['session-gym-capacity'],
    queryFn: async (): Promise<SystemSessionGymCapacity[]> => {
      const { data, error } = await supabase
        .from('system_session_gym_capacity')
        .select('*')
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 60 * 1000,
  })
}
