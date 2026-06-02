import type { Activity, Administrator, Member, Simulation } from '../api/types'
// re-export so pages can import directly
export type { Simulation }

export const PASS_THRESHOLD = 70  // Apotex standard pass threshold

// ─────────────────────────────────────────────
// Test / demo user blocklist
// ─────────────────────────────────────────────
// ── Exact-name blocklist (pilot/internal accounts) ────────────
const TEST_NAME_BLOCKLIST = new Set([
  // Single-name sandbox entries (early pilots with no email)
  'Andrea', 'Glieb', 'lucio', 'César', 'Arqui',
  'Poncho', 'Chavo', 'Don Juan', 'Protos', 'Caligula',
  'Minako', 'Pedro', 'test', 'Test', 'TEST',
  'GLIEB', 'BUSTAMANTE', 'salo', 'Gaby', 'Endir',
  'Dany', 'Vic', 'Archie', 'Troncoso',
  // Known internal testers with full names
  'Mario Motta', 'Andrea Campos', 'Glieb 2',
  'Oralia', 'Milka', 'guadalupe castro',
  'Glieb Arquímedes Troncoso Bustamante',
  'Gaby Morales', 'arqui',
])

// ── Non-Apotex email domain blocklist ─────────────────────────
const NON_APOTEX_EMAILS = new Set([
  'guadalupe.cuevas@audioweb.com.mx',   // audioweb tester, not an Apotex employee
])

// ── Partial name fragments to reject (case-insensitive) ───────
const TEST_NAME_FRAGMENTS = [
  'mario motta', 'glieb', 'arqui', 'troncos',
  'bustama', 'test', 'demo', 'piloto',
]

/**
 * Remove ALL non-Apotex sessions:
 *   1. Known test names (exact)
 *   2. Known non-Apotex emails
 *   3. Sessions with no email AND a test-looking name (partial match)
 *   4. Sessions with non-apotex email domains (when email is present)
 */
export function filterTestUsers(sims: Simulation[]): Simulation[] {
  return sims.filter((s) => {
    const name  = (s.Usuario_Nombre ?? '').trim()
    const email = (s.Usuario ?? '').trim().toLowerCase()

    // 1. Exact name blocklist
    if (TEST_NAME_BLOCKLIST.has(name)) return false

    // 2. Specific non-Apotex emails
    if (NON_APOTEX_EMAILS.has(email)) return false

    // 3. If email present → must be @apotex domain
    if (email && !email.includes('apotex')) return false

    // 4. If no email → check name against known test fragments
    if (!email) {
      const nameLower = name.toLowerCase()
      if (TEST_NAME_FRAGMENTS.some(f => nameLower.includes(f))) return false
    }

    return true
  })
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

/**
 * APOTEX SCORING MODEL
 * ─────────────────────────────────────────────────────────────
 * The `Calificacion` field (0–100) IS the score for all sessions.
 *
 * Activity types and their scoring:
 *   Coach Evaluador (71,111,128): Calificacion = Puntos_Totales/50 × 100
 *   Coach Maestro   (174,175,176): Calificacion = 0 in simulator
 *                                  (actual score lives in bridge/simulador_ventas_callback)
 *
 * Pass threshold = 70% (based on bridge data and Apotex standards).
 *
 * DO NOT use the Gentera formula (Puntos_Totales / applicable_interactions × 100)
 * — for Apotex, Coach Maestro sessions have Puntos_Totales=0 and no Puntos_1..6,
 * which causes totalEvts≈107 vs totalPts=5098 → result=4764% (the bug seen in prod).
 */
export const APOTEX_PASS_THRESHOLD = 70

/** Sessions that have a real score (Calificacion > 0) */
function scoredSims(sims: Simulation[]): Simulation[] {
  return sims.filter(s => s.Calificacion != null && s.Calificacion > 0)
}

/** Average of Calificacion for sessions that have a real score */
function avgScore(sims: Simulation[]): number {
  const scored = scoredSims(sims)
  if (!scored.length) return 0
  return Math.round(scored.reduce((sum, s) => sum + s.Calificacion, 0) / scored.length)
}

/** A session passes if Calificacion >= 70 */
function isPass(s: Simulation): boolean {
  return s.Calificacion != null && s.Calificacion >= APOTEX_PASS_THRESHOLD
}

// ─────────────────────────────────────────────
// Core KPIs
// ─────────────────────────────────────────────
export interface DashboardKPIs {
  totalSimulations: number
  averageScore: number
  passRate: number
  activeAdvisors: number
  totalActivities: number
  totalMembers: number
  totalAdmins: number
  totalSupervisors: number
  bestScore: number
  worstScore: number
  passCount: number
  failCount: number
}

export function computeKPIs(
  sims: Simulation[],
  activities: Activity[],
  members: Member[],
  admins: Administrator[],
): DashboardKPIs {
  // Pass/fail based on Calificacion >= 70 (Apotex standard)
  const passCount  = sims.filter(isPass).length
  const scored     = scoredSims(sims)          // sessions with real score
  const advisors   = new Set(sims.map((s) => s.Usuario_Nombre))
  const scores     = scored.map((s) => s.Calificacion)

  return {
    totalSimulations: sims.length,
    averageScore:     avgScore(sims),                               // avg of scored sessions only
    passRate:         pct(passCount, scored.length),                // % of scored sessions passing
    activeAdvisors:   advisors.size,
    totalActivities:  activities.length,
    totalMembers:     members.length,
    totalAdmins:      admins.filter((a) => a.rpa_profile_type === 'admin').length,
    totalSupervisors: admins.filter((a) => a.rpa_profile_type === 'supervisor').length,
    bestScore:        scores.length ? Math.max(...scores) : 0,
    worstScore:       scores.length ? Math.min(...scores) : 0,
    passCount,
    failCount:        scored.length - passCount,
  }
}

// ─────────────────────────────────────────────
// Score Distribution
// ─────────────────────────────────────────────
export interface ScoreBucket {
  label: string
  count: number
  min: number
  max: number
}

export function computeScoreDistribution(sims: Simulation[]): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { label: '0–20', min: 0, max: 20, count: 0 },
    { label: '21–40', min: 21, max: 40, count: 0 },
    { label: '41–60', min: 41, max: 60, count: 0 },
    { label: '61–80', min: 61, max: 80, count: 0 },
    { label: '81–100', min: 81, max: 100, count: 0 },
  ]
  sims.forEach((s) => {
    if (s.Calificacion == null || s.Calificacion === 0) return  // skip unscored (Coach Maestro)
    const b = buckets.find((bk) => s.Calificacion >= bk.min && s.Calificacion <= bk.max)
    if (b) b.count++
  })
  return buckets
}

// ─────────────────────────────────────────────
// Trend over time
// ─────────────────────────────────────────────
export interface TrendPoint {
  date: string
  avgScore: number
  count: number
  passRate: number
}

export function computeTrend(sims: Simulation[]): TrendPoint[] {
  const byDate: Record<string, Simulation[]> = {}
  sims.forEach((s) => {
    const date = s.Fecha_y_Hora?.split('T')[0]
    if (!date) return
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(s)
  })
  return Object.entries(byDate)
    .map(([date, group]) => {
      const scored = scoredSims(group)
      const passCount = group.filter(isPass).length
      return {
        date,
        avgScore: avgScore(group),                       // avg of scored sessions only
        count:    group.length,
        passRate: pct(passCount, scored.length || 1),   // pass% among scored sessions
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ─────────────────────────────────────────────
// Round-level averages (Puntos_1..6)
// ─────────────────────────────────────────────
export interface RoundStat {
  round: number
  label: string
  avg: number
  passRate: number
  count: number
}

export function computeRoundStats(sims: Simulation[]): RoundStat[] {
  // Only Coach Evaluador sessions (71,111,128) have per-interaction points
  return [1, 2, 3, 4, 5, 6].map((i) => {
    const key = `Puntos_${i}` as keyof Simulation
    const values = sims
      .map((s) => s[key])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v))
    return {
      round: i,
      label: `I${i}`,
      avg:      values.length ? Math.round(avg(values) * 100) / 100 : 0,
      passRate: values.length ? pct(values.filter((v) => v > 0).length, values.length) : 0,
      count:    values.length,
    }
  }).filter((r) => r.count > 0)
}

// ─────────────────────────────────────────────
// Activity statistics
// ─────────────────────────────────────────────
export interface ActivityStat {
  id: number
  name: string
  activityType: string
  count: number
  avgScore: number
  passRate: number
  passCount: number
  failCount: number
}

export function computeActivityStats(
  sims: Simulation[],
  activities: Activity[],
): ActivityStat[] {
  const actMap = new Map(activities.map((a) => [a.ID_Caso_de_Uso, a]))
  const byActivity: Record<number, Simulation[]> = {}
  sims.forEach((s) => {
    if (!byActivity[s.ID_Caso_de_Uso]) byActivity[s.ID_Caso_de_Uso] = []
    byActivity[s.ID_Caso_de_Uso].push(s)
  })
  return Object.entries(byActivity).map(([id, group]) => {
    const numId = Number(id)
    const act = actMap.get(numId)
    const scored    = scoredSims(group)
    const passCount = group.filter(isPass).length
    return {
      id: numId,
      name: act?.Caso_de_Uso ?? `Activity ${id}`,
      activityType: act?.Actividad_Nombre ?? 'unknown',
      count: group.length,
      avgScore: avgScore(group),
      passRate: pct(passCount, scored.length || 1),
      passCount,
      failCount: scored.length - passCount,
    }
  })
}

// ─────────────────────────────────────────────
// User (advisor) statistics — leaderboard
// ─────────────────────────────────────────────
export interface UserStat {
  name: string
  userId: string
  count: number
  avgScore: number
  passRate: number
  bestScore: number
  passCount: number
  failCount: number
}

export function computeUserStats(sims: Simulation[]): UserStat[] {
  const byUser: Record<string, Simulation[]> = {}
  sims.forEach((s) => {
    const key = s.Usuario_Nombre || s.Usuario || 'Unknown'
    if (!byUser[key]) byUser[key] = []
    byUser[key].push(s)
  })
  return Object.entries(byUser)
    .map(([name, group]) => {
      const scored    = scoredSims(group)
      const passCount = group.filter(isPass).length
      const scores    = scored.map((s) => s.Calificacion)
      return {
        name,
        userId: group[0].Usuario ?? '',
        count:     group.length,
        avgScore:  avgScore(group),
        passRate:  pct(passCount, scored.length || 1),
        bestScore: scores.length ? Math.max(...scores) : 0,
        passCount,
        failCount: scored.length - passCount,
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore)
}

// ─────────────────────────────────────────────
// Organization hierarchy
// ─────────────────────────────────────────────
export interface OrgNode {
  id: number
  name: string
  email: string
  type: string
  parentId: number
  children: OrgNode[]
  memberCount: number
}

export function buildOrgTree(admins: Administrator[], members: Member[]): OrgNode[] {
  const adminMemberCount = new Map<number, number>()
  members.forEach((m) => {
    adminMemberCount.set(m.mb_admin, (adminMemberCount.get(m.mb_admin) ?? 0) + 1)
  })

  const nodes = new Map<number, OrgNode>(
    admins.map((a) => [
      a.rpa_id,
      {
        id: a.rpa_id,
        name: a.rpa_full_name,
        email: a.rpa_email,
        type: a.rpa_profile_type,
        parentId: a.rpa_parent,
        children: [],
        memberCount: adminMemberCount.get(a.rpa_id) ?? 0,
      },
    ]),
  )

  const roots: OrgNode[] = []
  nodes.forEach((node) => {
    const parent = nodes.get(node.parentId)
    if (parent && node.parentId !== 0) {
      parent.children.push(node)
    } else if (node.type === 'supervisor' || node.type === 'tenant') {
      roots.push(node)
    }
  })
  return roots
}

// ─────────────────────────────────────────────
// Coaching feedback analysis
// ─────────────────────────────────────────────
export interface FeedbackEntry {
  simId: number
  userName: string
  round: number
  question: string
  response: string
  feedback: string
  points: number
}

export function extractFeedback(sims: Simulation[]): FeedbackEntry[] {
  const entries: FeedbackEntry[] = []
  sims.forEach((s) => {
    for (let i = 1; i <= 6; i++) {
      const puntos = s[`Puntos_${i}` as keyof Simulation]
      if (typeof puntos !== 'number' || isNaN(puntos)) continue   // skip "No aplica" and null
      const feedback = s[`Retroalimentacion_${i}` as keyof Simulation] as string | null
      if (!feedback) continue
      entries.push({
        simId: s.ID_Sim,
        userName: s.Usuario_Nombre,
        round: i,
        question: (s[`Pregunta_${i}` as keyof Simulation] as string | null) ?? '',
        response: (s[`Respuesta_${i}` as keyof Simulation] as string | null) ?? '',
        feedback,
        points: puntos as number,
      })
    }
  })
  return entries
}

// ─────────────────────────────────────────────
// AI Context String (for Gemini)
// ─────────────────────────────────────────────
export function buildAIContext(
  kpis: DashboardKPIs,
  sims: Simulation[],
  activities: Activity[],
  actStats: ActivityStat[],
  userStats: UserStat[],
): string {
  const topUsers = userStats.slice(0, 5).map((u) => `${u.name} (${u.avgScore}%)`).join(', ')
  const actList = actStats
    .map((a) => `${a.name}: ${a.count} sims, avg ${a.avgScore}%`)
    .join('; ')
  const recent = sims
    .slice(-5)
    .map((s) => `${s.Usuario_Nombre}: ${s.Calificacion}% (${s.Diagnostico_Final})`)
    .join(', ')

  return `
APOTEX ANALYTICS PLATFORM — LIVE DASHBOARD DATA
------------------------------------------------
Total Simulations: ${kpis.totalSimulations}
Average Score: ${kpis.averageScore}%
Pass Rate: ${kpis.passRate}% (${kpis.passCount} passed, ${kpis.failCount} failed)
Active Advisors: ${kpis.activeAdvisors}
Total Members: ${kpis.totalMembers}
Total Admins: ${kpis.totalAdmins}
Total Supervisors: ${kpis.totalSupervisors}
Best Score: ${kpis.bestScore}%
Lowest Score: ${kpis.worstScore}%

Activities:
${actList}

Top Performers:
${topUsers}

Recent Simulations (last 5):
${recent}

Activities Available: ${activities.map((a) => a.Caso_de_Uso).join(', ')}
  `.trim()
}
