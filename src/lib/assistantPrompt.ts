import type { DashboardKPIs, ActivityStat, UserStat } from './analytics'
import { computeScoreDistribution, computeRoundStats } from './analytics'
import type { Simulation } from '../api/types'
import { simDate } from '../components/ui/DateRangeFilter'

export interface PromptContext {
  language: string
  currentPage: string
  kpis: DashboardKPIs | null
  actStats: ActivityStat[]
  userStats: UserStat[]
  sims: Simulation[]
}

export function buildAssistantPrompt(ctx: PromptContext): string {
  const { language, currentPage, kpis, actStats, userStats, sims } = ctx
  const langLabel = language === 'es' ? 'Spanish (es-MX)' : 'English (en-US)'

  // Date range
  const sortedDates = sims.map(s => s.Fecha_y_Hora).filter(Boolean).sort()
  const dateFrom = sortedDates[0]?.substring(0, 10) ?? 'N/A'
  const dateTo   = sortedDates[sortedDates.length - 1]?.substring(0, 10) ?? 'N/A'

  // Score distribution
  const dist = computeScoreDistribution(sims)
  const distBlock = dist.map(b => `  ${b.label}%: ${b.count} sessions`).join('\n')

  // Per-round stats
  const rounds = computeRoundStats(sims)
  const roundBlock = rounds.length > 0
    ? rounds.map(r => {
        const label = language === 'es' ? `Interacción ${r.round}` : `Interaction ${r.round}`
        return `  ${label}: avg ${r.avg}/10, pass rate ${r.passRate}% (n=${r.count})`
      }).join('\n')
    : '  No per-interaction data available'

  // All users ranked
  const usersRanked = [...userStats].sort((a, b) => b.avgScore - a.avgScore)
  const usersBlock = usersRanked.slice(0, 25).map((u, i) =>
    `  ${String(i + 1).padStart(2)}. ${u.name} (${u.userId || '—'}): avg ${u.avgScore}%, ${u.count} sessions, best ${u.bestScore}%, pass ${u.passRate}%`
  ).join('\n')
  if (usersRanked.length > 25) {
    // append count of remaining
  }

  // Bottom 10 coaching priority (scored advisors only)
  const bottomTen = [...usersRanked].filter(u => u.avgScore > 0).reverse().slice(0, 10)
  const bottomBlock = bottomTen.map(u =>
    `  ${u.name} (${u.userId || '—'}): avg ${u.avgScore}%, ${u.count} sessions, pass rate ${u.passRate}%`
  ).join('\n')

  // Activity breakdown
  const actBlock = [...actStats].sort((a, b) => b.count - a.count).map(a =>
    `  ${a.name} [${a.activityType}]: ${a.count} sessions, avg ${a.avgScore > 0 ? a.avgScore + '%' : '—'}, pass ${a.passRate > 0 ? a.passRate + '%' : '—'} (${a.passCount} pass / ${a.failCount} fail)`
  ).join('\n')

  // Per-user per-activity (top 20 users by session count)
  const actNameMap = new Map(actStats.map(a => [a.id, a.name]))
  const top20ByVol = [...usersRanked].sort((a, b) => b.count - a.count).slice(0, 20)
  const perUserActBlock = top20ByVol.map(u => {
    const userSims = sims.filter(s =>
      (s.Usuario && u.userId && s.Usuario.toLowerCase() === u.userId.toLowerCase()) ||
      s.Usuario_Nombre === u.name
    )
    const byAct = new Map<number, { count: number; best: number }>()
    userSims.forEach(s => {
      const entry = byAct.get(s.ID_Caso_de_Uso) ?? { count: 0, best: 0 }
      entry.count++
      if (s.Calificacion > entry.best) entry.best = s.Calificacion
      byAct.set(s.ID_Caso_de_Uso, entry)
    })
    const parts = [...byAct.entries()].map(([id, d]) => {
      const name = actNameMap.get(id) ?? `ID${id}`
      return `${name} ×${d.count} best:${d.best > 0 ? d.best + '%' : '—'} ${d.best >= 70 ? '✓' : '✗'}`
    }).join(' | ')
    return `  ${u.name}: ${parts}`
  }).join('\n')

  // Recent 10 sessions
  const recent10 = [...sims]
    .sort((a, b) => (b.Fecha_y_Hora ?? '').localeCompare(a.Fecha_y_Hora ?? ''))
    .slice(0, 10)
  const recentBlock = recent10.map(s => {
    const status = s.Calificacion >= 70 ? 'PASS' : s.Calificacion > 0 ? 'FAIL' : 'unscored'
    const actName = actNameMap.get(s.ID_Caso_de_Uso) ?? `ID${s.ID_Caso_de_Uso}`
    return `  ${s.Usuario_Nombre} (${s.Usuario || '—'}): ${s.Calificacion > 0 ? s.Calificacion + '%' : '—'} ${status} — ${actName} — ${simDate(s.Fecha_y_Hora) ?? 'N/A'}`
  }).join('\n')

  // Page-specific context
  const pageBlock = buildPageBlock(currentPage, { kpis, actStats, userStats, sims })

  return `You are the Apotex Pharmaceutical Sales Analytics AI assistant, embedded in a live dashboard.

Respond ONLY in ${langLabel}. The user is currently on the "${currentPage}" page.
Be concise, data-driven, and actionable. Use bullet points and **bold** for key metrics.
Reference specific advisor names, emails, or activities from the data below when relevant.
If you don't know something, say so — never fabricate data.

---

APOTEX ANALYTICS PLATFORM — LIVE DASHBOARD DATA
Date Range: ${dateFrom} → ${dateTo}
------------------------------------------------------------------
Total Sessions:       ${kpis?.totalSimulations ?? 0}
Average Score:        ${kpis?.averageScore ?? 0}%
Pass Rate:            ${kpis?.passRate ?? 0}%
Active Advisors:      ${kpis?.activeAdvisors ?? 0}
Total Members:        ${kpis?.totalMembers ?? 0}
Best Score:           ${kpis?.bestScore ?? 0}%  |  Lowest Score: ${kpis?.worstScore ?? 0}%
Passed:               ${kpis?.passCount ?? 0}  |  Failed: ${kpis?.failCount ?? 0}
Activities:           ${kpis?.totalActivities ?? 0}
Admins:               ${kpis?.totalAdmins ?? 0}  |  Supervisors: ${kpis?.totalSupervisors ?? 0}

Score Distribution:
${distBlock}

Per-Interaction Pass Rates (avg pts/10, ≥5 = adequate):
${roundBlock}

All ${usersRanked.length} Advisors Ranked by Avg Score (top 25):
${usersBlock}${usersRanked.length > 25 ? `\n  ... and ${usersRanked.length - 25} more advisors` : ''}

Bottom 10 (Coaching Priority):
${bottomBlock}

Activity Breakdown (${actStats.length} activities):
${actBlock}

Per-Advisor Per-Activity Detail (top 20 by volume):
${perUserActBlock}

Recent 10 Sessions:
${recentBlock}

${pageBlock}---

If the user attaches an image or screenshot: FIRST describe all visible numbers, charts, names, colors, and data in detail. THEN relate those observations to the live dashboard data above. THEN answer their question if they asked one.`
}

function buildPageBlock(
  page: string,
  ctx: { kpis: DashboardKPIs | null; actStats: ActivityStat[]; userStats: UserStat[]; sims: Simulation[] },
): string {
  const { kpis, actStats, userStats } = ctx

  switch (true) {
    case page === '/' || page === '/overview': {
      const status = (kpis?.passRate ?? 0) >= 70 ? 'ABOVE TARGET ✓' : 'BELOW 70% TARGET ✗'
      return `PAGE CONTEXT — OVERVIEW:
  Pass rate: ${kpis?.passRate ?? 0}% — ${status}
  ${kpis?.activeAdvisors ?? 0} of ${kpis?.totalMembers ?? 0} registered members have simulation records.
  Average score of scored sessions: ${kpis?.averageScore ?? 0}%.

`
    }

    case page === '/simulations': {
      return `PAGE CONTEXT — SIMULATIONS TABLE:
  All ${kpis?.totalSimulations ?? 0} sessions are visible. Each row shows advisor name, email, activity, date, score, and status.
  Rows expand to show per-interaction Q&A, points scored, and AI feedback.
  Export: bulk CSV (all filtered rows + all interaction rounds) or per-session CSV download.

`
    }

    case page === '/leaderboard': {
      const top3 = [...userStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3)
        .map((u, i) => `${i + 1}. ${u.name} — ${u.avgScore}% avg`).join(', ')
      return `PAGE CONTEXT — LEADERBOARD:
  ${userStats.length} advisors ranked by average score.
  Top 3: ${top3}
  Search by name or email. Filter by date range or limit to Top 10/25/50.

`
    }

    case page === '/activities': {
      const topAct = [...actStats].sort((a, b) => b.count - a.count)[0]
      const bestAct = [...actStats].filter(a => a.avgScore > 0).sort((a, b) => b.avgScore - a.avgScore)[0]
      return `PAGE CONTEXT — ACTIVITIES:
  ${actStats.length} activities tracked.
  Most sessions: ${topAct?.name ?? 'N/A'} (${topAct?.count ?? 0} sessions).
  Highest avg score: ${bestAct?.name ?? 'N/A'} (${bestAct?.avgScore ?? 0}%).
  Each card shows session count, avg score, pass rate, and top advisors for that activity.

`
    }

    case page === '/coaching': {
      const lowCount = userStats.filter(u => u.avgScore > 0 && u.avgScore < 70).length
      return `PAGE CONTEXT — COACHING:
  ${lowCount} advisors are currently below the 70% pass threshold.
  Coaching page shows per-interaction weakness analysis and recommended focus areas.
  Priority: advisors with highest session volume but lowest scores.

`
    }

    case page === '/organization': {
      return `PAGE CONTEXT — ORGANIZATION:
  ${kpis?.totalMembers ?? 0} members registered.
  ${kpis?.totalAdmins ?? 0} admins, ${kpis?.totalSupervisors ?? 0} supervisors.
  Member table shows full name, email (cross-referenced from simulations), designation, and assigned administrator.

`
    }

    case page === '/reports': {
      return `PAGE CONTEXT — REPORTS:
  4 CSV exports: trend by date, activity performance, branch performance, full advisor report.
  Executive Report (print/PDF) shows KPIs, activity table, score distribution (6 buckets), and top 15 performers.

`
    }

    case page === '/executive-report': {
      return `PAGE CONTEXT — EXECUTIVE REPORT:
  Viewing the full formatted executive performance report with live data.
  Sections: KPI summary, activity performance, score distribution, top 15 performers.
  Print/PDF export available. Data refreshes on page reload.

`
    }

    case page === '/business-lines': {
      return `PAGE CONTEXT — BUSINESS LINES:
  Members grouped by their mb_line field. Most members currently have no line assigned (mb_line is blank in DB).
  Shows simulation count, avg score, and pass rate per business line.

`
    }

    default:
      return `PAGE CONTEXT — ${page}:\n  User is on the ${page} page of the Apotex Analytics Platform.\n\n`
  }
}
