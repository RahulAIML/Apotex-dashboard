import { useQuery } from '@tanstack/react-query'
import { fetchActivities, fetchSimulations, fetchMembers, fetchAdmins } from '../api/client'
import {
  computeKPIs,
  computeTrend,
  computeRoundStats,
  computeActivityStats,
  computeUserStats,
  computeScoreDistribution,
  buildOrgTree,
  extractFeedback,
  filterTestUsers,
} from '../lib/analytics'

const STALE_5M  = 5  * 60 * 1000   // simulations / activities — refresh after 5 min
const STALE_15M = 15 * 60 * 1000   // members / admins — slow-changing org data

export function useDashboardData() {
  // All 4 queries fire simultaneously (React Query parallelises by default).
  // staleTime prevents redundant re-fetches when navigating between pages.
  const activitiesQ = useQuery({ queryKey: ['activities'],  queryFn: fetchActivities, staleTime: STALE_5M  })
  const simsQ       = useQuery({ queryKey: ['simulations'], queryFn: fetchSimulations, staleTime: STALE_5M  })
  const membersQ    = useQuery({ queryKey: ['members'],     queryFn: fetchMembers,     staleTime: STALE_15M })
  const adminsQ     = useQuery({ queryKey: ['admins'],      queryFn: fetchAdmins,      staleTime: STALE_15M })

  // KPIs only need sims + activities — don't block on org data
  const coreLoading = simsQ.isLoading || activitiesQ.isLoading
  const isLoading   = coreLoading || membersQ.isLoading || adminsQ.isLoading
  const isError     = activitiesQ.isError || simsQ.isError || membersQ.isError || adminsQ.isError

  const activities = activitiesQ.data?.data ?? []
  const sims = filterTestUsers(simsQ.data ?? [])
  const members = membersQ.data?.data ?? []
  const admins = adminsQ.data?.data ?? []

  const kpis = isLoading || isError ? null : computeKPIs(sims, activities, members, admins)
  const trend = isLoading || isError ? null : computeTrend(sims)
  const roundStats = isLoading || isError ? null : computeRoundStats(sims)
  const actStats = isLoading || isError ? null : computeActivityStats(sims, activities)
  const userStats = isLoading || isError ? null : computeUserStats(sims)
  const scoreDist = isLoading || isError ? null : computeScoreDistribution(sims)
  const orgTree = isLoading || isError ? null : buildOrgTree(admins, members)
  const feedback = isLoading || isError ? null : extractFeedback(sims)

  return {
    isLoading,
    isError,
    activities,
    sims,
    members,
    admins,
    kpis,
    trend,
    roundStats,
    actStats,
    userStats,
    scoreDist,
    orgTree,
    feedback,
    refetch: () => {
      activitiesQ.refetch()
      simsQ.refetch()
      membersQ.refetch()
      adminsQ.refetch()
    },
  }
}
