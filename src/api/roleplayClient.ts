/**
 * Apotex Bridge API client
 * All data fetched directly from rolplay_apotex_robin via the PHP bridge:
 *   https://serv.aux-rolplay.com/apotex/bridge/?action=<action>
 * Proxied via vite: /bridge → https://serv.aux-rolplay.com/apotex/bridge/
 */

import type {
  BridgeOverview,
  BridgeActivityStat,
  BridgeLeaderboardUser,
  BridgeTrendPoint,
  BridgeScoreBucket,
  BridgeCompletionRate,
  BridgeSession,
  BridgeMember,
  BridgeAdmin,
  BridgeActivity,
  BridgeAssignment,
  BridgeLoginActivity,
  BridgeTag,
} from './roleplayTypes'

const BRIDGE = '/bridge'

async function get<T>(action: string, params: Record<string,string|number> = {}): Promise<T> {
  const qs = new URLSearchParams({ action, ...Object.fromEntries(
    Object.entries(params).map(([k,v]) => [k, String(v)])
  )}).toString()
  const res = await fetch(`${BRIDGE}?${qs}`)
  if (!res.ok) throw new Error(`Bridge ${action} HTTP ${res.status}`)
  const json = await res.json()
  if (json.ok === false) throw new Error(json.error ?? `Bridge ${action} error`)
  return json as T
}

export async function fetchBridgeOverview(params?: { date_from?: string; date_to?: string }) {
  const d = await get<{ overview: BridgeOverview }>('kpi.overview', params ?? {})
  return d.overview
}

export async function fetchBridgeActivitySummary(params?: { date_from?: string; date_to?: string }) {
  const d = await get<{ activities: BridgeActivityStat[] }>('kpi.activity_summary', params ?? {})
  return d.activities
}

export async function fetchBridgeLeaderboard(limit = 100, params?: { date_from?: string; date_to?: string }) {
  const d = await get<{ leaderboard: BridgeLeaderboardUser[] }>('kpi.leaderboard', { limit, ...(params ?? {}) })
  // Remove internal Rolplay admin accounts
  return d.leaderboard.filter(u => isApotexMember(u.email))
}

export async function fetchBridgeTrend(granularity: 'day'|'week'|'month' = 'month', params?: { date_from?: string; date_to?: string }) {
  const d = await get<{ trend: BridgeTrendPoint[] }>('kpi.score_trend', { granularity, ...(params ?? {}) })
  return d.trend
}

export async function fetchBridgeDistribution(params?: { date_from?: string; date_to?: string }) {
  const d = await get<{ distribution: BridgeScoreBucket[]; total: number }>('kpi.score_distribution', params ?? {})
  return { distribution: d.distribution, total: d.total }
}

export async function fetchBridgeCompletion() {
  const d = await get<{ completion: BridgeCompletionRate[] }>('kpi.completion_rate')
  return d.completion
}

export async function fetchBridgeSessions(params?: { limit?: number; offset?: number; activity_id?: string; search?: string; date_from?: string; date_to?: string }) {
  const d = await get<{ sessions: BridgeSession[]; total: number }>('kpi.sessions', params ?? {})
  return { sessions: d.sessions, total: d.total }
}

// Internal Rolplay admin accounts — not Apotex employees, exclude from all user-facing views
const INTERNAL_EMAILS = new Set([
  'ucontenido@rolplay.net',
  'udev@rolplay.net',
  'utester@rolplay.net',
  'udemo@rolplay.net',
])

function isApotexMember(email: string): boolean {
  if (!email) return false   // empty email = incomplete record, exclude
  if (INTERNAL_EMAILS.has(email.toLowerCase())) return false
  return true
}

export async function fetchBridgeMembers(search?: string) {
  const d = await get<{ members: BridgeMember[]; count: number }>('list.members', search ? { search } : {})
  // Filter: only real Apotex members (has email, not internal Rolplay accounts)
  const members = d.members.filter(m => isApotexMember(m.mb_email))
  return { members, count: members.length }
}

export async function fetchBridgeAdmins() {
  const d = await get<{ admins: BridgeAdmin[]; count: number }>('list.admins')
  return { admins: d.admins, count: d.count }
}

export async function fetchBridgeActivities() {
  const d = await get<{ activities: BridgeActivity[] }>('list.activities')
  return d.activities
}

export async function fetchBridgeAssignments(limit = 500) {
  const d = await get<{ assignments: BridgeAssignment[] }>('list.assignments', { limit })
  return d.assignments
}

export async function fetchBridgeLoginActivity() {
  const d = await get<{ monthly: BridgeLoginActivity[]; summary: { c: number; u: number } }>('kpi.login_activity')
  return { monthly: d.monthly, summary: d.summary }
}

export async function fetchBridgeTags() {
  const d = await get<{ tag1: BridgeTag[]; tag2: BridgeTag[] }>('list.tags')
  return { tag1: d.tag1 ?? [], tag2: d.tag2 ?? [] }
}
