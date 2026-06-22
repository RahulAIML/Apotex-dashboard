import { useState, useMemo, useRef, useEffect } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  computeKPIs, computeActivityStats, computeUserStats, computeScoreDistribution, computeTrend,
} from '../lib/analytics'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { DateRangeFilter, inDateRange, simDate } from '../components/ui/DateRangeFilter'
import { downloadCSV, csvDate } from '../lib/csvExport'
import {
  BarChart3, PlayCircle, CheckCircle2, Users, Brain,
  Download, Search, ChevronDown, X, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, ArrowUpRight,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts'
import { Link } from 'react-router-dom'
import { LoadingState } from '../components/ui/LoadingState'

const RED    = '#DC2626'
const PINK   = '#FCA5A5'
const GRAY   = '#94a3b8'
const GREEN  = '#10B981'

// ── Utility ────────────────────────────────────────────────────────────────

function dateMinus(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function trendPct(current: number, prev: number): number | null {
  if (!prev) return null
  return Math.round(((current - prev) / prev) * 100)
}

// ── Tooltip components ─────────────────────────────────────────────────────

function TrendTooltip({ active, payload, label, es }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl border border-white/10 min-w-[170px]">
      <p className="font-semibold text-gray-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-gray-400">{p.name === 'current' ? (es ? 'Este período' : 'This period') : p.name === 'previous' ? (es ? 'Período anterior' : 'Previous period') : 'Goal'}</span>
          </span>
          <span className="font-bold">{p.value != null ? `${p.value}%` : '—'}</span>
        </div>
      ))}
    </div>
  )
}

function DonutTooltip({ active, payload, es }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      <p className="font-semibold">{d.name}: {d.value}</p>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub: string
  trend: number | null
  color: 'red' | 'blue' | 'green' | 'violet'
}

const COLOR_MAP = {
  red:    { bg: 'bg-red-50',    icon: 'text-red-500 bg-red-100',    value: 'text-gray-900' },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500 bg-blue-100',  value: 'text-gray-900' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-500 bg-green-100', value: 'text-gray-900' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-500 bg-violet-100', value: 'text-gray-900' },
}

function KpiCard({ icon: Icon, label, value, sub, trend, color }: KpiCardProps) {
  const c = COLOR_MAP[color]
  const isUp = trend !== null && trend > 0
  const isDown = trend !== null && trend < 0
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-none mb-2">{value}</p>
      <div className="flex items-center gap-1.5">
        {trend !== null ? (
          <>
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-gray-400'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
              {isUp ? '+' : ''}{trend}%
            </span>
            <span className="text-[11px] text-gray-400">{sub}</span>
          </>
        ) : (
          <span className="text-[11px] text-gray-400">{sub}</span>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const es = language === 'es'

  const { isLoading, isError, kpis, trend, actStats, userStats, sims, activities, members, admins, refetch } = useDashboardData()

  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [trendGroup, setTrendGroup] = useState<'daily' | 'weekly' | 'monthly'>('daily')
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node))
        setShowUserDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleUser(name: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const filteredSims = useMemo(() => {
    let r = sims
    if (from || to) r = r.filter((s) => inDateRange(s.Fecha_y_Hora, from, to))
    if (selectedUsers.size > 0) r = r.filter((s) => selectedUsers.has(s.Usuario_Nombre))
    return r
  }, [sims, from, to, selectedUsers])

  const dateActive = !!(from || to) || selectedUsers.size > 0

  const activeKpis     = useMemo(() => dateActive ? computeKPIs(filteredSims, activities, members, admins) : kpis, [dateActive, filteredSims, activities, members, admins, kpis])
  const activeActStats = useMemo(() => dateActive ? computeActivityStats(filteredSims, activities) : actStats, [dateActive, filteredSims, activities, actStats])
  const activeUserStats= useMemo(() => dateActive ? computeUserStats(filteredSims) : userStats, [dateActive, filteredSims, userStats])
  const filteredTrend  = useMemo(() => dateActive ? computeTrend(filteredSims) : (trend ?? []), [dateActive, filteredSims, trend])

  // ── Previous period for KPI trend indicators ─────────────────────────────
  const prevKpis = useMemo(() => {
    if (isLoading || !sims.length) return null
    const allDates = sims.map(s => simDate(s.Fecha_y_Hora)).filter(Boolean).sort()
    const latest = allDates[allDates.length - 1]
    if (!latest) return null
    const curFrom  = dateMinus(latest, 29)
    const prevFrom = dateMinus(latest, 59)
    const prevTo   = dateMinus(latest, 30)
    const prevSims = sims.filter(s => inDateRange(s.Fecha_y_Hora, prevFrom, prevTo))
    const curSims  = sims.filter(s => inDateRange(s.Fecha_y_Hora, curFrom, latest))
    if (!prevSims.length || !curSims.length) return null
    return {
      current:  computeKPIs(curSims,  activities, members, admins),
      previous: computeKPIs(prevSims, activities, members, admins),
    }
  }, [isLoading, sims, activities, members, admins])

  // ── Merged trend (current + previous period, aligned by index) ────────────
  const mergedTrend = useMemo(() => {
    if (!filteredTrend.length) return []
    const allDates = sims.map(s => simDate(s.Fecha_y_Hora)).filter(Boolean).sort()
    const latest = allDates[allDates.length - 1]
    if (!latest) return filteredTrend.map(p => ({ ...p, previous: null as number | null, goal: 70 }))

    const curFrom  = dateActive && from ? from : dateMinus(latest, 29)
    const curTo    = dateActive && to   ? to   : latest
    const duration = Math.max(1, Math.round((new Date(curTo).getTime() - new Date(curFrom).getTime()) / 86400000))
    const prevFrom = dateMinus(curFrom, duration)
    const prevTo   = dateMinus(curFrom, 1)
    const prevSims = sims.filter(s => inDateRange(s.Fecha_y_Hora, prevFrom, prevTo))
    const prevTrend = computeTrend(prevSims)

    return filteredTrend.map((p, i) => ({
      date:     p.date,
      current:  p.avgScore,
      previous: prevTrend[i]?.avgScore ?? null,
      goal:     70,
    }))
  }, [filteredTrend, sims, dateActive, from, to])

  // ── Activity progress bars ────────────────────────────────────────────────
  const activityBars = useMemo(() => {
    if (!activeActStats?.length) return []
    const maxCount = Math.max(...activeActStats.map(a => a.count), 1)
    return activeActStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(a => ({
        name: a.name.length > 28 ? a.name.slice(0, 28) + '…' : a.name,
        count: a.count,
        pct: Math.round((a.count / maxCount) * 100),
        passRate: a.passRate,
      }))
  }, [activeActStats])

  // ── Pass/Fail donut data ──────────────────────────────────────────────────
  const donutData = useMemo(() => [
    { name: es ? 'Aprobados'   : 'Approved',    value: activeKpis?.passCount ?? 0, color: RED   },
    { name: es ? 'Reprobados'  : 'Disapproved', value: activeKpis?.failCount ?? 0, color: PINK  },
  ], [activeKpis, es])

  // ── AI Insights ───────────────────────────────────────────────────────────
  const aiInsights = useMemo(() => {
    if (!activeActStats?.length || !activeKpis) return null
    const weakest = [...activeActStats].sort((a, b) => a.passRate - b.passRate)[0]
    const weakPct = weakest ? Math.round(100 - weakest.passRate) : 0
    return {
      warning: es
        ? `${weakPct}% de los asesores necesitan refuerzo en ${weakest?.name ?? '—'}.`
        : `${weakPct}% of advisors need reinforcement in ${weakest?.name ?? '—'}.`,
      recommendation: es
        ? `Asigna más sesiones de "${weakest?.name ?? '—'}" para mejorar el equipo.`
        : `Assign more "${weakest?.name ?? '—'}" sessions to strengthen the team.`,
    }
  }, [activeActStats, activeKpis, es])

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportSimCSV() {
    if (!activeKpis) return
    const actMap    = new Map(activities.map((a) => [a.ID_Caso_de_Uso, a]))
    const memberMap = new Map((members ?? []).map((m) => [m.mb_email?.toLowerCase(), m]))
    const periodLabel = (from || to) ? `${from || '...'} → ${to || '...'}` : (es ? 'Todo el período' : 'All time')
    const scoredSims  = filteredSims.filter((s) => s.Calificacion > 0)
    const rows: (string | number)[][] = []
    rows.push([es ? '=== RESUMEN GENERAL ===' : '=== SUMMARY KPIs ==='])
    rows.push([es ? 'Período' : 'Period', periodLabel])
    rows.push([es ? 'Exportado' : 'Exported', new Date().toLocaleString()])
    rows.push([])
    rows.push([es ? 'Métrica' : 'Metric', es ? 'Valor' : 'Value'])
    rows.push([es ? 'Total Simulaciones' : 'Total Simulations', activeKpis.totalSimulations])
    rows.push([es ? 'Puntaje Promedio'   : 'Average Score',     `${activeKpis.averageScore}%`])
    rows.push([es ? 'Tasa de Aprobación' : 'Pass Rate',         `${activeKpis.passRate}%`])
    rows.push([es ? 'Asesores Activos'   : 'Active Advisors',   activeKpis.activeAdvisors])
    rows.push([])
    rows.push([es ? '=== DETALLE ===' : '=== DETAIL ==='])
    rows.push(['ID', es ? 'Asesor' : 'Advisor', es ? 'Actividad' : 'Activity', es ? 'Fecha' : 'Date', es ? 'Puntaje' : 'Score', es ? 'Estado' : 'Status'])
    filteredSims.forEach(s => {
      const act    = actMap.get(s.ID_Caso_de_Uso)
      const m      = memberMap.get((s.Usuario ?? '').toLowerCase())
      const status = s.Calificacion > 0 ? (s.Calificacion >= 70 ? (es ? 'Aprobado' : 'Pass') : (es ? 'Reprobado' : 'Fail')) : '—'
      rows.push([s.ID_Sim, s.Usuario_Nombre ?? '', act?.Caso_de_Uso ?? `ID ${s.ID_Caso_de_Uso}`, simDate(s.Fecha_y_Hora), s.Calificacion ?? 0, status])
    })
    downloadCSV(rows, `dashboard_${csvDate()}.csv`)
  }

  if (isLoading) return <LoadingState />
  if (isError || !activeKpis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-400">{t('error')}</p>
        <button onClick={refetch} className="btn-primary">{t('retry')}</button>
      </div>
    )
  }

  const vsPrev = (cur: number, prevVal: number | undefined) =>
    prevVal !== undefined ? trendPct(cur, prevVal) : null

  const subLabel = es ? 'vs mes anterior' : 'vs previous month'

  return (
    <div className="space-y-5">

      {/* ── Welcome banner ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {es ? 'Bienvenido a tu dashboard' : 'Welcome your dashboard'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {es
            ? `Tu equipo ha completado ${activeKpis.totalSimulations} simulaciones.`
            : `Your team has completed ${activeKpis.totalSimulations} simulations.`}
        </p>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

        {/* Advisor multi-select */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(v => !v)}
            className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-all ${
              selectedUsers.size > 0
                ? 'text-accent border-accent/40 bg-accent/5'
                : 'text-gray-500 hover:text-gray-800 border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {selectedUsers.size > 0
              ? `${selectedUsers.size} ${es ? 'asesor(es)' : 'advisor(s)'}`
              : (es ? 'Asesores' : 'Advisors')}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showUserDropdown && (
            <div className="absolute top-full mt-1 right-0 z-30 w-56 sm:w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={es ? 'Buscar...' : 'Search...'}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              {selectedUsers.size > 0 && (
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <button onClick={() => setSelectedUsers(new Set())} className="text-[11px] text-red-500 flex items-center gap-1">
                    <X className="w-2.5 h-2.5" /> {es ? 'Limpiar selección' : 'Clear selection'}
                  </button>
                </div>
              )}
              <div className="max-h-52 overflow-y-auto">
                {filteredUserNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleUser(name)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${selectedUsers.has(name) ? 'text-accent' : 'text-gray-600'}`}
                  >
                    <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${selectedUsers.has(name) ? 'bg-accent border-accent' : 'border-gray-300'}`}>
                      {selectedUsers.has(name) && <span className="text-white text-[8px] font-bold">✓</span>}
                    </span>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={exportSimCSV}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          {es ? 'Exportar Todo' : 'Export All'}
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          icon={PlayCircle}
          label={t('kpi_total_sims')}
          value={activeKpis.totalSimulations}
          sub={subLabel}
          trend={vsPrev(activeKpis.totalSimulations, prevKpis?.previous.totalSimulations)}
          color="red"
        />
        <KpiCard
          icon={BarChart3}
          label={t('kpi_avg_score')}
          value={`${activeKpis.averageScore}%`}
          sub={subLabel}
          trend={vsPrev(activeKpis.averageScore, prevKpis?.previous.averageScore)}
          color="violet"
        />
        <KpiCard
          icon={CheckCircle2}
          label={t('kpi_pass_rate')}
          value={`${activeKpis.passRate}%`}
          sub={subLabel}
          trend={vsPrev(activeKpis.passRate, prevKpis?.previous.passRate)}
          color="green"
        />
        <KpiCard
          icon={Users}
          label={t('kpi_active_advisors')}
          value={activeKpis.activeAdvisors}
          sub={subLabel}
          trend={vsPrev(activeKpis.activeAdvisors, prevKpis?.previous.activeAdvisors)}
          color="blue"
        />
        <KpiCard
          icon={Brain}
          label={es ? 'Actividades' : 'Activities'}
          value={activeKpis.totalActivities}
          sub={es ? 'ejercicios disponibles' : 'available exercises'}
          trend={null}
          color="violet"
        />
        <KpiCard
          icon={Users}
          label={es ? 'Miembros' : 'Members'}
          value={activeKpis.totalMembers}
          sub={es ? 'en plataforma' : 'on platform'}
          trend={null}
          color="red"
        />
      </div>

      {/* ── Score Trend + Donut ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Score trend (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">{t('score_trend')}</h3>
              {dateActive && (
                <span className="text-[11px] text-accent">{filteredSims.length} {es ? 'sims filtradas' : 'filtered sims'}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-red-500 inline-block rounded" />{es ? 'Este período' : 'This period'}</span>
                <span className="flex items-center gap-1"><span className="w-5 h-0.5 border-t-2 border-dashed border-gray-400 inline-block" />{es ? 'Anterior' : 'Previous'}</span>
                <span className="flex items-center gap-1"><span className="w-5 h-0.5 border-t-2 border-dashed border-green-400 inline-block" />Goal</span>
              </div>
              {/* Time granularity selector */}
              <select
                value={trendGroup}
                onChange={e => setTrendGroup(e.target.value as typeof trendGroup)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:border-accent"
              >
                <option value="daily">{es ? 'Diario' : 'Daily'}</option>
                <option value="weekly">{es ? 'Semanal' : 'Weekly'}</option>
                <option value="monthly">{es ? 'Mensual' : 'Monthly'}</option>
              </select>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<TrendTooltip es={es} />} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
                <ReferenceLine y={70} stroke="#10B981" strokeDasharray="4 3" strokeWidth={1.5} />
                <Line type="monotone" dataKey="previous" stroke={GRAY} strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />
                <Line type="monotone" dataKey="current"  stroke={RED}  strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval donut (1/3 width) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-1">{es ? 'Aprobación vs. Reprobación' : 'Approval vs. Disapproval'}</h3>
          <p className="text-[11px] text-gray-400 mb-3">{es ? `Total: ${activeKpis.totalSimulations} simulaciones` : `Total: ${activeKpis.totalSimulations} simulations`}</p>

          <div className="flex items-center gap-4">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<DonutTooltip es={es} />} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-bold text-gray-900 leading-none">{activeKpis.passRate}%</p>
                <p className="text-[10px] text-gray-500 leading-tight text-center">{es ? 'Tasa de\naprobación' : 'Approval\nRate'}</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: RED }} />
                  <span className="text-xs font-medium text-gray-600">{es ? 'Aprobados' : 'Approved'}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 pl-4">{activeKpis.passCount}</p>
                <p className="text-xs text-gray-400 pl-4">{activeKpis.passRate}%</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PINK }} />
                  <span className="text-xs font-medium text-gray-600">{es ? 'Reprobados' : 'Disapproved'}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 pl-4">{activeKpis.failCount}</p>
                <p className="text-xs text-gray-400 pl-4">{100 - activeKpis.passRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity bars + Top Advisors + AI Insights ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity progress bars */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">{t('activity_breakdown')}</h3>
          <div className="space-y-3.5">
            {activityBars.map((a) => (
              <div key={a.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700 truncate pr-2">{a.name}</span>
                  <span className="text-xs font-semibold text-gray-600 shrink-0">{a.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${a.pct}%`, background: RED }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/activities"
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 rounded-lg py-2 hover:bg-accent/5 transition-colors"
          >
            {es ? 'Ver todas las actividades' : 'View all activities'}
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Top Advisors */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">{t('top_performers')}</h3>
            <Link to="/leaderboard" className="text-xs font-semibold text-accent hover:underline flex items-center gap-0.5">
              {t('view_all')} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(activeUserStats ?? []).slice(0, 5).map((u, i) => {
              const medalColor = i === 0 ? '#F59E0B' : i === 1 ? '#94a3b8' : i === 2 ? '#F97316' : '#d1d5db'
              return (
                <div key={u.name} className="flex items-center gap-3">
                  {/* Avatar with rank */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: RED }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm"
                      style={{ background: medalColor }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  {/* Name + sims */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                    <p className="text-[11px] text-gray-400">{u.count} {t('simulations_count')}</p>
                  </div>
                  {/* Score + pass rate */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{u.avgScore}%</p>
                    <p className="text-[11px] font-medium" style={{ color: GREEN }}>↑ {u.passRate}% {es ? 'Aprob.' : 'Appr.'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">{t('ai_insights')}</h3>
            <Link to="/coaching" className="text-xs font-semibold text-accent hover:underline flex items-center gap-0.5">
              {es ? 'Ver todo' : 'View all'} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {aiInsights ? (
            <div className="space-y-3">
              {/* Warning insight */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  {aiInsights.warning.split(/([\w\s]+(?:Objec|Apec|Arabrixen|Apodrolen|Cluminol|Divertex|Periamid|Parkinson|Neristren|Productos|APECS|Evaluaci)[^\.]*)/).map((part, i) =>
                    i % 2 === 1
                      ? <strong key={i} className="text-accent font-semibold">{part}</strong>
                      : part
                  )}
                </p>
              </div>
              {/* Recommendation */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                    {es ? 'Recomendación' : 'Recommendation'}
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">{aiInsights.recommendation}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">{es ? 'Sin datos suficientes.' : 'Insufficient data.'}</p>
          )}
        </div>
      </div>

    </div>
  )
}
