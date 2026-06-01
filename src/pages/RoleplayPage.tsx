/**
 * Apotex — Bridge Analytics Page
 * Direct DB data via PHP bridge → rolplay_apotex_robin
 * KPIs: sessions, scores, completion rate, assignments, login activity
 */
import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import {
  Activity, Users, TrendingUp, CheckCircle,
  Clock, Download, RefreshCw, AlertCircle,
} from 'lucide-react'
import { useBridgeData } from '../api/roleplayQueries'
import { useAppStore } from '../store'
import { TableSkeleton, KPICardSkeleton } from '../components/ui/Skeleton'
import { PageHeader } from '../components/ui/PageHeader'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { downloadCSV } from '../lib/csvExport'
import type { BridgeActivityStat } from '../api/roleplayTypes'

const csvDate = () => new Date().toISOString().split('T')[0]

const TYPE_COLORS: Record<string, string> = {
  'Coach evaluador':     '#6366f1',
  'Coach maestro':       '#8b5cf6',
  'Visita Medica APECS': '#10b981',
}
const typeColor = (t: string) =>
  Object.entries(TYPE_COLORS).find(([k]) => t.includes(k.split(' ')[1] ?? k))?.[1] ?? '#3b82f6'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: 'blue' | 'green' | 'violet' | 'amber' | 'red' | 'indigo'
}
function KpiCard({ label, value, sub, icon: Icon, color = 'blue' }: KpiCardProps) {
  const bgMap = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    green: 'bg-emerald-50 dark:bg-emerald-950',
    violet: 'bg-violet-50 dark:bg-violet-950',
    amber: 'bg-amber-50 dark:bg-amber-950',
    red: 'bg-red-50 dark:bg-red-950',
    indigo: 'bg-indigo-50 dark:bg-indigo-950',
  }
  const icMap = {
    blue: 'text-blue-600', green: 'text-emerald-600', violet: 'text-violet-600',
    amber: 'text-amber-600', red: 'text-red-600', indigo: 'text-indigo-600',
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgMap[color]}`}>
          <Icon className={`w-5 h-5 ${icMap[color]}`} />
        </div>
      </div>
    </div>
  )
}

export default function RoleplayPage() {
  const { language } = useAppStore()
  const es = language === 'es'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [dateFrom, dateTo],
  )

  const bd = useBridgeData(params as { date_from?: string; date_to?: string })
  const ov = bd.overview
  const activities: BridgeActivityStat[] = bd.activities

  const exportActivities = () => {
    downloadCSV(
      activities.map(a => ({
        ID: a.activity_id,
        Actividad: a.activity_name,
        Tipo: a.activity_type,
        Sesiones: a.sessions,
        Usuarios: a.unique_users,
        Promedio: a.avg_score,
        Aprobados: a.sessions_pass,
        PctAprobacion: a.pass_rate_pct,
        Asignados: a.assigned_users,
      })),
      `apotex_activities_${csvDate()}.csv`,
    )
  }

  const exportLeaderboard = () => {
    downloadCSV(
      bd.leaderboard.map((u, i) => ({
        Rank: i + 1,
        Nombre: u.name,
        Email: u.email,
        Sesiones: u.sessions,
        Promedio: u.avg_score,
        Mejor: u.best_score,
        Aprobados: u.sessions_pass,
        UltimaSesion: u.last_session,
      })),
      `apotex_users_${csvDate()}.csv`,
    )
  }

  if (bd.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title={es ? 'Analytics Avanzado' : 'Advanced Analytics'}
          icon={TrendingUp}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={8} />
      </div>
    )
  }

  if (bd.isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-3 text-slate-500">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p>{es ? 'Error cargando datos del bridge' : 'Error loading bridge data'}</p>
        <button
          onClick={bd.refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          {es ? 'Reintentar' : 'Retry'}
        </button>
      </div>
    )
  }

  const passRate = ov?.pass_rate_pct ?? 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={es ? 'Analytics Avanzado — Bridge' : 'Advanced Analytics — Bridge'}
          subtitle={
            es
              ? 'Datos en tiempo real desde rolplay_apotex_robin'
              : 'Real-time data from rolplay_apotex_robin'
          }
          icon={TrendingUp}
        />
        <div className="flex gap-2 flex-wrap">
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFrom={setDateFrom}
            onTo={setDateTo}
          />
          <button
            onClick={exportActivities}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            <Download className="w-4 h-4" />
            {es ? 'Actividades' : 'Activities'}
          </button>
          <button
            onClick={exportLeaderboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            <Download className="w-4 h-4" />
            {es ? 'Usuarios' : 'Users'}
          </button>
          <button
            onClick={bd.refetch}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label={es ? 'Sesiones' : 'Sessions'}
          value={ov?.total_sessions ?? 0}
          icon={Activity}
          color="blue"
        />
        <KpiCard
          label={es ? 'Usuarios Activos' : 'Active Users'}
          value={ov?.unique_users ?? 0}
          icon={Users}
          color="indigo"
        />
        <KpiCard
          label={es ? 'Promedio' : 'Avg Score'}
          value={`${ov?.avg_score ?? 0}%`}
          icon={TrendingUp}
          color="violet"
        />
        <KpiCard
          label={es ? 'Tasa Aprobación' : 'Pass Rate'}
          value={`${passRate}%`}
          icon={CheckCircle}
          color="green"
        />
        <KpiCard
          label={es ? 'Miembros' : 'Members'}
          value={ov?.total_members ?? 0}
          icon={Users}
          color="amber"
        />
        <KpiCard
          label={es ? 'Logins' : 'Logins'}
          value={ov?.total_logins ?? 0}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Trend + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {es ? 'Tendencia Mensual de Calificaciones' : 'Monthly Score Trend'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={bd.trend}>
              <defs>
                <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, es ? 'Promedio' : 'Avg']}
              />
              <Area
                type="monotone"
                dataKey="avg_score"
                stroke="#6366f1"
                fill="url(#gradScore)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 self-start">
            {es ? 'Aprobados vs Reprobados' : 'Pass vs Fail'}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: es ? 'Aprobados' : 'Pass', value: ov?.sessions_pass ?? 0 },
                  { name: es ? 'Reprobados' : 'Fail', value: ov?.sessions_fail ?? 0 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold text-emerald-600 -mt-4">{passRate}%</p>
        </div>
      </div>

      {/* Activity Summary Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {es ? 'Rendimiento por Actividad' : 'Performance by Activity'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {[
                  es ? 'Actividad' : 'Activity',
                  es ? 'Tipo' : 'Type',
                  es ? 'Sesiones' : 'Sessions',
                  es ? 'Usuarios' : 'Users',
                  es ? 'Promedio' : 'Avg',
                  es ? 'Aprobados' : 'Pass',
                  es ? '% Aprobación' : 'Pass %',
                  es ? 'Asignados' : 'Assigned',
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map(a => (
                <tr
                  key={a.activity_id}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                    {a.activity_name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ background: typeColor(a.activity_type) }}
                    >
                      {a.activity_type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{a.sessions}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{a.unique_users}</td>
                  <td
                    className="px-3 py-2.5 font-semibold"
                    style={{ color: (a.avg_score ?? 0) >= 70 ? '#16a34a' : '#dc2626' }}
                  >
                    {a.avg_score != null ? `${a.avg_score}%` : '–'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{a.sessions_pass}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${a.pass_rate_pct}%`,
                            background:
                              a.pass_rate_pct >= 70
                                ? '#16a34a'
                                : a.pass_rate_pct >= 50
                                  ? '#d97706'
                                  : '#dc2626',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">{a.pass_rate_pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                    {a.assigned_users}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {es ? 'Distribución de Calificaciones' : 'Score Distribution'}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bd.distribution} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(v: number, _: string, p: { payload: { pct: number } }) => [
                  `${v} (${p.payload.pct}%)`,
                  es ? 'Sesiones' : 'Sessions',
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {bd.distribution.map((d, i) => (
                  <Cell
                    key={i}
                    fill={parseInt(d.range.split('-')[0]) >= 70 ? '#10b981' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {es ? 'Tasa de Completitud' : 'Completion Rate'}
          </h3>
          <div className="space-y-3">
            {bd.completion.map(c => (
              <div key={c.activity_id} className="flex items-center gap-3">
                <div className="w-40 text-xs text-slate-600 dark:text-slate-400 truncate shrink-0">
                  {c.activity_name}
                </div>
                <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-700"
                    style={{ width: `${c.completion_pct}%` }}
                  />
                </div>
                <div className="text-xs font-semibold w-20 text-right shrink-0 text-slate-700 dark:text-slate-300">
                  {c.completed}/{c.assigned} ({c.completion_pct}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {es ? 'Top Usuarios por Calificación' : 'Top Users by Score'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {[
                  '#',
                  es ? 'Nombre' : 'Name',
                  'Email',
                  es ? 'Sesiones' : 'Sessions',
                  es ? 'Promedio' : 'Avg',
                  es ? 'Mejor' : 'Best',
                  es ? 'Aprobados' : 'Pass',
                  es ? 'Sucursal' : 'Branch',
                  es ? 'Última Sesión' : 'Last Session',
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bd.leaderboard.slice(0, 30).map((u, i) => (
                <tr
                  key={u.mb_id}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                    {u.name}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{u.email || '–'}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{u.sessions}</td>
                  <td
                    className="px-3 py-2.5 font-semibold"
                    style={{ color: u.avg_score >= 70 ? '#16a34a' : '#dc2626' }}
                  >
                    {u.avg_score}%
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                    {u.best_score}%
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                    {u.sessions_pass}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{u.branch || '–'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">
                    {u.last_session?.split('T')[0] || '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Login Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {es ? 'Actividad de Login por Mes' : 'Monthly Login Activity'}
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={[...bd.logins]
              .filter(l => l.user_type === 'user')
              .sort((a, b) => a.month.localeCompare(b.month))
              .slice(-12)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="logins" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
