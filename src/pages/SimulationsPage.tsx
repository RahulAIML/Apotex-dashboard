import { useState, useMemo, Fragment } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store'
import { useTranslation } from '../lib/i18n'
import { DateRangeFilter, inDateRange, simDate } from '../components/ui/DateRangeFilter'
import { Search, CheckCircle2, XCircle, ChevronDown, ChevronUp, Info, X } from 'lucide-react'
import { cn } from '../lib/cn'

export default function SimulationsPage() {
  const { language } = useAppStore()
  const t  = useTranslation(language)
  const es = language === 'es'
  const { isLoading, isError, sims, activities, refetch } = useDashboardData()
  const [search,     setSearch]     = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [from,       setFrom]       = useState('')
  const [to,         setTo]         = useState('')
  const [showCriteria, setShowCriteria] = useState(false)

  const actMap = useMemo(() => new Map(activities.map((a) => [a.ID_Caso_de_Uso, a])), [activities])

  const filtered = useMemo(() => {
    return sims.filter((s) => {
      // Date range filter
      if (from || to) {
        if (!inDateRange(s.Fecha_y_Hora, from, to)) return false
      }
      // Text search
      const q = search.toLowerCase().trim()
      if (!q) return true
      return (
        (s.Usuario_Nombre ?? '').toLowerCase().includes(q) ||
        (actMap.get(s.ID_Caso_de_Uso)?.Caso_de_Uso ?? '').toLowerCase().includes(q) ||
        (s.Fecha_y_Hora ?? '').includes(q)
      )
    })
  }, [sims, from, to, search, actMap])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 skeleton rounded-lg" />
        <div className="card p-5 h-96 skeleton rounded-xl" />
      </div>
    )
  }

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
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight">{t('page_sims_title')}</h1>
          <button
            onClick={() => setShowCriteria(v => !v)}
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors',
              showCriteria
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-surface border-line/40 text-slate-400 hover:text-slate-200 hover:border-line/70'
            )}
          >
            {showCriteria ? <X className="w-3 h-3" /> : <Info className="w-3 h-3" />}
            {es ? 'Criterios' : 'Criteria'}
          </button>
        </div>
        <p className="text-slate-500 text-sm mt-0.5">{t('page_sims_subtitle')}</p>
      </div>

      {/* Passing criteria panel */}
      {showCriteria && (
        <div className="card border border-accent/20 p-4 space-y-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {es ? 'Criterios de evaluación' : 'Evaluation criteria'}
            </h2>
          </div>

          {/* Pass threshold */}
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
              <code className="text-slate-300 font-mono">Puntos_Totales / 50 × 100</code>
            </div>
          </div>

          {/* Per-round score scale */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">
              {es ? 'Escala de puntuación por ronda (máx. 10 × 5 rondas = 50 pts)' : 'Per-round score scale (max 10 × 5 rounds = 50 pts)'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { pts: '10 / 10', label: es ? 'Excelente' : 'Excellent',  color: 'text-success', bg: 'bg-success/10 border-success/20' },
                { pts: '5 / 10',  label: es ? 'Adecuado'  : 'Adequate',   color: 'text-accent',  bg: 'bg-accent/10  border-accent/20'  },
                { pts: '2 / 10',  label: es ? 'Débil'     : 'Weak',       color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
                { pts: '0 / 10',  label: es ? 'Incorrecto': 'Incorrect',  color: 'text-danger',  bg: 'bg-danger/10  border-danger/20'  },
                { pts: '— / 10',  label: es ? 'Sin puntuación individual' : 'No per-round score', color: 'text-slate-400', bg: 'bg-surface border-line/30' },
              ].map(({ pts, label, color, bg }) => (
                <div key={pts} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs', bg)}>
                  <span className={cn('font-bold tabular-nums', color)}>{pts}</span>
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session type note */}
          <p className="text-[11px] text-slate-500 border-t border-line/30 pt-3">
            {es
              ? '19 sesiones tienen puntuación detallada por ronda. 146 sesiones tienen puntuación global únicamente (se muestra "— / 10" por ronda con el total encima de las interacciones).'
              : '19 sessions have detailed per-round scoring. 146 sessions have an overall score only ("— / 10" shown per round with total displayed above interactions).'}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filter_search')}
            className="input w-full pl-9"
          />
        </div>
        <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <span className="text-xs text-slate-600 ml-auto">
          {filtered.length} {t('simulations_count')}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line/40">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_advisor')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_activity')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_date')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_score')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_status')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('col_details')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const expanded = expandedId === s.ID_Sim
                const activity = actMap.get(s.ID_Caso_de_Uso)
                const hasScore = s.Calificacion != null && s.Calificacion > 0
                return (
                  <Fragment key={s.ID_Sim}>
                    <tr
                      className="border-b border-line/20 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : s.ID_Sim)}
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">{s.Usuario_Nombre}</td>
                      <td className="px-4 py-3 text-slate-400">{activity?.Caso_de_Uso ?? `ID ${s.ID_Caso_de_Uso}`}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{simDate(s.Fecha_y_Hora)}</td>
                      <td className="px-4 py-3">
                        {hasScore ? (
                          <span className={cn('font-semibold', s.Calificacion >= 70 ? 'text-success' : 'text-danger')}>
                            {s.Calificacion}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!hasScore ? (
                          <span className="badge bg-surface text-slate-500 border border-line/30">—</span>
                        ) : s.Calificacion >= 70 ? (
                          <span className="badge bg-success/10 text-success">
                            <CheckCircle2 className="w-3 h-3" /> {t('status_pass')}
                          </span>
                        ) : (
                          <span className="badge bg-danger/10 text-danger">
                            <XCircle className="w-3 h-3" /> {t('status_fail')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </td>
                    </tr>
                    {expanded && (() => {
                      // Build round cards — show a round if it has ANY content
                      const roundCards = [1, 2, 3, 4, 5, 6].flatMap((r) => {
                        const q    = s[`Pregunta_${r}`        as keyof typeof s] as string | null
                        const resp = s[`Respuesta_${r}`       as keyof typeof s] as string | null
                        const pts  = s[`Puntos_${r}`          as keyof typeof s] as number | string | null
                        const fb   = s[`Retroalimentacion_${r}` as keyof typeof s] as string | null

                        const isNa    = (v: string | null | undefined) => !v || v === 'No aplica' || v === 'No Aplica'
                        const hasData = !isNa(q) || !isNa(resp) || !isNa(fb)
                        if (!hasData) return []

                        const ptsNum  = typeof pts === 'number' ? pts : null
                        // Always show score badge: "X / 10" if scored, "— / 10" if not
                        const ptsText = ptsNum !== null ? `${ptsNum} / 10` : '— / 10'
                        const ptsScored = ptsNum !== null

                        // Color by score quality: 10=green, 5=blue, 2=amber, 0=red, unscored=slate
                        const ptsColor = !ptsScored          ? 'text-slate-400'
                                       : ptsNum === 10       ? 'text-success'
                                       : ptsNum! >=  5       ? 'text-accent'
                                       : ptsNum! >=  2       ? 'text-warning'
                                       :                       'text-danger'

                        // Border accent by score quality
                        const cardBorder = !ptsScored        ? 'border-line/40'
                                         : ptsNum === 10     ? 'border-success/30'
                                         : ptsNum! >=  5     ? 'border-accent/30'
                                         : ptsNum! >=  2     ? 'border-warning/30'
                                         :                     'border-danger/30'

                        return [(
                          <div key={r} className={cn('card p-3 border', cardBorder)}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                {t('round')} {r}
                              </span>
                              <span className={cn('text-xs font-bold', ptsColor)}>
                                {ptsText}
                              </span>
                            </div>
                            {!isNa(q)    && <p className="text-xs text-slate-400 mb-1 line-clamp-3">{q}</p>}
                            {!isNa(resp) && <p className="text-xs text-slate-300 line-clamp-3 mb-1 border-l-2 border-accent/30 pl-2">{resp}</p>}
                            {!isNa(fb)   && <p className="text-[11px] text-slate-500 bg-surface rounded px-2 py-1 mt-1 line-clamp-2">{fb}</p>}
                          </div>
                        )]
                      })

                      // Detect Type B: rounds have content but no numeric per-round scores
                      const allRoundsUnscored = [1,2,3,4,5].every(r => {
                        const p = s[`Puntos_${r}` as keyof typeof s]
                        return p === null || p === undefined || p === 'No aplica' || p === 'No Aplica'
                      })

                      return (
                        <tr className="bg-surface/50">
                          <td colSpan={6} className="px-4 py-4">
                            {/* Type B summary: total score shown above grid */}
                            {allRoundsUnscored && s.Puntos_Totales != null && (
                              <div className="flex items-center gap-2 mb-3 px-1">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                  {es ? 'Puntaje total:' : 'Total score:'}
                                </span>
                                <span className={cn('text-sm font-bold', hasScore ? (s.Calificacion >= 70 ? 'text-success' : 'text-danger') : 'text-slate-400')}>
                                  {s.Puntos_Totales} / 50
                                </span>
                                {hasScore && (
                                  <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', s.Calificacion >= 70 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                                    {s.Calificacion}%
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-600 italic ml-1">
                                  {es ? '(puntaje por ronda no disponible)' : '(per-round score not available)'}
                                </span>
                              </div>
                            )}
                            {roundCards.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {roundCards}
                              </div>
                            ) : (
                              /* Fallback — session has a score but no per-round text stored */
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-line/30 min-w-[180px]">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">{t('col_score')}</p>
                                    <p className={cn('text-xl font-bold', hasScore ? (s.Calificacion >= 70 ? 'text-success' : 'text-danger') : 'text-slate-500')}>
                                      {hasScore ? `${s.Calificacion}%` : '—'}
                                    </p>
                                  </div>
                                </div>
                                {s.Diagnostico_Final && s.Diagnostico_Final !== 'NO' && (
                                  <div className="p-3 rounded-lg bg-card border border-line/30 flex-1">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">{es ? 'Diagnóstico' : 'Diagnosis'}</p>
                                    <p className="text-xs text-slate-300 line-clamp-4">{s.Diagnostico_Final}</p>
                                  </div>
                                )}
                                {!s.Diagnostico_Final && (
                                  <p className="text-xs text-slate-600 italic self-center">
                                    {es ? 'Sin detalles por ronda disponibles para esta sesión.' : 'No per-round details available for this session.'}
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
          <div className="p-8 text-center text-slate-500 text-sm">{t('no_data')}</div>
        )}
      </div>
    </div>
  )
}
