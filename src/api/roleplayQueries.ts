/**
 * Apotex Bridge React Query hooks
 * All data sourced from PHP bridge → rolplay_apotex_robin
 */
import { useQuery } from '@tanstack/react-query'
import {
  fetchBridgeOverview,
  fetchBridgeActivitySummary,
  fetchBridgeLeaderboard,
  fetchBridgeTrend,
  fetchBridgeDistribution,
  fetchBridgeCompletion,
  fetchBridgeSessions,
  fetchBridgeMembers,
  fetchBridgeAdmins,
  fetchBridgeActivities,
  fetchBridgeAssignments,
  fetchBridgeLoginActivity,
  fetchBridgeTags,
} from './roleplayClient'

const STALE = 1000 * 60 * 5 // 5 minutes

export function useBridgeOverview(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['bridge_overview', params],
    queryFn: () => fetchBridgeOverview(params),
    staleTime: STALE,
  })
}

export function useBridgeActivitySummary(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['bridge_activities', params],
    queryFn: () => fetchBridgeActivitySummary(params),
    staleTime: STALE,
  })
}

export function useBridgeLeaderboard(limit = 100, params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['bridge_leaderboard', limit, params],
    queryFn: () => fetchBridgeLeaderboard(limit, params),
    staleTime: STALE,
  })
}

export function useBridgeTrend(granularity: 'day'|'week'|'month' = 'month', params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['bridge_trend', granularity, params],
    queryFn: () => fetchBridgeTrend(granularity, params),
    staleTime: STALE,
  })
}

export function useBridgeDistribution(params?: { date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['bridge_distribution', params],
    queryFn: () => fetchBridgeDistribution(params),
    staleTime: STALE,
  })
}

export function useBridgeCompletion() {
  return useQuery({
    queryKey: ['bridge_completion'],
    queryFn: fetchBridgeCompletion,
    staleTime: STALE,
  })
}

export function useBridgeSessions(params?: { limit?: number; offset?: number; activity_id?: string; date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ['bridge_sessions', params],
    queryFn: () => fetchBridgeSessions(params),
    staleTime: STALE,
  })
}

export function useBridgeMembers(search?: string) {
  return useQuery({
    queryKey: ['bridge_members', search],
    queryFn: () => fetchBridgeMembers(search),
    staleTime: STALE,
  })
}

export function useBridgeAdmins() {
  return useQuery({
    queryKey: ['bridge_admins'],
    queryFn: fetchBridgeAdmins,
    staleTime: STALE,
  })
}

export function useBridgeActivities() {
  return useQuery({
    queryKey: ['bridge_activity_list'],
    queryFn: fetchBridgeActivities,
    staleTime: STALE,
  })
}

export function useBridgeAssignments(limit = 500) {
  return useQuery({
    queryKey: ['bridge_assignments', limit],
    queryFn: () => fetchBridgeAssignments(limit),
    staleTime: STALE,
  })
}

export function useBridgeLoginActivity() {
  return useQuery({
    queryKey: ['bridge_login_activity'],
    queryFn: fetchBridgeLoginActivity,
    staleTime: STALE,
  })
}

export function useBridgeTags() {
  return useQuery({
    queryKey: ['bridge_tags'],
    queryFn: fetchBridgeTags,
    staleTime: STALE,
  })
}

/** Composite hook — loads all bridge data in parallel */
export function useBridgeData(params?: { date_from?: string; date_to?: string }) {
  const overview    = useBridgeOverview(params)
  const activities  = useBridgeActivitySummary(params)
  const leaderboard = useBridgeLeaderboard(100, params)
  const trend       = useBridgeTrend('month', params)
  const distribution= useBridgeDistribution(params)
  const completion  = useBridgeCompletion()
  const members     = useBridgeMembers()
  const admins      = useBridgeAdmins()
  const actList     = useBridgeActivities()
  const assignments = useBridgeAssignments()
  const logins      = useBridgeLoginActivity()
  const tags        = useBridgeTags()

  const isLoading = overview.isLoading || activities.isLoading || leaderboard.isLoading
  const isError   = overview.isError   || activities.isError   || leaderboard.isError

  return {
    overview:     overview.data     ?? null,
    activities:   activities.data   ?? [],
    leaderboard:  leaderboard.data  ?? [],
    trend:        trend.data        ?? [],
    distribution: distribution.data?.distribution ?? [],
    completion:   completion.data   ?? [],
    members:      members.data?.members   ?? [],
    memberCount:  members.data?.count     ?? 0,
    admins:       admins.data?.admins     ?? [],
    adminCount:   admins.data?.count      ?? 0,
    actList:      actList.data      ?? [],
    assignments:  assignments.data  ?? [],
    logins:       logins.data?.monthly   ?? [],
    loginSummary: logins.data?.summary   ?? null,
    tag1:         tags.data?.tag1   ?? [],
    tag2:         tags.data?.tag2   ?? [],
    isLoading,
    isError,
    refetch: () => {
      overview.refetch(); activities.refetch(); leaderboard.refetch()
      trend.refetch();    distribution.refetch(); completion.refetch()
      members.refetch();  admins.refetch(); actList.refetch()
      assignments.refetch(); logins.refetch(); tags.refetch()
    },
  }
}
