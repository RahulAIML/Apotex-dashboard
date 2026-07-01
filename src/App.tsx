import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Shell } from './components/layout/Shell'
import OverviewPage from './pages/OverviewPage'
import SimulationsPage from './pages/SimulationsPage'
import ConversationalPage from './pages/ConversationalPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ActivitiesPage from './pages/ActivitiesPage'
import OrganizationPage from './pages/OrganizationPage'
import CoachingPage from './pages/CoachingPage'
// RolPlay + Supervisors pages removed — Apotex has no RolPlay data (video_answers = 0)
import BusinessLinesPage from './pages/BusinessLinesPage'
import ReportsPage from './pages/ReportsPage'
import ExecutiveReportPage from './pages/ExecutiveReportPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/simulations" element={<SimulationsPage />} />
              <Route path="/conversational" element={<ConversationalPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/coaching" element={<CoachingPage />} />
              {/* /rolplay and /supervisors removed — Apotex has no RolPlay module */}
              <Route path="/business-lines" element={<BusinessLinesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/executive-report" element={<ExecutiveReportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </Shell>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
