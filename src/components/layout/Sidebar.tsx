import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, PlayCircle, MessageSquare, Brain, Trophy,
  Activity, Building2, ChevronLeft, ChevronRight,
  GitBranch, FileText, Settings, X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { cn } from '../../lib/cn'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  key: string
  exact?: boolean
}

const NAV_GROUPS: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'nav_overview',
    items: [{ to: '/', icon: LayoutDashboard, key: 'nav_overview', exact: true }],
  },
  {
    labelKey: 'nav_simulator',
    items: [
      { to: '/simulations',   icon: PlayCircle,    key: 'nav_simulations' },
      { to: '/conversational', icon: MessageSquare, key: 'nav_conversational' },
      { to: '/coaching',      icon: Brain,          key: 'nav_coaching' },
      { to: '/leaderboard',   icon: Trophy,         key: 'nav_leaderboard' },
    ],
  },
  {
    labelKey: 'nav_platform',
    items: [
      { to: '/activities',     icon: Activity,   key: 'nav_activities' },
      { to: '/organization',   icon: Building2,  key: 'nav_organization' },
      { to: '/business-lines', icon: GitBranch,  key: 'nav_business_lines' },
    ],
  },
  {
    labelKey: 'nav_more',
    items: [
      { to: '/reports',  icon: FileText, key: 'nav_reports' },
      { to: '/settings', icon: Settings, key: 'nav_settings' },
    ],
  },
]

function NavContent({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) {
  const { language } = useAppStore()
  const t = useTranslation(language)

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey}>
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#6b8aad' }}
              >
                {t(group.labelKey)}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onNavClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-[#94b0c8] hover:text-white hover:bg-white/[0.06]',
                  )
                }
                title={collapsed ? t(item.key) : undefined}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('w-4 h-4 shrink-0 relative z-10', isActive ? 'text-white' : '')} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.12 }}
                          className="relative z-10 whitespace-nowrap"
                        >
                          {t(item.key)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, language } = useAppStore()
  const t = useTranslation(language)

  const sidebarStyle = { backgroundColor: '#0f1f35', borderColor: '#1a2f4a' }

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        className="relative hidden lg:flex flex-col h-screen shrink-0 overflow-hidden z-20 border-r"
        style={sidebarStyle}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 shrink-0 border-b" style={{ borderColor: '#1a2f4a' }}>
          <div className="flex items-center gap-3 min-w-0">
            <img src="/apotex-logo.svg" alt="Apotex" className="w-9 h-9 shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col min-w-0"
                >
                  <span className="text-white font-bold text-sm leading-tight tracking-tight whitespace-nowrap">
                    Apotex
                  </span>
                  <span className="text-[10px] leading-tight whitespace-nowrap" style={{ color: '#6b8aad' }}>
                    {t('sidebar_tagline')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <NavContent collapsed={sidebarCollapsed} />

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center transition-all z-30 shadow-md"
          style={{ backgroundColor: '#0f1f35', border: '1px solid #1a2f4a', color: '#6b8aad' }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* ── Mobile sidebar drawer (< lg) ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
            className="fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col lg:hidden border-r"
            style={sidebarStyle}
          >
            <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b" style={{ borderColor: '#1a2f4a' }}>
              <div className="flex items-center gap-3">
                <img src="/apotex-logo.svg" alt="Apotex" className="w-9 h-9 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm leading-tight">Apotex</span>
                  <span className="text-[10px] leading-tight" style={{ color: '#6b8aad' }}>{t('sidebar_tagline')}</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#6b8aad' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavContent collapsed={false} onNavClick={() => setMobileMenuOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
