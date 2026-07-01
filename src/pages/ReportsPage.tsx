import { Link } from 'react-router-dom'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { useDashboardData } from '../hooks/useDashboardData'
import { FileDown, BarChart3, Building2, Users, Activity, FileText, ArrowRight } from 'lucide-react'

function ReportCard({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
  meta?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="card p-5 flex items-start gap-4 hover:border-accent/40 transition-all text-left w-full disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <div className="w-10 h-10 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent whitespace-nowrap shrink-0">
            <FileDown className="w-3 h-3" />
            CSV
          </span>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
        {meta && <p className="text-xs text-slate-600 mt-1.5">{meta}</p>}
      </div>
    </button>
  )
}

export default function ReportsPage() {
  const { language } = useAppStore()
  const t = useTranslation(language)
  const { kpis, sims, members, actStats, userStats, trend } = useDashboardData()
  const simCount = kpis?.totalSimulations ?? 0
  const rpCount = 0 // RolPlay not active for Apotex — video_answers empty
  const es = language === 'es'

  function downloadCSV(rows: string[][], filename: string) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportSimSummary() {
    downloadCSV(
      [
        [es ? 'Métrica' : 'Metric', es ? 'Valor' : 'Value'],
        [es ? 'Total Simulaciones' : 'Total Simulations', String(simCount)],
        [es ? 'Puntaje Promedio' : 'Average Score', String(kpis?.averageScore ?? 0) + '%'],
        [es ? 'Tasa de Aprobación' : 'Pass Rate', String(kpis?.passRate ?? 0) + '%'],
        [es ? 'Asesores Activos' : 'Active Advisors', String(kpis?.activeAdvisors ?? 0)],
        [es ? 'Aprobados' : 'Passed', String(kpis?.passCount ?? 0)],
        [es ? 'Reprobados' : 'Failed', String(kpis?.failCount ?? 0)],
      ],
      `apotex_simulator_summary_${new Date().toISOString().split('T')[0]}.csv`,
    )
  }

  function exportRpSummary() { return } // RolPlay not active for Apotex

  function exportTrendReport() {
    if (!trend?.length) return
    const header = es
      ? ['Fecha', 'Puntaje Promedio', 'Simulaciones', 'Tasa de Aprobación']
      : ['Date', 'Avg Score', 'Simulations', 'Pass Rate']
    const rows = [header, ...trend.map(p => [p.date, p.avgScore + '%', String(p.count), p.passRate + '%'])]
    downloadCSV(rows, `apotex_trend_${new Date().toISOString().split('T')[0]}.csv`)
  }

  function exportActivityReport() {
    if (!actStats?.length) return
    const header = es
      ? ['Actividad', 'Tipo', 'Simulaciones', 'Puntaje Promedio', 'Aprobados', 'Reprobados', 'Tasa de Aprobación']
      : ['Activity', 'Type', 'Simulations', 'Avg Score', 'Passed', 'Failed', 'Pass Rate']
    const rows = [
      header,
      ...actStats.map(a => [
        a.name, a.activityType, String(a.count),
        a.avgScore > 0 ? a.avgScore + '%' : '—',
        String(a.passCount), String(a.failCount),
        a.avgScore > 0 ? a.passRate + '%' : '—',
      ]),
    ]
    downloadCSV(rows, `apotex_activities_${new Date().toISOString().split('T')[0]}.csv`)
  }

  function exportBranchReport() {
    if (!members.length) return
    const byEmail: Record<string, typeof members[0]> = {}
    members.forEach(m => { byEmail[(m.mb_email ?? '').toLowerCase()] = m })

    const data: Record<string, { simCount: number; totalScore: number; scored: number; passCount: number }> = {}
    members.forEach(m => {
      const br = (m.mb_branch || (es ? 'Sin Sucursal' : 'No Branch')).trim()
      if (!data[br]) data[br] = { simCount: 0, totalScore: 0, scored: 0, passCount: 0 }
    })
    sims.forEach(s => {
      const m = byEmail[(s.Usuario || '').toLowerCase()]
      if (!m) return
      const br = (m.mb_branch || (es ? 'Sin Sucursal' : 'No Branch')).trim()
      if (!data[br]) data[br] = { simCount: 0, totalScore: 0, scored: 0, passCount: 0 }
      data[br].simCount++
      if (s.Calificacion != null && s.Calificacion > 0) { data[br].totalScore += s.Calificacion; data[br].scored++ }
      if (s.Calificacion != null && s.Calificacion >= 70) data[br].passCount++
    })

    const header = es
      ? ['Sucursal', 'Simulaciones', 'Puntaje Promedio', 'Tasa de Aprobación']
      : ['Branch', 'Simulations', 'Avg Score', 'Pass Rate']
    const rows = [header, ...Object.entries(data).map(([br, d]) => {
      const avg  = d.scored ? Math.round(d.totalScore / d.scored) : 0
      const pass = d.scored ? Math.round(d.passCount / d.scored * 100) : 0
      return [br, String(d.simCount), avg > 0 ? avg + '%' : '—', pass > 0 ? pass + '%' : '—']
    })]
    downloadCSV(rows, `apotex_branch_performance_${new Date().toISOString().split('T')[0]}.csv`)
  }

  function exportAdvisorReport() {
    if (!userStats?.length) return
    const header = es
      ? ['Asesor', 'Email', 'Simulaciones', 'Puntaje Promedio', 'Mejor Puntaje', 'Aprobados', 'Reprobados', 'Tasa de Aprobación']
      : ['Advisor', 'Email', 'Simulations', 'Avg Score', 'Best Score', 'Passed', 'Failed', 'Pass Rate']
    const rows = [
      header,
      ...[...userStats].sort((a, b) => a.name.localeCompare(b.name)).map(u => [
        u.name, u.userId, String(u.count),
        u.avgScore > 0 ? u.avgScore + '%' : '—',
        u.bestScore > 0 ? u.bestScore + '%' : '—',
        String(u.passCount), String(u.failCount),
        u.avgScore > 0 ? u.passRate + '%' : '—',
      ]),
    ]
    downloadCSV(rows, `apotex_advisors_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_reports_title')}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_reports_subtitle')}</p>
      </div>

      {/* Executive Report banner */}
      <Link
        to="/executive-report"
        className="group flex items-center justify-between gap-4 card p-5 hover:border-accent/50 bg-gradient-to-r from-card to-accent/5 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent/15 group-hover:bg-accent/25 transition-colors flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">
              {es ? 'Informe Ejecutivo de Desempeño' : 'Executive Performance Report'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {es
                ? 'Informe oficial con KPIs, actividades, distribución de puntajes y top performers — datos en tiempo real.'
                : 'Official report with KPIs, activities, score distribution, and top performers — live data.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-accent shrink-0">
          {es ? 'Ver informe' : 'View report'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

      {/* Data summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BarChart3, label: es ? 'Simulaciones'       : 'Simulations',      value: simCount.toLocaleString() },
          { icon: Activity,  label: es ? 'Actividades'        : 'Activities',       value: String(kpis?.totalActivities ?? 0) },
          { icon: Users,     label: es ? 'Asesores Activos'   : 'Active Advisors',  value: String(kpis?.activeAdvisors ?? 0) },
          { icon: Building2, label: es ? 'Miembros Totales'   : 'Total Members',    value: String(kpis?.totalMembers ?? 0) },
        ].map(item => (
          <div key={item.label} className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-lg font-bold text-slate-100">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick exports */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
          {es ? 'Exportar Datos' : 'Export Data'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportSimSummary}
            disabled={!simCount}
            className="card p-5 flex items-start gap-4 hover:border-accent/40 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {es ? 'Resumen Simulador' : 'Simulator Summary'}
              </p>
              <p className="text-xs text-slate-500">
                {es ? `KPIs agregados — ${simCount} simulaciones` : `Aggregated KPIs — ${simCount} simulations`}
              </p>
              <span className="inline-block mt-2 text-[10px] font-medium text-accent">CSV ↓</span>
            </div>
          </button>

          <button
            onClick={exportRpSummary}
            disabled={!rpCount}
            className="card p-5 flex items-start gap-4 hover:border-violet/40 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-violet/10 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5 text-violet" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {es ? 'Sesiones RolPlay Completas' : 'Full RolPlay Sessions'}
              </p>
              <p className="text-xs text-slate-500">
                {es ? `Todas las sesiones con dimensiones IA — ${rpCount} registros` : `All sessions with AI dimensions — ${rpCount} records`}
              </p>
              <span className="inline-block mt-2 text-[10px] font-medium text-violet">CSV ↓</span>
            </div>
          </button>
        </div>
      </div>

      {/* Detailed reports */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">
          {es ? 'Reportes Detallados' : 'Detailed Reports'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard
            icon={BarChart3}
            title={es ? 'Tendencia por Fecha' : 'Score Trend by Date'}
            description={es
              ? 'Evolución diaria de puntaje promedio, simulaciones y tasa de aprobación.'
              : 'Daily evolution of average score, simulations, and pass rate.'}
            onClick={exportTrendReport}
            disabled={!trend?.length}
            meta={trend?.length ? `${trend.length} ${es ? 'días con datos' : 'days of data'}` : undefined}
          />
          <ReportCard
            icon={Activity}
            title={es ? 'Rendimiento por Actividad' : 'Activity Performance'}
            description={es
              ? 'Simulaciones, puntaje promedio y tasa de aprobación por actividad.'
              : 'Simulations, avg score, and pass rate broken down by activity.'}
            onClick={exportActivityReport}
            disabled={!actStats?.length}
            meta={actStats?.length ? `${actStats.length} ${es ? 'actividades' : 'activities'}` : undefined}
          />
          <ReportCard
            icon={Building2}
            title={es ? 'Rendimiento por Sucursal' : 'Branch Performance'}
            description={es
              ? 'Comparativa de sucursales: simulaciones, puntaje promedio y aprobación.'
              : 'Branch comparison: simulations, average score, and pass rate.'}
            onClick={exportBranchReport}
            disabled={!members.length}
            meta={members.length ? `${members.length} ${es ? 'miembros registrados' : 'registered members'}` : undefined}
          />
          <ReportCard
            icon={Users}
            title={es ? 'Reporte por Asesor' : 'Advisor Report'}
            description={es
              ? 'Listado completo de asesores con puntajes, mejor resultado y tasa de aprobación.'
              : 'Full advisor list with scores, best result, and pass rate.'}
            onClick={exportAdvisorReport}
            disabled={!userStats?.length}
            meta={userStats?.length ? `${userStats.length} ${es ? 'asesores' : 'advisors'}` : undefined}
          />
        </div>
      </div>
    </div>
  )
}
