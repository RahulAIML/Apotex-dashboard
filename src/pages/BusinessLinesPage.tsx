import { useState, useMemo, Fragment } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { GitBranch, Users, BarChart3, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { cn } from '../lib/cn'
import type { Member, Simulation } from '../api/types'

const PASS = 70

interface LineStat {
  line: string
  memberCount: number
  simCount: number
  avgScore: number
  passRate: number
  scoredCount: number
  branches: { name: string; memberCount: number; simCount: number; avgScore: number }[]
}

function computeLineStats(members: Member[], sims: Simulation[]): LineStat[] {
  const byEmail = new Map<string, Member>()
  members.forEach(m => byEmail.set((m.mb_email ?? '').toLowerCase(), m))

  const lineMembers = new Map<string, Member[]>()
  const lineSims    = new Map<string, Simulation[]>()

  members.forEach(m => {
    const line = (m.mb_line || 'Sin Línea').trim() || 'Sin Línea'
    if (!lineMembers.has(line)) { lineMembers.set(line, []); lineSims.set(line, []) }
    lineMembers.get(line)!.push(m)
  })

  sims.forEach(s => {
    const m = byEmail.get((s.Usuario || '').toLowerCase())
    if (!m) return
    const line = (m.mb_line || 'Sin Línea').trim() || 'Sin Línea'
    if (lineSims.has(line)) lineSims.get(line)!.push(s)
  })

  return Array.from(lineMembers.entries()).map(([line, mems]) => {
    const simList   = lineSims.get(line) ?? []
    const scored    = simList.filter(s => s.Calificacion != null && s.Calificacion > 0)
    const passCount = simList.filter(s => s.Calificacion != null && s.Calificacion >= PASS).length
    const avgScore  = scored.length ? Math.round(scored.reduce((a, s) => a + s.Calificacion, 0) / scored.length) : 0
    const passRate  = scored.length ? Math.round(passCount / scored.length * 100) : 0

    // branch breakdown
    const brMap = new Map<string, { mems: Member[]; sims: Simulation[] }>()
    mems.forEach(m => {
      const br = (m.mb_branch || 'Sin Sucursal').trim() || 'Sin Sucursal'
      if (!brMap.has(br)) brMap.set(br, { mems: [], sims: [] })
      brMap.get(br)!.mems.push(m)
    })
    simList.forEach(s => {
      const m = byEmail.get((s.Usuario || '').toLowerCase())
      if (!m) return
      const br = (m.mb_branch || 'Sin Sucursal').trim() || 'Sin Sucursal'
      if (brMap.has(br)) brMap.get(br)!.sims.push(s)
    })
    const branches = Array.from(brMap.entries()).map(([name, d]) => {
      const sc = d.sims.filter(s => s.Calificacion != null && s.Calificacion > 0)
      return {
        name,
        memberCount: d.mems.length,
        simCount:    d.sims.length,
        avgScore:    sc.length ? Math.round(sc.reduce((a, s) => a + s.Calificacion, 0) / sc.length) : 0,
      }
    }).sort((a, b) => b.avgScore - a.avgScore)

    return { line, memberCount: mems.length, simCount: simList.length, avgScore, passRate, scoredCount: scored.length, branches }
  }).filter(l => l.memberCount > 0).sort((a, b) => b.simCount - a.simCount)
}

export default function BusinessLinesPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { isLoading, isError, members, sims } = useDashboardData()
  const es = language === 'es'
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const lines = useMemo(() => computeLineStats(members, sims), [members, sims])

  const totalAdvisors = lines.reduce((a, l) => a + l.memberCount, 0)
  const withScore     = lines.filter(l => l.avgScore > 0)
  const overallAvg    = withScore.length
    ? Math.round(withScore.reduce((a, l) => a + l.avgScore, 0) / withScore.length)
    : 0
  const topLine = [...lines].sort((a, b) => b.simCount - a.simCount)[0]?.line ?? '—'

  const chartData = withScore
    .slice()
    .sort((a, b) => b.avgScore - a.avgScore)
    .map(l => ({ name: l.line, score: l.avgScore }))

  function toggle(line: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(line) ? next.delete(line) : next.add(line)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_lines_title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_lines_subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="card h-20 skeleton rounded-xl" />)}
        </div>
        <div className="card h-72 skeleton rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-slate-500">{es ? 'Error al cargar datos.' : 'Failed to load data.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-fade">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_lines_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_lines_subtitle')}</p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: GitBranch, label: es ? 'Líneas de Negocio' : 'Business Lines',     value: String(lines.length),   color: 'text-accent' },
          { icon: Users,     label: es ? 'Asesores Asignados' : 'Assigned Advisors', value: String(totalAdvisors),  color: 'text-cyan' },
          { icon: BarChart3, label: es ? 'Puntaje Promedio' : 'Avg Score',           value: overallAvg > 0 ? overallAvg + '%' : '—', color: overallAvg >= PASS ? 'text-success' : 'text-warning' },
          { icon: TrendingUp,label: es ? 'Línea Más Activa' : 'Most Active Line',   value: topLine,                color: 'text-violet' },
        ].map(item => (
          <div key={item.label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <item.icon className={cn('w-4 h-4', item.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{item.label}</p>
              <p className="text-base font-bold text-slate-100 truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal bar chart — avg score per line */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            {es ? 'Puntaje Promedio por Línea' : 'Average Score by Line'}
          </h2>
          <div style={{ height: Math.max(180, chartData.length * 46) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 44, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={148} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [v + '%', es ? 'Puntaje' : 'Score']}
                  contentStyle={{
                    background: '#0d1424',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <ReferenceLine
                  x={PASS}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: '70%', position: 'right', fill: '#F59E0B', fontSize: 10 }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {chartData.map(entry => (
                    <Cell key={entry.name} fill={entry.score >= PASS ? '#10B981' : '#DC2626'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-5 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" />
              {es ? 'Aprobado ≥70%' : 'Passing ≥70%'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-2 rounded-sm bg-red-600 inline-block" />
              {es ? 'Por mejorar <70%' : 'Needs improvement <70%'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-6 border-t border-dashed border-amber-500 inline-block mb-px" />
              {es ? 'Meta 70%' : 'Goal 70%'}
            </span>
          </div>
        </div>
      )}

      {/* Detail table with expandable branches */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-line/30">
          <h2 className="text-sm font-semibold text-slate-200">
            {es ? 'Detalle por Línea y Sucursal' : 'Line & Branch Detail'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {es
              ? 'Clic en una línea para ver el desglose por sucursal'
              : 'Click a line to expand branch breakdown'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 bg-surface/40">
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {es ? 'Línea' : 'Line'}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {es ? 'Asesores' : 'Advisors'}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {es ? 'Simul.' : 'Sims'}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {es ? 'Puntaje' : 'Score'}
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {es ? 'Aprobación' : 'Pass Rate'}
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <Fragment key={line.line}>
                  <tr
                    onClick={() => line.branches.length > 1 && toggle(line.line)}
                    className={cn(
                      'border-b border-line/20 transition-colors',
                      line.branches.length > 1 ? 'cursor-pointer hover:bg-card-hover' : '',
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      {line.branches.length > 1 && (
                        expanded.has(line.line)
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 mx-auto" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        <span className="font-medium text-slate-200">{line.line}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{line.memberCount}</td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{line.simCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {line.avgScore > 0 ? (
                        <span className={cn('font-semibold', line.avgScore >= PASS ? 'text-emerald-400' : 'text-red-400')}>
                          {line.avgScore}%
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {line.scoredCount > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 rounded-full overflow-hidden bg-white/5">
                            <div
                              className={cn('h-1.5 rounded-full', line.passRate >= PASS ? 'bg-emerald-500' : 'bg-accent')}
                              style={{ width: `${line.passRate}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-semibold tabular-nums w-9 text-right', line.passRate >= PASS ? 'text-emerald-400' : 'text-red-400')}>
                            {line.passRate}%
                          </span>
                        </div>
                      ) : <span className="text-slate-600 text-xs text-right block">—</span>}
                    </td>
                  </tr>

                  {expanded.has(line.line) && line.branches.map(br => (
                    <tr key={`${line.line}__${br.name}`} className="border-b border-line/10 bg-surface/30">
                      <td />
                      <td className="px-4 py-2 pl-10">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                          <span className="text-xs text-slate-400">{br.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-slate-500 tabular-nums">{br.memberCount}</td>
                      <td className="px-4 py-2 text-right text-xs text-slate-500 tabular-nums">{br.simCount}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {br.avgScore > 0 ? (
                          <span className={cn('text-xs font-medium', br.avgScore >= PASS ? 'text-emerald-400/70' : 'text-red-400/70')}>
                            {br.avgScore}%
                          </span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td />
                    </tr>
                  ))}
                </Fragment>
              ))}

              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    {es
                      ? 'No hay datos de líneas de negocio disponibles.'
                      : 'No business line data available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
