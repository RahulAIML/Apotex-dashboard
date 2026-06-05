import { useState, useEffect } from 'react'
import { X, Calendar, Check } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  from: string
  to: string
  onFrom: (v: string) => void
  onTo:   (v: string) => void
  label?:     string
  className?: string
}

// Normalise Fecha_y_Hora to YYYY-MM-DD regardless of separator (T or space)
// "2025-09-15T16:30:00" → "2025-09-15"
// "2026-05-27 04:11:00" → "2026-05-27"  (Set 3 uses space, not T)
export function simDate(fecha: string | null | undefined): string {
  if (!fecha) return ''
  return fecha.substring(0, 10)
}

// Quick preset ranges relative to today (YYYY-MM-DD)
function isoToday()  { return new Date().toISOString().split('T')[0] }
function isoMinus(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function DateRangeFilter({ from, to, onFrom, onTo, label, className }: Props) {
  // Pending state — user edits here before hitting Apply
  const [pendingFrom, setPendingFrom] = useState(from)
  const [pendingTo,   setPendingTo]   = useState(to)

  // Sync pending if parent resets (e.g. preset click or clear)
  useEffect(() => { setPendingFrom(from) }, [from])
  useEffect(() => { setPendingTo(to)     }, [to])

  const isActive  = !!(from || to)
  const hasPending = pendingFrom !== from || pendingTo !== to

  function setPreset(months: number | null) {
    if (months === null) {
      setPendingFrom(''); setPendingTo('')
      onFrom(''); onTo('')
      return
    }
    const f = isoMinus(months * 30), t = isoToday()
    setPendingFrom(f); setPendingTo(t)
    onFrom(f); onTo(t)           // presets apply immediately
  }

  function applyCustom() {
    onFrom(pendingFrom)
    onTo(pendingTo)
  }

  function clear() {
    setPendingFrom(''); setPendingTo('')
    onFrom(''); onTo('')
  }

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {label && (
        <span className="flex items-center gap-1 text-xs text-slate-500 mr-0.5">
          <Calendar className="w-3.5 h-3.5" />
          {label}
        </span>
      )}

      {/* Quick presets */}
      <div className="flex items-center gap-1">
        {([
          { label: 'Todo', months: null },
          { label: '3M',   months: 3    },
          { label: '6M',   months: 6    },
          { label: '12M',  months: 12   },
        ] as const).map((p) => {
          const active = p.months === null
            ? !isActive
            : from === isoMinus(p.months * 30) && to === isoToday()
          return (
            <button
              key={p.label}
              onClick={() => setPreset(p.months)}
              className={cn(
                'text-[11px] font-medium px-2 py-1 rounded-md transition-all',
                active
                  ? 'bg-accent text-white'
                  : 'text-slate-500 hover:text-slate-200 bg-surface border border-line/50 hover:border-line',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Custom date inputs + Apply button */}
      <div className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-0.5 border transition-colors',
        hasPending  ? 'border-warning/60 bg-warning/5'  :
        isActive    ? 'border-accent/50  bg-accent/5'   :
                      'border-line/40    bg-surface',
      )}>
        <input
          type="date"
          value={pendingFrom}
          onChange={(e) => setPendingFrom(e.target.value)}
          className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer w-[108px]"
        />
        <span className="text-xs text-slate-600">—</span>
        <input
          type="date"
          value={pendingTo}
          onChange={(e) => setPendingTo(e.target.value)}
          className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer w-[108px]"
        />

        {/* Apply button — shown when pending differs from applied */}
        {hasPending && (
          <button
            onClick={applyCustom}
            title="Apply date range"
            className="ml-0.5 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-accent text-white hover:bg-accent/80 transition-colors"
          >
            <Check className="w-3 h-3" />
            {/* label only on wider screens */}
            <span className="hidden sm:inline">Aplicar</span>
          </button>
        )}

        {/* Clear — shown when filter is active */}
        {isActive && !hasPending && (
          <button
            onClick={clear}
            title="Clear date filter"
            className="ml-0.5 text-slate-500 hover:text-danger transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// Returns true if a simulation date is within [from, to] (inclusive).
// Accepts both "YYYY-MM-DDT..." and "YYYY-MM-DD ..." formats via simDate().
export function inDateRange(fecha: string | null | undefined, from: string, to: string): boolean {
  const d = simDate(fecha)
  if (!d || d === 'unknown') return false
  if (from && d < from) return false
  if (to   && d > to)   return false
  return true
}
