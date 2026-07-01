import { Globe, RefreshCw, Menu, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore, type Language } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { cn } from '../../lib/cn'

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'ES', flag: '🇲🇽' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
]

export function TopBar() {
  const { language, setLanguage, toggleMobileMenu } = useAppStore()
  const t = useTranslation(language)
  const queryClient = useQueryClient()

  return (
    <header className="h-16 bg-white dark:bg-[#080d1a] border-b border-gray-200 dark:border-white/[0.06] flex items-center px-4 sm:px-6 shrink-0 z-10 gap-4">
      {/* Left: hamburger (mobile only) */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        title="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Platform title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight hidden sm:block">
          {t('platform_tagline')}
        </h1>
      </div>

      {/* Right: refresh + language + user */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => queryClient.invalidateQueries()}
          title="Refresh data"
          className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors hidden sm:flex"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Language toggle */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] rounded-lg px-2 py-1">
          <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition-all duration-150',
                language === l.code
                  ? 'bg-accent text-white'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200',
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        {/* User info */}
        <button className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-white/[0.07]">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">A</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-tight">Admin</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-tight">Administrator</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 ml-1" />
        </button>
      </div>
    </header>
  )
}
