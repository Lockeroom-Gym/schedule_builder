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

/**
 * Fetches the effective (carry-forward) preferences for a single coach
 * at a given week. Finds the most recent period with preferences for this
 * coach where week_start <= the target weekStart.
 */
export function useEffectiveCoachPreferences(coachId: string | null, weekStart: string | null) {
  return useQuery({
    queryKey: ['effective-coach-preferences', coachId, weekStart],
    queryFn: async (): Promise<SchedulePreference[]> => {
      if (!coachId || !weekStart) return []

      // Step 1: Find all period_ids this coach has preferences for
      const { data: prefPeriods, error: prefError } = await supabase
        .from('schedule_preferences')
        .select('period_id')
        .eq('staff_id', coachId)

      if (prefError || !prefPeriods?.length) return []

      const periodIds = [...new Set(prefPeriods.map((r) => r.period_id))]

      // Step 2: Among those periods, find the latest one where week_start <= viewed week
      const { data: periods, error: periodError } = await supabase
        .from('schedule_periods')
        .select('id, week_start')
        .in('id', periodIds)
        .lte('week_start', weekStart)
        .order('week_start', { ascending: false })
        .limit(1)

      if (periodError || !periods?.length) return []

      const effectivePeriodId = periods[0].id

      // Step 3: Fetch the actual preferences for that period + coach
      const { data, error } = await supabase
        .from('schedule_preferences')
        .select('*')
        .eq('period_id', effectivePeriodId)
        .eq('staff_id', coachId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!coachId && !!weekStart,
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

/**
 * Fetches the effective (carry-forward) preferences for all coaches
 * at a given week. Finds the most recent period with preferences for each
 * coach where week_start <= the target weekStart.
 */
export function useAllEffectivePreferences(weekStart: string | null) {
  return useQuery({
    queryKey: ['all-effective-preferences', weekStart],
    queryFn: async (): Promise<SchedulePreference[]> => {
      if (!weekStart) return []

      // Step 1: Find all periods on or before this week, ordered newest first
      const { data: periods, error: periodError } = await supabase
        .from('schedule_periods')
        .select('id, week_start')
        .lte('week_start', weekStart)
        .order('week_start', { ascending: false })

      if (periodError || !periods?.length) return []
      
      const periodIds = periods.map(p => p.id)

      // Step 2: Fetch all preferences for these periods
      // Note: We might need pagination in the future if periods grow huge, 
      // but for now this is safe for ~100s of periods.
      const { data: allPrefs, error: prefError } = await supabase
        .from('schedule_preferences')
        .select('*')
        .in('period_id', periodIds)
        
      if (prefError || !allPrefs?.length) return []

      // Step 3: Group by staff_id and find the most recent period for each
      const latestPeriodByStaff = new Map<string, string>()
      
      const periodRank = new Map<string, number>()
      periods.forEach((p, idx) => periodRank.set(p.id, idx))
      
      for (const pref of allPrefs) {
        const staffId = pref.staff_id
        const prefPeriodRank = periodRank.get(pref.period_id) ?? 999999
        
        const currentBestPeriodId = latestPeriodByStaff.get(staffId)
        const currentBestRank = currentBestPeriodId 
          ? (periodRank.get(currentBestPeriodId) ?? 999999) 
          : 999999
          
        if (prefPeriodRank < currentBestRank) {
          latestPeriodByStaff.set(staffId, pref.period_id)
        }
      }

      // Step 4: Filter to only include preferences from each staff's most recent period
      return allPrefs.filter(pref => 
        latestPeriodByStaff.get(pref.staff_id) === pref.period_id
      )
    },
    enabled: !!weekStart,
    staleTime: 60 * 1000,
  })
}
