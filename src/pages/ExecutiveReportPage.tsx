import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { LoadingState } from '../components/ui/LoadingState'
import { ArrowLeft, Printer, FileText } from 'lucide-react'
import { cn } from '../lib/cn'

export default function ExecutiveReportPage() {
  const { language } = useAppStore()
  const es = language === 'es'
  const { isLoading, kpis, actStats, userStats, sims } = useDashboardData()

  const dates = sims.map(s => s.Fecha_y_Hora).filter(Boolean).sort()
  const firstDate = dates[0]              ? dates[0].substring(0, 10)                        : '—'
  const lastDate  = dates[dates.length - 1] ? dates[dates.length - 1].substring(0, 10) : '—'

  const scoredCount = useMemo(() => sims.filter(s => s.Calificacion > 0).length, [sims])

  const scoreDist = useMemo(() => {
    const buckets = [
      { label: '90–100%', min: 90, max: 100, count: 0, pass: true },
      { label: '80–89%',  min: 80, max: 89,  count: 0, pass: true },
      { label: '70–79%',  min: 70, max: 79,  count: 0, pass: true },
      { label: '60–69%',  min: 60, max: 69,  count: 0, pass: false },
      { label: '50–59%',  min: 50, max: 59,  count: 0, pass: false },
      { label: '0–49%',   min: 0,  max: 49,  count: 0, pass: false },
    ]
    sims.filter(s => s.Calificacion > 0).forEach(s => {
      const b = buckets.find(x => s.Calificacion >= x.min && s.Calificacion <= x.max)
      if (b) b.count++
    })
    return buckets
  }, [sims])

  const topPerformers = useMemo(() =>
    [...(userStats ?? [])].filter(u => u.avgScore > 0).slice(0, 15),
    [userStats])

  const reportDate = new Date().toLocaleDateString(es ? 'es-MX' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Link
          to="/reports"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {es ? 'Volver a Reportes' : 'Back to Reports'}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {es ? 'Vista del informe' : 'Report preview'}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-line/40 text-slate-300 hover:text-white hover:border-accent/40 hover:bg-accent/5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            {es ? 'Imprimir / PDF' : 'Print / PDF'}
          </button>
        </div>
      </div>

      {/* Document */}
      <div id="exec-report" className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.2)]">

        {/* Document header */}
        <div className="bg-[#0b1735] px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#dc2626] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-base">A</span>
              </div>
              <div>
                <p className="text-xs text-[#7a9cc0] font-semibold uppercase tracking-widest">Apotex</p>
                <p className="text-[11px] text-[#5a7ca0]">Analytics Intelligence Platform</p>
              </div>
            </div>
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">
              {es ? 'Informe Ejecutivo de Desempeño' : 'Executive Performance Report'}
            </h1>
            <p className="text-sm text-[#7a9cc0] mt-1.5">
              {es
                ? 'Simulaciones de Ventas · Asesores Farmacéuticos'
                : 'Sales Simulations · Pharmaceutical Advisors'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-[#5a7ca0] uppercase tracking-wider mb-1">
              {es ? 'Generado el' : 'Generated on'}
            </p>
            <p className="text-sm font-semibold text-white">{reportDate}</p>
            <div className="mt-3 text-[11px] text-[#5a7ca0] space-y-0.5">
              <p>{es ? 'Período cubierto' : 'Period covered'}</p>
              <p className="text-white font-medium tabular-nums">{firstDate} — {lastDate}</p>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.07] border border-white/[0.1]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] text-[#7a9cc0] font-medium uppercase tracking-wider">
                {es ? 'Datos en tiempo real' : 'Live data'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: KPIs */}
        <div className="px-8 py-7 border-b border-gray-100">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-5">
            {es ? '01 — Resumen Ejecutivo' : '01 — Executive Summary'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: es ? 'Total Simulaciones'  : 'Total Simulations', value: (kpis?.totalSimulations ?? 0).toLocaleString(), color: 'text-gray-900' },
              { label: es ? 'Puntaje Promedio'    : 'Average Score',     value: (kpis?.averageScore ?? 0) + '%',       color: (kpis?.averageScore ?? 0) >= 70 ? 'text-emerald-600' : 'text-red-600' },
              { label: es ? 'Tasa de Aprobación'  : 'Pass Rate',         value: (kpis?.passRate ?? 0) + '%',           color: (kpis?.passRate ?? 0) >= 70 ? 'text-emerald-600' : 'text-red-600' },
              { label: es ? 'Asesores Activos'    : 'Active Advisors',   value: String(kpis?.activeAdvisors ?? 0),     color: 'text-gray-900' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] text-gray-500 mb-2">{k.label}</p>
                <p className={cn('text-[28px] font-bold tracking-tight leading-none', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: es ? 'Sesiones Aprobadas'   : 'Passed Sessions',    value: String(kpis?.passCount ?? 0) },
              { label: es ? 'Sesiones Reprobadas'  : 'Failed Sessions',    value: String(kpis?.failCount ?? 0) },
              { label: es ? 'Miembros Registrados' : 'Registered Members', value: String(kpis?.totalMembers ?? 0) },
              { label: es ? 'Actividades Activas'  : 'Active Activities',  value: String(kpis?.totalActivities ?? 0) },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-gray-500">{k.label}</p>
                <p className="text-base font-bold text-gray-700 tabular-nums shrink-0">{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Activity Performance */}
        <div className="px-8 py-7 border-b border-gray-100">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-5">
            {es ? '02 — Rendimiento por Actividad' : '02 — Performance by Activity'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {[
                    { label: es ? 'Actividad'    : 'Activity',  align: 'left'  },
                    { label: es ? 'Tipo'         : 'Type',      align: 'left'  },
                    { label: es ? 'Sesiones'     : 'Sessions',  align: 'right' },
                    { label: es ? 'Ptje. Prom.'  : 'Avg Score', align: 'right' },
                    { label: es ? 'Aprobados'    : 'Passed',    align: 'right' },
                    { label: es ? 'Reprobados'   : 'Failed',    align: 'right' },
                    { label: es ? 'T. Aprob.'    : 'Pass %',    align: 'right' },
                  ].map(h => (
                    <th key={h.label} className={cn('pb-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider pr-4 last:pr-0', h.align === 'right' ? 'text-right' : 'text-left')}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...(actStats ?? [])].sort((a, b) => b.count - a.count).map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 font-medium text-gray-800 pr-4 max-w-[220px] truncate">{a.name}</td>
                    <td className="py-3 text-gray-500 text-xs pr-4">{a.activityType}</td>
                    <td className="py-3 text-right text-gray-700 tabular-nums pr-4 font-medium">{a.count}</td>
                    <td className="py-3 text-right tabular-nums pr-4">
                      <span className={cn('font-bold', a.avgScore >= 70 ? 'text-emerald-600' : a.avgScore > 0 ? 'text-red-500' : 'text-gray-400')}>
                        {a.avgScore > 0 ? a.avgScore + '%' : '—'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-emerald-600 tabular-nums pr-4 font-medium">{a.passCount}</td>
                    <td className="py-3 text-right text-red-500 tabular-nums pr-4 font-medium">{a.failCount}</td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={cn('font-bold', a.passRate >= 70 ? 'text-emerald-600' : a.avgScore > 0 ? 'text-red-500' : 'text-gray-400')}>
                        {a.avgScore > 0 ? a.passRate + '%' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Score Distribution */}
        <div className="px-8 py-7 border-b border-gray-100">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-5">
            {es ? '03 — Distribución de Puntajes' : '03 — Score Distribution'}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
            {scoreDist.map(b => {
              const pct = scoredCount > 0 ? Math.round(b.count / scoredCount * 100) : 0
              return (
                <div key={b.label} className={cn(
                  'rounded-xl border p-4 text-center',
                  b.pass ? 'border-emerald-100 bg-emerald-50/60' : 'border-red-100 bg-red-50/60',
                )}>
                  <p className="text-[11px] font-semibold text-gray-500 mb-2">{b.label}</p>
                  <p className={cn('text-2xl font-bold leading-none', b.pass ? 'text-emerald-700' : 'text-red-600')}>{b.count}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{pct}%</p>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400">
            {es
              ? `* Solo sesiones calificadas. Total calificadas: ${scoredCount} de ${sims.length} (${sims.length > 0 ? Math.round(scoredCount / sims.length * 100) : 0}%).`
              : `* Scored sessions only. Total scored: ${scoredCount} of ${sims.length} (${sims.length > 0 ? Math.round(scoredCount / sims.length * 100) : 0}%).`}
          </p>
        </div>

        {/* Section 4: Top Performers */}
        <div className="px-8 py-7">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-5">
            {es ? '04 — Top Performers (Puntaje Promedio Descendente)' : '04 — Top Performers (Ranked by Average Score)'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {[
                    { label: '#',                                    align: 'left'  },
                    { label: es ? 'Asesor'      : 'Advisor',        align: 'left'  },
                    { label: 'Email',                                align: 'left'  },
                    { label: es ? 'Simulaciones': 'Sessions',        align: 'right' },
                    { label: es ? 'Ptje. Prom.' : 'Avg Score',      align: 'right' },
                    { label: es ? 'Mejor Ptje.' : 'Best Score',     align: 'right' },
                    { label: es ? 'T. Aprob.'   : 'Pass Rate',      align: 'right' },
                  ].map(h => (
                    <th key={h.label} className={cn('pb-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider pr-4 last:pr-0', h.align === 'right' ? 'text-right' : 'text-left')}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((u, i) => (
                  <tr key={u.name + i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 text-gray-400 text-xs tabular-nums pr-4 font-medium">{i + 1}</td>
                    <td className="py-3 font-semibold text-gray-800 pr-4">{u.name}</td>
                    <td className="py-3 text-gray-400 text-xs font-mono pr-4">{u.userId || '—'}</td>
                    <td className="py-3 text-right text-gray-600 tabular-nums pr-4">{u.count}</td>
                    <td className="py-3 text-right tabular-nums pr-4">
                      <span className={cn('font-bold', u.avgScore >= 70 ? 'text-emerald-600' : 'text-red-600')}>{u.avgScore}%</span>
                    </td>
                    <td className="py-3 text-right text-gray-700 tabular-nums font-semibold pr-4">{u.bestScore}%</td>
                    <td className="py-3 text-right tabular-nums">
                      <span className={cn('font-semibold', u.passRate >= 70 ? 'text-emerald-600' : 'text-red-600')}>{u.passRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document footer */}
        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[11px] text-gray-400 font-medium">
            Apotex Analytics Intelligence Platform &nbsp;·&nbsp; v2.0.0
          </p>
          <p className="text-[11px] text-gray-400">
            {es
              ? 'Datos en tiempo real · Distribución restringida · Documento confidencial'
              : 'Real-time data · Restricted distribution · Confidential document'}
          </p>
        </div>
      </div>
    </div>
  )
}
