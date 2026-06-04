import { useState, useMemo, useRef, useEffect } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useBridgeOverview } from '../api/roleplayQueries'
import {
  computeKPIs, computeActivityStats, computeUserStats, computeScoreDistribution, computeTrend,
} from '../lib/analytics'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { DateRangeFilter, inDateRange } from '../components/ui/DateRangeFilter'
import { downloadCSV, csvDate } from '../lib/csvExport'
import {
  BarChart3, PlayCircle, CheckCircle2, Users, Brain, Mic2, Download,
  Search, ChevronDown, X,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useChartColors } from '../lib/chartTheme'
import { TooltipShell, TRow, TTitle, useTooltipColors, type TooltipColors } from '../components/charts/TooltipShell'

const COLORS = { pass: '#10B981', fail: '#EF4444', accent: '#3B82F6', violet: '#8B5CF6' }

function TrendTooltip({ active, payload, label, es, c }: { active?: boolean; payload?: any[]; label?: string; es: boolean; c: TooltipColors }) {
  if (!active || !payload?.length) return null
  return (
    <TooltipShell c={c} minWidth={160}>
      <TTitle text={String(label ?? '')} c={c} />
      <TRow label={es ? 'Puntaje Prom.' : 'Avg Score'} value={`${payload[0]?.value ?? 0}%`} valueStyle={{ color: c.accent }} c={c} />
    </TooltipShell>
  )
}

function PassFailTooltip({ active, payload, c }: { active?: boolean; payload?: any[]; c: TooltipColors }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <TooltipShell c={c} minWidth={140}>
      <TTitle text={d.name} c={c} />
      <TRow label="Count" value={d.value} valueStyle={{ color: d.payload.color }} c={c} />
    </TooltipShell>
  )
}

function ActivityTooltip({ active, payload, es, c }: { active?: boolean; payload?: any[]; es: boolean; c: TooltipColors }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <TooltipShell c={c} minWidth={160}>
      <TTitle text={d.payload.name} c={c} />
      <TRow label={es ? 'Sesiones' : 'Sessions'} value={d.value} valueStyle={{ color: c.accent }} c={c} />
    </TooltipShell>
  )
}

function ScoreDistTooltip({ active, payload, es, c }: { active?: boolean; payload?: any[]; es: boolean; c: TooltipColors }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <TooltipShell c={c} minWidth={140}>
      <TTitle text={d.payload.label} c={c} />
      <TRow label={es ? 'Sesiones' : 'Sessions'} value={d.value} valueStyle={{ color: c.accent }} c={c} />
    </TooltipShell>
  )
}

export default function OverviewPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const es = language === 'es'

  const c  = useChartColors()
  const tt = useTooltipColors()

  const {
    isLoading, isError,
    kpis, trend, scoreDist, actStats, userStats,
    sims, activities, members, admins,
    refetch,
  } = useDashboardData()
  // ── Date range ──────────────────────────────
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')

  // Bridge: full data source — ALL 767 sessions across ALL 11 activities
  // Supplements simulator (436 coaching sessions) with Visita Médica APECS data
  const bridgeOv = useBridgeOverview(
    from || to ? { date_from: from || undefined, date_to: to || undefined } : undefined
  )

  // ── User selection filter ────────────────────
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const allUserNames = useMemo(
    () => Array.from(new Set(sims.map((s) => s.Usuario_Nombre))).sort(),
    [sims],
  )
  const filteredUserNames = useMemo(
    () => userSearch.trim()
      ? allUserNames.filter((n) => n.toLowerCase().includes(userSearch.toLowerCase()))
      : allUserNames,
    [allUserNames, userSearch],
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleUser(name: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // ── Filter sims by date range + selected users ──
  const filteredSims = useMemo(() => {
    let result = sims
    if (from || to) {
      result = result.filter((s) => {
        const date = s.Fecha_y_Hora?.split(/[T ]/)[0]
        return date ? inDateRange(date, from, to) : false
      })
    }
    if (selectedUsers.size > 0) {
      result = result.filter((s) => selectedUsers.has(s.Usuario_Nombre))
    }
    return result
  }, [sims, from, to, selectedUsers])

  const dateActive = !!(from || to) || selectedUsers.size > 0

  // Re-derive all stats from filtered sims when date range is active
  const activeKpis     = useMemo(() => dateActive ? computeKPIs(filteredSims, activities, members, admins) : kpis,                            [dateActive, filteredSims, activities, members, admins, kpis])
  const activeActStats = useMemo(() => dateActive ? computeActivityStats(filteredSims, activities) : actStats, [dateActive, filteredSims, activities, actStats])
  const activeScoreDist= useMemo(() => dateActive ? computeScoreDistribution(filteredSims) : scoreDist,        [dateActive, filteredSims, scoreDist])
  const activeUserStats= useMemo(() => dateActive ? computeUserStats(filteredSims) : userStats,                [dateActive, filteredSims, userStats])

  // Recompute trend from filteredSims so user filter + date filter both apply
  const filteredTrend = useMemo(
    () => dateActive ? computeTrend(filteredSims) : (trend ?? []),
    [dateActive, filteredSims, trend],
  )


  // ── CSV exports ─────────────────────────────
  function exportSimCSV() {
    if (!activeKpis) return

    const actMap     = new Map(activities.map((a) => [a.ID_Caso_de_Uso, a]))
    // Map email → member so we can enrich rows with branch/city/region
    const memberMap  = new Map((members ?? []).map((m) => [m.mb_email?.toLowerCase(), m]))
    const periodLabel = (from || to)
      ? `${from || '...'} → ${to || '...'}`
      : (es ? 'Todo el período' : 'All time')
    const scoredSims = filteredSims.filter((s) => s.Calificacion > 0)

    const rows: (string | number)[][] = []

    // ── 1. KPI Summary ───────────────────────────────────────────
    rows.push([es ? '=== RESUMEN GENERAL ===' : '=== SUMMARY KPIs ==='])
    rows.push([es ? 'Período'   : 'Period',   periodLabel])
    rows.push([es ? 'Exportado' : 'Exported', new Date().toLocaleString()])
    rows.push([])
    rows.push([es ? 'Métrica'               : 'Metric',            es ? 'Valor' : 'Value'])
    rows.push([es ? 'Total Simulaciones'    : 'Total Simulations',  activeKpis.totalSimulations])
    rows.push([es ? 'Sesiones Calificadas'  : 'Scored Sessions',    scoredSims.length])
    rows.push([es ? 'Sin Calificación'      : 'Unscored',           activeKpis.totalSimulations - scoredSims.length])
    rows.push([es ? 'Puntaje Promedio'      : 'Average Score',      `${activeKpis.averageScore}%`])
    rows.push([es ? 'Tasa de Aprobación'    : 'Pass Rate',          `${activeKpis.passRate}%`])
    rows.push([es ? 'Aprobados (≥70)'       : 'Passed (≥70)',       activeKpis.passCount])
    rows.push([es ? 'Reprobados (<70)'      : 'Failed (<70)',       activeKpis.failCount])
    rows.push([es ? 'Asesores Activos'      : 'Active Advisors',    activeKpis.activeAdvisors])
    rows.push([])

    // ── 2. Per-Activity ──────────────────────────────────────────
    rows.push([es ? '=== POR ACTIVIDAD ===' : '=== PER ACTIVITY ==='])
    rows.push([
      es ? 'ID Actividad'      : 'Activity ID',
      es ? 'Actividad'         : 'Activity',
      es ? 'Tipo'              : 'Type',
      es ? 'Sesiones'          : 'Sessions',
      es ? 'Puntaje Promedio'  : 'Avg Score',
      es ? 'Tasa Aprobación'   : 'Pass Rate',
      es ? 'Aprobados'         : 'Passed',
      es ? 'Reprobados'        : 'Failed',
    ])
    ;(activeActStats ?? []).forEach((a) => {
      rows.push([a.id, a.name, a.activityType, a.count, `${a.avgScore}%`, `${a.passRate}%`, a.passCount, a.failCount])
    })
    rows.push([])

    // ── 3. Per-Advisor Leaderboard ───────────────────────────────
    rows.push([es ? '=== POR ASESOR ===' : '=== PER ADVISOR ==='])
    rows.push([
      es ? 'Asesor'             : 'Advisor',
      es ? 'Email'              : 'Email',
      es ? 'Región'             : 'Region',
      es ? 'Ciudad'             : 'City',
      es ? 'Sucursal'           : 'Branch',
      es ? 'Línea'              : 'Line',
      es ? 'Simulaciones'       : 'Simulations',
      es ? 'Puntaje Promedio'   : 'Avg Score',
      es ? 'Tasa Aprobación'    : 'Pass Rate',
      es ? 'Mejor Puntaje'      : 'Best Score',
      es ? 'Aprobados'          : 'Passed',
      es ? 'Reprobados'         : 'Failed',
    ])
    ;(activeUserStats ?? []).forEach((u) => {
      const m = memberMap.get((u.userId ?? '').toLowerCase())
      rows.push([
        u.name,
        u.userId ?? '',
        m?.mb_state  ?? '',
        m?.mb_city   ?? '',
        m?.mb_branch ?? '',
        m?.mb_line   ?? '',
        u.count,
        `${u.avgScore}%`,
        `${u.passRate}%`,
        `${u.bestScore}%`,
        u.passCount,
        u.failCount,
      ])
    })
    rows.push([])

    // ── 4. Monthly Trend ─────────────────────────────────────────
    rows.push([es ? '=== TENDENCIA MENSUAL ===' : '=== MONTHLY TREND ==='])
    rows.push([es ? 'Mes' : 'Month', es ? 'Sesiones' : 'Sessions', es ? 'Puntaje Promedio' : 'Avg Score'])
    filteredTrend.forEach((p) => rows.push([p.date, p.count, `${p.avgScore}%`]))
    rows.push([])

    // ── 5. Full Simulation Detail (every session, every field) ───
    rows.push([es ? '=== DETALLE COMPLETO — TODAS LAS SIMULACIONES ===' : '=== FULL DETAIL — ALL SIMULATIONS ==='])
    rows.push([
      'ID_Sim',
      es ? 'Asesor'              : 'Advisor',
      es ? 'Email'               : 'Email',
      es ? 'Región'              : 'Region',
      es ? 'Ciudad'              : 'City',
      es ? 'Sucursal'            : 'Branch',
      es ? 'Línea'               : 'Line',
      es ? 'Actividad'           : 'Activity',
      es ? 'Tipo Actividad'      : 'Activity Type',
      es ? 'Fecha'               : 'Date',
      es ? 'Hora'                : 'Time',
      es ? 'Calificación'        : 'Score',
      es ? 'Estado'              : 'Status',
      es ? 'Diagnóstico Final'   : 'Final Diagnosis',
      es ? 'Puntos_1'            : 'Points_1',
      es ? 'Puntos_2'            : 'Points_2',
      es ? 'Puntos_3'            : 'Points_3',
      es ? 'Puntos_4'            : 'Points_4',
      es ? 'Puntos_5'            : 'Points_5',
      es ? 'Puntos_6'            : 'Points_6',
      es ? 'Puntos_Totales'      : 'Total_Points',
      es ? 'Respuesta_1'         : 'Answer_1',
      es ? 'Respuesta_2'         : 'Answer_2',
      es ? 'Respuesta_3'         : 'Answer_3',
      es ? 'Respuesta_4'         : 'Answer_4',
      es ? 'Respuesta_5'         : 'Answer_5',
      es ? 'Respuesta_6'         : 'Answer_6',
      es ? 'Retroalimentación_1' : 'Feedback_1',
      es ? 'Retroalimentación_2' : 'Feedback_2',
      es ? 'Retroalimentación_3' : 'Feedback_3',
      es ? 'Retroalimentación_4' : 'Feedback_4',
      es ? 'Retroalimentación_5' : 'Feedback_5',
      es ? 'Retroalimentación_6' : 'Feedback_6',
    ])
    filteredSims.forEach((s) => {
      const act    = actMap.get(s.ID_Caso_de_Uso)
      const m      = memberMap.get((s.Usuario ?? '').toLowerCase())
      const status = s.Calificacion > 0
        ? (s.Calificacion >= 70 ? (es ? 'Aprobado' : 'Pass') : (es ? 'Reprobado' : 'Fail'))
        : (es ? 'Sin calificación' : 'Unscored')
      const clean  = (v: string | null | undefined) => (v ?? '').replace(/[\n\r]+/g, ' ').trim()
      const dt     = (s.Fecha_y_Hora ?? '').split('T')
      rows.push([
        s.ID_Sim,
        s.Usuario_Nombre ?? '',
        s.Usuario        ?? '',
        m?.mb_state      ?? '',
        m?.mb_city       ?? '',
        m?.mb_branch     ?? '',
        m?.mb_line       ?? '',
        act?.Caso_de_Uso       ?? `ID ${s.ID_Caso_de_Uso}`,
        act?.Actividad_Nombre  ?? '',
        dt[0] ?? '',
        dt[1]?.slice(0, 5) ?? '',
        s.Calificacion   ?? 0,
        status,
        s.Diagnostico_Final ?? '',
        s.Puntos_1       ?? '',
        s.Puntos_2       ?? '',
        s.Puntos_3       ?? '',
        s.Puntos_4       ?? '',
        s.Puntos_5       ?? '',
        s.Puntos_6       ?? '',
        s.Puntos_Totales ?? 0,
        clean(s.Respuesta_1),
        clean(s.Respuesta_2),
        clean(s.Respuesta_3),
        clean(s.Respuesta_4),
        clean(s.Respuesta_5),
        clean(s.Respuesta_6),
        clean(s.Retroalimentacion_1),
        clean(s.Retroalimentacion_2),
        clean(s.Retroalimentacion_3),
        clean(s.Retroalimentacion_4),
        clean(s.Retroalimentacion_5),
        clean(s.Retroalimentacion_6),
      ])
    })

    downloadCSV(rows, `apotex_completo_${csvDate()}.csv`)
  }

  // exportRpCSV removed — RolPlay not active for Apotex

  // ── Loading / error ──────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5 h-80 skeleton rounded-xl lg:col-span-2" />
          <div className="card p-5 h-80 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !activeKpis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-slate-400">{t('error')}</p>
        <button onClick={refetch} className="btn-primary">{t('retry')}</button>
      </div>
    )
  }

  const passFailData = [
    { name: t('pass'), value: activeKpis!.passCount, color: COLORS.pass },
    { name: t('fail'), value: activeKpis!.failCount, color: COLORS.fail },
  ]

  const topActivities = (activeActStats ?? []).slice(0, 5).map((a) => ({
    name: a.name.length > 24 ? a.name.slice(0, 24) + '...' : a.name,
    count: a.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header + date range + exports */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_overview_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_overview_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            from={from} to={to} onFrom={setFrom} onTo={setTo}
            label={es ? 'Período' : 'Period'}
          />
          {/* User filter dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown((v) => !v)}
              className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-all ${
                selectedUsers.size > 0
                  ? 'text-accent border-accent/40 bg-accent/5'
                  : 'text-slate-400 hover:text-slate-200 border-line/50 hover:border-line'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {selectedUsers.size > 0
                ? `${selectedUsers.size} ${es ? 'asesor(es)' : 'advisor(s)'}`
                : (es ? 'Asesores' : 'Advisors')}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {showUserDropdown && (
              <div className="absolute top-full mt-1 right-0 z-30 w-56 sm:w-64 bg-surface border border-line rounded-xl shadow-elevated overflow-hidden">
                <div className="p-2 border-b border-line/30">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={es ? 'Buscar...' : 'Search...'}
                      className="w-full bg-card border border-line/50 text-slate-300 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                {selectedUsers.size > 0 && (
                  <div className="px-3 py-1.5 border-b border-line/30">
                    <button
                      onClick={() => setSelectedUsers(new Set())}
                      className="text-[11px] text-danger hover:text-red-400 flex items-center gap-1"
                    >
                      <X className="w-2.5 h-2.5" /> {es ? 'Limpiar selección' : 'Clear selection'}
                    </button>
                  </div>
                )}
                <div className="max-h-52 overflow-y-auto">
                  {filteredUserNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleUser(name)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/[0.03] transition-colors ${
                        selectedUsers.has(name) ? 'text-accent' : 'text-slate-400'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                        selectedUsers.has(name) ? 'bg-accent border-accent' : 'border-line'
                      }`}>
                        {selectedUsers.has(name) && <span className="text-white text-[8px] font-bold">✓</span>}
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={exportSimCSV}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-line/50 hover:border-line rounded-lg px-2 sm:px-3 py-1.5 transition-all"
            title="Simulator CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{es ? 'Exportar Todo' : 'Export All'}</span>
          </button>
          {/* RolPlay CSV removed — RolPlay not active for Apotex */}
        </div>
      </div>

      {/* ── FULL Platform Summary (Bridge — ALL 767 sessions, ALL 11 activities) ── */}
      {bridgeOv.data && (
        <div className="rounded-xl border border-violet/30 bg-violet/5 dark:bg-violet/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet mb-3 flex items-center gap-1.5">
            <Brain className="w-3 h-3" />
            {es ? 'Plataforma Completa — Todas las Actividades' : 'Full Platform — All Activities'}
            <span className="ml-2 text-[10px] font-normal text-slate-500 normal-case">
              {es ? '(incluye Visita Médica APECS)' : '(includes Visita Médica APECS)'}
            </span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={PlayCircle}   label={es ? 'Total Sesiones' : 'Total Sessions'}    value={bridgeOv.data.total_sessions}   sub={es ? 'todas actividades' : 'all activities'} color="violet" />
            <KpiCard icon={Users}        label={es ? 'Usuarios Activos' : 'Active Users'}     value={bridgeOv.data.unique_users}     sub={es ? 'con al menos 1 sesión' : 'with ≥1 session'} color="indigo" />
            <KpiCard icon={BarChart3}    label={es ? 'Promedio Global' : 'Global Avg'}        value={`${bridgeOv.data.avg_score}%`}  sub={es ? 'todas actividades' : 'all activities'} color="accent" />
            <KpiCard icon={CheckCircle2} label={es ? 'Tasa Aprobación' : 'Pass Rate'}         value={`${bridgeOv.data.pass_rate_pct}%`} sub={es ? 'umbral ≥70%' : 'threshold ≥70%'} color="pass" />
            <KpiCard icon={Users}        label={es ? 'Miembros' : 'Members'}                  value={bridgeOv.data.total_members}   sub={es ? 'plataforma' : 'platform'} color="indigo" />
            <KpiCard icon={Brain}        label={es ? 'Actividades Activas' : 'Active Activities'} value={bridgeOv.data.active_activities} sub={es ? 'todas actividades' : 'all activities'} color="violet" />
          </div>
        </div>
      )}

      {/* ── Coaching Simulator KPIs (6 IDs via simulador_Asistentes) ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1.5">
          <PlayCircle className="w-3 h-3" />
          {es ? 'Simulador de Coaching (Q&A detallado)' : 'Coaching Simulator (detailed Q&A)'}
          <span className="ml-2 text-[10px] font-normal normal-case text-slate-500">
            {es ? 'DM + Coach Evaluador + Coach Maestro' : 'DM + Coach Evaluador + Coach Maestro'}
          </span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={PlayCircle}   label={t('kpi_total_sims')}      value={activeKpis!.totalSimulations}   sub={t('sub_across_activities')} color="accent" />
          <KpiCard icon={BarChart3}    label={t('kpi_avg_score')}       value={`${activeKpis!.averageScore}%`} sub={t('sub_overall')}           color="violet" />
          <KpiCard icon={CheckCircle2} label={t('kpi_pass_rate')}       value={`${activeKpis!.passRate}%`}     sub={t('sub_sessions_passed')}   color="pass" />
          <KpiCard icon={Users}        label={t('kpi_active_advisors')} value={activeKpis!.activeAdvisors}     sub={t('sub_with_simulations')}  color="indigo" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">{t('score_trend')}</h3>
            {dateActive && (
              <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                {filteredSims.length} {es ? 'sims filtradas' : 'filtered sims'}
              </span>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<TrendTooltip es={es} c={tt} />} wrapperStyle={{ zIndex: 50, outline: 'none' }} cursor={{ stroke: c.cursorStroke, strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="avgScore" stroke={COLORS.accent} strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('pass_fail_dist')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={passFailData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {passFailData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PassFailTooltip c={tt} />} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {passFailData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('activity_breakdown')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topActivities} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 'dataMax + 5']} hide />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                <Tooltip content={<ActivityTooltip es={es} c={tt} />} wrapperStyle={{ zIndex: 50, outline: 'none' }} cursor={{ fill: c.cursorFill }} />
                <Bar dataKey="count" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">{t('top_performers')}</h3>
            <Link to="/leaderboard" className="text-xs text-accent hover:underline">{t('view_all')}</Link>
          </div>
          <div className="space-y-2">
            {(activeUserStats ?? []).slice(0, 5).map((u, i) => (
              <div key={u.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-500/15 text-yellow-500' :
                  i === 1 ? 'bg-slate-400/15 text-slate-300' :
                  i === 2 ? 'bg-orange-500/15 text-orange-400' :
                  'bg-surface text-slate-600'
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-600">{u.count} {t('simulations_count')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{u.avgScore}%</p>
                  <p className="text-[11px] text-slate-600">{u.passRate}% {t('pass')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">{t('score_distribution')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeScoreDist ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip content={<ScoreDistTooltip es={es} c={tt} />} wrapperStyle={{ zIndex: 50, outline: 'none' }} cursor={{ fill: c.cursorFill }} />
              <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub: string
  color: 'accent' | 'violet' | 'pass' | 'indigo'
}) {
  const colorMap = {
    accent: 'text-accent bg-accent/10', violet: 'text-violet bg-violet/10',
    pass:   'text-success bg-success/10', indigo: 'text-indigo bg-indigo/10',
  }
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-base)' }}>{value}</p>
          <p className="text-[11px] text-slate-600 mt-1 truncate">{sub}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
