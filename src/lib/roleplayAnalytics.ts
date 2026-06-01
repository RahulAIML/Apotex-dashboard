/**
 * RolPlay Analytics — stub for Apotex
 * RolPlay module is NOT active for Apotex (video_answers = 0).
 * This file is kept to avoid import errors from untouched Gentera pages.
 * All functions return safe empty defaults.
 */

export function parseRpDate(_s: string): Date | null { return null }
export function computeRpKPIs(_sessions: unknown[], _activities: unknown[]) {
  return {
    totalSessions: 0, avgTotalScore: 0, avgRobinPct: 0,
    avgFacialPct: 0,  avgVoicePct: 0,   avgWpmPct: 0,
    avgCriteriaRate: 0, activeUsers: 0, activeBranches: 0,
    totalActivities: 0, avgAttempts: 0, avgDuration: 0,
    totalMCPoints: 0, passRate: 0, trend: [], scoreDist: [],
    dimensions: [], activityStats: [], userStats: [], branchStats: [],
    criteriaStats: [],
  }
}
export function computeRpSupervisorStats(..._args: unknown[]) { return [] }
export function computeRpBranchStats(..._args: unknown[]) { return [] }

// Type stubs for chart components — RolPlay not active for Apotex
export interface CriterionStat {
  label: string; index: number; shortLabel: string;
  name: string; pctMet: number; met: number; applicable: number
}
export interface ScoreDimension {
  label: string;
  subject: string; value: number; fullMark: number
}
export interface RpTrendPoint {
  date: string; avgScore: number; avgRobin: number; count: number
}
export interface RpScoreBucket {
  label: string; count: number
}
