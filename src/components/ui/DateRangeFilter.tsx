import { X, Calendar } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  from: string
  to: string
  onFrom: (v: string) => void
  onTo:   (v: string) => void
  label?:     string
  className?: string
}

// Quick preset ranges relative to today (YYYY-MM-DD)
function isoToday()  { return new Date().toISOString().split('T')[0] }
function isoMinus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function DateRangeFilter({ from, to, onFrom, onTo, label, className }: Props) {
  const isActive = !!(from || to)

  function setPreset(months: number | null) {
    if (months === null) { onFrom(''); onTo(''); return }
    onFrom(isoMinus(months * 30))
    onTo(isoToday())
  }

  function clear() { onFrom(''); onTo('') }

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
          { label: '3M',   months: 3 },
          { label: '6M',   months: 6 },
          { label: '1A',   months: 12 },
        ] as const).map((p) => {
          const active =
            p.months === null
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

      {/* Date inputs */}
      <div className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-0.5 border transition-colors',
        isActive ? 'border-accent/50 bg-accent/5' : 'border-line/40 bg-surface',
      )}>
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer w-[108px]"
        />
        <span className="text-xs text-slate-600">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer w-[108px]"
        />
        {/* Clear button — only visible when a date is set */}
        {isActive && (
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

// Returns true if isoDate (YYYY-MM-DD) is within [from, to] (inclusive).
// Empty string means unbounded.
export function inDateRange(isoDate: string, from: string, to: string): boolean {
  if (!isoDate || isoDate === 'unknown') return false
  if (from && isoDate < from) return false
  if (to   && isoDate > to)   return false
  return true
}
