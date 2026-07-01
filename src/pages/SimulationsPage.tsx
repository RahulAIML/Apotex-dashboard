import { useState, useMemo, Fragment } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { DateRangeFilter, inDateRange, simDate } from '../components/ui/DateRangeFilter'
import {
  Search, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Info, X, Download, FileDown,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { LoadingState } from '../components/ui/LoadingState'
import type { Simulation } from '../api/types'

export default function SimulationsPage() {
  const { language } = useAppStore()
  const t  = useTranslation(language)
  const es = language === 'es'
  const { isLoading, isError, sims, activities, refetch } = useDashboardData()
  const [search,      setSearch]      = useState('')
  const [expandedId,  setExpandedId]  = useState<number | null>(null)
  const [from,        setFrom]        = useState('')
  const [to,          setTo]          = useState('')
  const [showCriteria, setShowCriteria] = useState(false)

  const actMap = useMemo(() => new Map(activities.map(a => [a.ID_Caso_de_Uso, a])), [activities])

  // Compute criteria counts from real data — no hardcoded numbers
  const detailedCount = useMemo(() =>
    sims.filter(s => [1,2,3,4,5,6].some(r => {
      const p = s[`Puntos_${r}` as keyof Simulation]
      return typeof p === 'number' && !isNaN(p as number)
    })).length, [sims])

  const globalOnlyCount = useMemo(() =>
    sims.filter(s => {
      if (!s.Calificacion || s.Calificacion <= 0) return false
      return ![1,2,3,4,5,6].some(r => {
        const p = s[`Puntos_${r}` as keyof Simulation]
        return typeof p === 'number' && !isNaN(p as number)
      })
    }).length, [sims])

  const filtered = useMemo(() =>
    sims.filter(s => {
      if ((from || to) && !inDateRange(s.Fecha_y_Hora, from, to)) return false
      const q = search.toLowerCase().trim()
      if (!q) return true
      return (
        (s.Usuario_Nombre ?? '').toLowerCase().includes(q) ||
        (s.Usuario ?? '').toLowerCase().includes(q) ||
        (actMap.get(s.ID_Caso_de_Uso)?.Caso_de_Uso ?? '').toLowerCase().includes(q) ||
        (s.Fecha_y_Hora ?? '').includes(q)
      )
    }), [sims, from, to, search, actMap])

  function downloadCSV(rows: string[][], filename: string) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function exportAll() {
    const h = es
      ? ['ID', 'Asesor', 'Email', 'Actividad', 'Tipo Actividad', 'Fecha', 'Puntaje %', 'Puntos Totales', 'Estado', 'Diagnóstico',
         'Pregunta 1','Respuesta 1','Pts 1','FB 1', 'Pregunta 2','Respuesta 2','Pts 2','FB 2',
         'Pregunta 3','Respuesta 3','Pts 3','FB 3', 'Pregunta 4','Respuesta 4','Pts 4','FB 4',
         'Pregunta 5','Respuesta 5','Pts 5','FB 5', 'Pregunta 6','Respuesta 6','Pts 6','FB 6']
      : ['ID', 'Advisor', 'Email', 'Activity', 'Activity Type', 'Date', 'Score %', 'Total Points', 'Status', 'Diagnosis',
         'Question 1','Answer 1','Pts 1','FB 1', 'Question 2','Answer 2','Pts 2','FB 2',
         'Question 3','Answer 3','Pts 3','FB 3', 'Question 4','Answer 4','Pts 4','FB 4',
         'Question 5','Answer 5','Pts 5','FB 5', 'Question 6','Answer 6','Pts 6','FB 6']
    const data = filtered.map(s => [
      String(s.ID_Sim),
      s.Usuario_Nombre,
      s.Usuario || '—',
      actMap.get(s.ID_Caso_de_Uso)?.Caso_de_Uso ?? String(s.ID_Caso_de_Uso),
      actMap.get(s.ID_Caso_de_Uso)?.Actividad_Nombre ?? '—',
      simDate(s.Fecha_y_Hora) || '—',
      s.Calificacion > 0 ? s.Calificacion + '%' : '—',
      String(s.Puntos_Totales || 0),
      s.Calificacion >= 70 ? (es ? 'Aprobado' : 'Pass') : s.Calificacion > 0 ? (es ? 'Reprobado' : 'Fail') : '—',
      s.Diagnostico_Final || '—',
      ...([1,2,3,4,5,6].flatMap(r => [
        String(s[`Pregunta_${r}` as keyof Simulation] ?? '—'),
        String(s[`Respuesta_${r}` as keyof Simulation] ?? '—'),
        String(s[`Puntos_${r}` as keyof Simulation] ?? '—'),
        String(s[`Retroalimentacion_${r}` as keyof Simulation] ?? '—'),
      ])),
    ])
    downloadCSV([h, ...data], `apotex_simulations_${new Date().toISOString().split('T')[0]}.csv`)
  }

  function exportSingle(s: Simulation, e: React.MouseEvent) {
    e.stopPropagation()
    const actName = actMap.get(s.ID_Caso_de_Uso)?.Caso_de_Uso ?? String(s.ID_Caso_de_Uso)
    const rows: string[][] = [
      [es ? 'Campo' : 'Field', es ? 'Valor' : 'Value'],
      ['Sim ID', String(s.ID_Sim)],
      [es ? 'Asesor' : 'Advisor', s.Usuario_Nombre],
      ['Email', s.Usuario || '—'],
      [es ? 'Actividad' : 'Activity', actName],
      [es ? 'Fecha' : 'Date', simDate(s.Fecha_y_Hora) || '—'],
      [es ? 'Puntaje' : 'Score', s.Calificacion > 0 ? s.Calificacion + '%' : '—'],
      [es ? 'Puntos Totales' : 'Total Points', `${s.Puntos_Totales ?? 0} / 50`],
      [es ? 'Estado' : 'Status', s.Calificacion >= 70 ? 'Pass' : s.Calificacion > 0 ? 'Fail' : '—'],
      [es ? 'Diagnóstico' : 'Diagnosis', s.Diagnostico_Final || '—'],
      ['', ''],
      ...[1,2,3,4,5,6].flatMap(r => {
        const q    = s[`Pregunta_${r}` as keyof Simulation] as string | null
        const resp = s[`Respuesta_${r}` as keyof Simulation] as string | null
        const pts  = s[`Puntos_${r}` as keyof Simulation]
        const fb   = s[`Retroalimentacion_${r}` as keyof Simulation] as string | null
        if (!q && !resp && !fb) return []
        return [
          [`${es ? 'Interacción' : 'Interaction'} ${r} — ${es ? 'Pregunta' : 'Question'}`, q || '—'],
          [`${es ? 'Interacción' : 'Interaction'} ${r} — ${es ? 'Respuesta' : 'Response'}`, resp || '—'],
          [`${es ? 'Interacción' : 'Interaction'} ${r} — ${es ? 'Puntos' : 'Points'}`, String(pts ?? '—')],
          [`${es ? 'Interacción' : 'Interaction'} ${r} — ${es ? 'Retroalimentación' : 'Feedback'}`, fb || '—'],
        ] as string[][]
      }),
    ]
    const safe = s.Usuario_Nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    downloadCSV(rows, `sim_${s.ID_Sim}_${safe}.csv`)
  }

  if (isLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-slate-400">{t('error')}</p>
        <button onClick={refetch} className="btn-primary">{t('retry')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_sims_title')}</h1>
            <button
              onClick={() => setShowCriteria(v => !v)}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors',
                showCriteria
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-surface border-line/40 text-slate-400 hover:text-slate-200 hover:border-line/70',
              )}
            >
              {showCriteria ? <X className="w-3 h-3" /> : <Info className="w-3 h-3" />}
              {es ? 'Criterios' : 'Criteria'}
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">{t('page_sims_subtitle')}</p>
        </div>
        <button
          onClick={exportAll}
          disabled={!filtered.length}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-line/40 text-slate-300 hover:text-white hover:border-accent/40 hover:bg-accent/5 transition-colors disabled:opacity-40 shrink-0"
        >
          <Download className="w-4 h-4" />
          {es ? 'Exportar CSV' : 'Export CSV'}
          {filtered.length > 0 && (
            <span className="text-xs text-slate-500 ml-0.5">({filtered.length})</span>
          )}
        </button>
      </div>

      {/* Evaluation criteria panel */}
      {showCriteria && (
        <div className="card border border-accent/20 p-5 space-y-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {es ? 'Criterios de evaluación' : 'Evaluation criteria'}
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              <span className="text-success font-semibold text-xs">{es ? 'Aprobado' : 'Pass'}</span>
              <span className="text-slate-400 text-xs">≥ 70%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
              <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />
              <span className="text-danger font-semibold text-xs">{es ? 'Reprobado' : 'Fail'}</span>
              <span className="text-slate-400 text-xs">&lt; 70%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-line/30 text-slate-400 text-xs">
              {es ? 'Fórmula:' : 'Formula:'}
              <code className="text-slate-300 font-mono text-xs">Puntos_Totales / 50 × 100</code>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
              {es ? 'Escala de puntuación por interacción (máx 10 pts × 5 = 50 pts)' : 'Per-interaction score scale (max 10 pts × 5 = 50 pts)'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { pts: '10 / 10', label: es ? 'Excelente'             : 'Excellent',          color: 'text-success', bg: 'bg-success/10 border-success/20' },
                { pts: '5 / 10',  label: es ? 'Adecuado'              : 'Adequate',           color: 'text-accent',  bg: 'bg-accent/10  border-accent/20'  },
                { pts: '2 / 10',  label: es ? 'Débil'                 : 'Weak',               color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
                { pts: '0 / 10',  label: es ? 'Incorrecto'            : 'Incorrect',          color: 'text-danger',  bg: 'bg-danger/10  border-danger/20'  },
                { pts: '— / 10',  label: es ? 'Sin puntuación por int.': 'No per-int. score', color: 'text-slate-400', bg: 'bg-surface border-line/30' },
              ].map(({ pts, label, color, bg }) => (
                <div key={pts} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs', bg)}>
                  <span className={cn('font-bold tabular-nums', color)}>{pts}</span>
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 border-t border-line/30 pt-3">
            {es
              ? `${detailedCount} sesiones tienen puntuación detallada por interacción. ${globalOnlyCount} sesiones tienen puntuación global únicamente.`
              : `${detailedCount} sessions have detailed per-interaction scoring. ${globalOnlyCount} sessions have an overall score only.`}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={es ? 'Nombre, email o actividad...' : 'Name, email or activity...'}
            className="input w-full pl-9"
          />
        </div>
        <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <span className="text-xs text-slate-600 ml-auto tabular-nums">
          {filtered.length} {t('simulations_count')}
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line/40 bg-surface/30">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t('col_advisor')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t('col_activity')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {t('col_date')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                  {t('col_score')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t('col_status')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center w-24">
                  {es ? 'Acciones' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const expanded = expandedId === s.ID_Sim
                const activity = actMap.get(s.ID_Caso_de_Uso)
                const hasScore = s.Calificacion != null && s.Calificacion > 0
                return (
                  <Fragment key={s.ID_Sim}>
                    <tr
                      className="border-b border-line/20 hover:bg-white/[0.025] transition-colors cursor-pointer group"
                      onClick={() => setExpandedId(expanded ? null : s.ID_Sim)}
                    >
                      {/* Advisor + email */}
                      <td className="px-4 py-3">
                        <p className="text-slate-200 font-medium leading-tight">{s.Usuario_Nombre}</p>
                        {s.Usuario && (
                          <p className="text-[11px] text-slate-600 font-mono leading-tight mt-0.5 group-hover:text-slate-500 transition-colors">
                            {s.Usuario}
                          </p>
                        )}
                      </td>
                      {/* Activity + type */}
                      <td className="px-4 py-3">
                        <p className="text-slate-300 leading-tight">{activity?.Caso_de_Uso ?? `ID ${s.ID_Caso_de_Uso}`}</p>
                        {activity?.Actividad_Nombre && (
                          <p className="text-[11px] text-slate-600 leading-tight mt-0.5">{activity.Actividad_Nombre}</p>
                        )}
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{simDate(s.Fecha_y_Hora)}</td>
                      {/* Score */}
                      <td className="px-4 py-3 text-right">
                        {hasScore ? (
                          <span className={cn('font-bold tabular-nums text-sm', s.Calificacion >= 70 ? 'text-success' : 'text-danger')}>
                            {s.Calificacion}%
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {!hasScore ? (
                          <span className="badge bg-surface text-slate-600 border border-line/30 text-[11px]">—</span>
                        ) : s.Calificacion >= 70 ? (
                          <span className="badge bg-success/10 text-success text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> {t('status_pass')}
                          </span>
                        ) : (
                          <span className="badge bg-danger/10 text-danger text-[11px]">
                            <XCircle className="w-3 h-3" /> {t('status_fail')}
                          </span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={e => exportSingle(s, e)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-accent hover:bg-accent/10 transition-colors opacity-0 group-hover:opacity-100"
                            title={es ? 'Descargar sesión' : 'Download session'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {expanded
                            ? <ChevronUp  className="w-4 h-4 text-slate-500" />
                            : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded interactions */}
                    {expanded && (() => {
                      const roundCards = [1,2,3,4,5,6].flatMap(r => {
                        const q    = s[`Pregunta_${r}` as keyof typeof s] as string | null
                        const resp = s[`Respuesta_${r}` as keyof typeof s] as string | null
                        const pts  = s[`Puntos_${r}` as keyof typeof s] as number | string | null
                        const fb   = s[`Retroalimentacion_${r}` as keyof typeof s] as string | null
                        const isNa = (v: unknown) => !v || v === 'No aplica' || v === 'No Aplica'
                        if (isNa(q) && isNa(resp) && isNa(fb)) return []
                        const ptsNum = typeof pts === 'number' ? pts : null
                        const ptsText = ptsNum !== null ? `${ptsNum} / 10` : '— / 10'
                        const ptsColor = ptsNum === null        ? 'text-slate-500'
                                       : ptsNum === 10          ? 'text-success'
                                       : ptsNum >= 5            ? 'text-accent'
                                       : ptsNum >= 2            ? 'text-warning'
                                       :                          'text-danger'
                        const cardBorder = ptsNum === null       ? 'border-line/30'
                                         : ptsNum === 10         ? 'border-success/30'
                                         : ptsNum >= 5           ? 'border-accent/30'
                                         : ptsNum >= 2           ? 'border-warning/30'
                                         :                         'border-danger/30'
                        const ptsBg = ptsNum === null             ? 'bg-surface'
                                    : ptsNum === 10               ? 'bg-success/10'
                                    : ptsNum >= 5                 ? 'bg-accent/10'
                                    : ptsNum >= 2                 ? 'bg-warning/10'
                                    :                               'bg-danger/10'
                        return [(
                          <div key={r} className={cn('rounded-xl border p-4 space-y-2', cardBorder)}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {es ? 'Interacción' : 'Interaction'} {r}
                              </span>
                              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md tabular-nums', ptsColor, ptsBg)}>
                                {ptsText}
                              </span>
                            </div>
                            {!isNa(q)    && <p className="text-xs text-slate-500 leading-relaxed">{q}</p>}
                            {!isNa(resp) && <p className="text-xs text-slate-300 leading-relaxed pl-3 border-l-2 border-accent/40">{resp}</p>}
                            {!isNa(fb)   && (
                              <div className="px-3 py-2 rounded-lg bg-surface border border-line/20">
                                <p className="text-[11px] text-slate-500 leading-relaxed">{fb}</p>
                              </div>
                            )}
                          </div>
                        )]
                      })

                      const allRoundsUnscored = [1,2,3,4,5].every(r => {
                        const p = s[`Puntos_${r}` as keyof typeof s]
                        return p === null || p === undefined || p === 'No aplica' || p === 'No Aplica'
                      })

                      return (
                        <tr className="bg-surface/30">
                          <td colSpan={6} className="px-4 pt-4 pb-5">
                            {/* Expansion header — session metadata + download */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line/20 flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className="font-semibold text-slate-300">{s.Usuario_Nombre}</span>
                                {s.Usuario && (
                                  <span className="font-mono text-slate-600 bg-surface px-2 py-0.5 rounded-md border border-line/30">
                                    {s.Usuario}
                                  </span>
                                )}
                                <span className="text-slate-700">·</span>
                                <span className="text-slate-400">{activity?.Caso_de_Uso ?? `ID ${s.ID_Caso_de_Uso}`}</span>
                                {activity?.Actividad_Nombre && (
                                  <>
                                    <span className="text-slate-700">·</span>
                                    <span className="text-slate-600">{activity.Actividad_Nombre}</span>
                                  </>
                                )}
                                <span className="text-slate-700">·</span>
                                <span className="text-slate-500">{simDate(s.Fecha_y_Hora)}</span>
                                {hasScore && (
                                  <>
                                    <span className="text-slate-700">·</span>
                                    <span className={cn('font-bold', s.Calificacion >= 70 ? 'text-success' : 'text-danger')}>
                                      {s.Calificacion}% {s.Calificacion >= 70 ? (es ? 'Aprobado' : 'Pass') : (es ? 'Reprobado' : 'Fail')}
                                    </span>
                                    <span className="text-slate-700">·</span>
                                    <span className="text-slate-600">
                                      {es ? 'Sim ID' : 'Sim ID'} #{s.ID_Sim}
                                    </span>
                                  </>
                                )}
                              </div>
                              <button
                                onClick={e => exportSingle(s, e)}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-line/40 text-slate-400 hover:text-accent hover:border-accent/40 transition-colors shrink-0"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                {es ? 'Descargar sesión' : 'Download session'}
                              </button>
                            </div>

                            {/* Type B: global score banner (no per-interaction pts) */}
                            {allRoundsUnscored && s.Puntos_Totales != null && (
                              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-card border border-line/30 flex-wrap">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                  {es ? 'Puntaje total:' : 'Total score:'}
                                </span>
                                <span className={cn('text-base font-bold tabular-nums', hasScore ? (s.Calificacion >= 70 ? 'text-success' : 'text-danger') : 'text-slate-400')}>
                                  {s.Puntos_Totales} / 50
                                </span>
                                {hasScore && (
                                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', s.Calificacion >= 70 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                                    {s.Calificacion}%
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-600 italic">
                                  {es ? '(puntuación por interacción no disponible para esta sesión)' : '(per-interaction score not available for this session)'}
                                </span>
                              </div>
                            )}

                            {/* Interaction cards */}
                            {roundCards.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {roundCards}
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-line/30 min-w-[200px]">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{t('col_score')}</p>
                                    <p className={cn('text-2xl font-bold', hasScore ? (s.Calificacion >= 70 ? 'text-success' : 'text-danger') : 'text-slate-500')}>
                                      {hasScore ? `${s.Calificacion}%` : '—'}
                                    </p>
                                  </div>
                                </div>
                                {s.Diagnostico_Final && s.Diagnostico_Final !== 'NO' && (
                                  <div className="p-4 rounded-xl bg-card border border-line/30 flex-1">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">
                                      {es ? 'Diagnóstico / Retroalimentación IA' : 'Diagnosis / AI Feedback'}
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed">{s.Diagnostico_Final}</p>
                                  </div>
                                )}
                                {!s.Diagnostico_Final && (
                                  <p className="text-xs text-slate-600 italic self-center">
                                    {es ? 'Sin detalles por interacción para esta sesión.' : 'No per-interaction details for this session.'}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })()}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-slate-500 text-sm">{t('no_data')}</div>
        )}
      </div>
    </div>
  )
}
