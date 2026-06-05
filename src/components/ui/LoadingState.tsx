import { useAppStore } from '../../store'

interface Props {
  /** Override the default skeleton layout with a custom one */
  children?: React.ReactNode
}

/**
 * Full-page loading state shown while dashboard data is fetching.
 * Displays an animated "Recopilando la información..." message
 * so clients know something is happening.
 */
export function LoadingState({ children }: Props) {
  const { language } = useAppStore()
  const es = language === 'es'

  return (
    <div className="space-y-5">
      {/* Animated info message */}
      <div className="flex items-center gap-3 px-1 py-2">
        {/* Spinner */}
        <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
        <p className="text-sm text-slate-400 animate-pulse">
          {es ? 'Recopilando la información…' : 'Gathering information…'}
        </p>
      </div>

      {/* Skeleton cards — default layout or custom */}
      {children ?? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 h-24 skeleton rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card p-5 h-72 skeleton rounded-xl lg:col-span-2" />
            <div className="card p-5 h-72 skeleton rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 h-64 skeleton rounded-xl" />
            <div className="card p-5 h-64 skeleton rounded-xl" />
          </div>
        </>
      )}
    </div>
  )
}
