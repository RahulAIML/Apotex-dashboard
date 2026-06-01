/**
 * Apotex — Teams & Assignments Page
 * Teams and Assignments page — Apotex.
 * Uses PHP bridge: leaderboard, assignments, completion, members.
 */
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, Activity, CheckCircle, Clock, Search, Download } from 'lucide-react'
import { useBridgeLeaderboard, useBridgeCompletion, useBridgeAssignments, useBridgeMembers } from '../api/roleplayQueries'
import { useAppStore } from '../store'
import { PageHeader } from '../components/ui/PageHeader'
import { TableSkeleton, KPICardSkeleton } from '../components/ui/Skeleton'
import { downloadCSV } from '../lib/csvExport'

const csvDate = () => new Date().toISOString().split('T')[0]

export default function SupervisorsPage() {
  const { language } = useAppStore()
  const es = language === 'es'
  const [search, setSearch] = useState('')

  const leaderboard = useBridgeLeaderboard(200)
  const completion  = useBridgeCompletion()
  const assignments = useBridgeAssignments(500)
  const members     = useBridgeMembers()

  const isLoading = leaderboard.isLoading || completion.isLoading

  const filtered = (leaderboard.data ?? []).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const exportAssignments = () => {
    downloadCSV(
      (assignments.data ?? []).map(a => ({
        Asignado: a.asim_datetime,
        Nombre: a.mb_fullname,
        Email: a.mb_email,
        Actividad: a.simv_title,
        Tipo: a.simv_type,
        Score: a.score ?? '',
        Completado: a.completed_at ?? '',
        Status: a.status,
      })),
      `apotex_assignments_${csvDate()}.csv`
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title={es ? 'Equipos y Asignaciones' : 'Teams & Assignments'} icon={Users} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i)=><KPICardSkeleton key={i}/>)}
        </div>
        <TableSkeleton rows={10}/>
      </div>
    )
  }

  const lb = leaderboard.data ?? []
  const comp = completion.data ?? []
  const asgn = assignments.data ?? []
  const mbrs = members.data?.members ?? []

  const totalAssigned = comp.reduce((s,c) => s + c.assigned, 0)
  const totalCompleted = comp.reduce((s,c) => s + c.completed, 0)
  const completionPct = totalAssigned > 0 ? Math.round(totalCompleted/totalAssigned*100) : 0

  // Pending assignments
  const pending = asgn.filter(a => a.status === 'pending').length
  const completed = asgn.filter(a => a.status === 'completed').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title={es ? 'Equipos y Asignaciones' : 'Teams & Assignments'}
          subtitle={es ? 'Seguimiento de asignaciones y rendimiento' : 'Assignment tracking and performance'}
          icon={Users}
        />
        <button
          onClick={exportAssignments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
        >
          <Download className="w-4 h-4"/>
          {es ? 'Exportar Asignaciones' : 'Export Assignments'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: es?'Total Miembros':'Total Members', value: mbrs.length, icon: Users, bg: 'bg-blue-50 dark:bg-blue-950', ic: 'text-blue-600' },
          { label: es?'Asignaciones':'Assignments', value: asgn.length, icon: Activity, bg: 'bg-violet-50 dark:bg-violet-950', ic: 'text-violet-600' },
          { label: es?'Completadas':'Completed', value: completed, icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950', ic: 'text-emerald-600' },
          { label: es?'Pendientes':'Pending', value: pending, icon: Clock, bg: 'bg-amber-50 dark:bg-amber-950', ic: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">{k.label}</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{k.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${k.bg}`}>
                <k.icon className={`w-5 h-5 ${k.ic}`}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {es ? 'Completitud por Actividad' : 'Completion by Activity'}
          </h3>
          <span className="text-sm font-bold text-violet-600">{completionPct}% {es?'global':'overall'}</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comp} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0"/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:10}} stroke="#94a3b8" tickFormatter={v=>`${v}%`}/>
            <YAxis type="category" dataKey="activity_name" tick={{fontSize:10}} width={160} stroke="#94a3b8"/>
            <Tooltip formatter={(v:number) => [`${v}%`, es?'Completitud':'Completion']}/>
            <Bar dataKey="completion_pct" radius={[0,4,4,0]}>
              {comp.map((c,i) => (
                <Cell key={i} fill={c.completion_pct>=70?'#10b981':c.completion_pct>=40?'#f59e0b':'#ef4444'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Leaderboard */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {es ? 'Rendimiento de Usuarios' : 'User Performance'} ({filtered.length})
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={es?'Buscar usuario...':'Search user...'}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['#', es?'Nombre':'Name', 'Email', es?'Sesiones':'Sessions', es?'Promedio':'Avg',
                  es?'Mejor':'Best', es?'Aprobados':'Pass', es?'Sucursal':'Branch', es?'Línea':'Line'].map(h=>(
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u,i) => (
                <tr key={u.mb_id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{i+1}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{u.email||'–'}</td>
                  <td className="px-3 py-2.5">{u.sessions}</td>
                  <td className="px-3 py-2.5 font-semibold" style={{color:u.avg_score>=70?'#16a34a':'#dc2626'}}>{u.avg_score}%</td>
                  <td className="px-3 py-2.5">{u.best_score}%</td>
                  <td className="px-3 py-2.5">{u.sessions_pass}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{u.branch||'–'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{u.line||'–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignments Detail */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {es ? 'Detalle de Asignaciones' : 'Assignment Detail'} ({asgn.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {[es?'Nombre':'Name', 'Email', es?'Actividad':'Activity', es?'Tipo':'Type',
                  es?'Score':'Score', es?'Completado':'Completed At', es?'Estado':'Status'].map(h=>(
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {asgn.slice(0, 100).map(a => (
                <tr key={a.asim_id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{a.mb_fullname}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{a.mb_email}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{a.simv_title}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{a.simv_type}</td>
                  <td className="px-3 py-2.5 font-semibold" style={{color:a.score!=null?(a.score>=70?'#16a34a':'#dc2626'):'#94a3b8'}}>
                    {a.score != null ? `${a.score}%` : '–'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{a.completed_at?.split('T')[0]||'–'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status==='completed'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300':'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'}`}>
                      {a.status === 'completed' ? (es?'Completado':'Completed') : (es?'Pendiente':'Pending')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {asgn.length > 100 && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              {es?`Mostrando 100 de ${asgn.length}. Exporta CSV para ver todos.`:`Showing 100 of ${asgn.length}. Export CSV for full list.`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
