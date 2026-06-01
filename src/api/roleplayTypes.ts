/** ============================================================
 *  Apotex Bridge — TypeScript types
 *  Source: rolplay_apotex_robin via PHP bridge v3.0
 * ============================================================ */

// ── Overview KPIs ─────────────────────────────────────────
export interface BridgeOverview {
  total_sessions: number
  unique_users: number
  avg_score: number
  min_score: number
  max_score: number
  sessions_pass: number
  sessions_fail: number
  activities_used: number
  pass_rate_pct: number
  total_members: number
  total_admins: number
  assigned_users: number
  total_logins: number
  active_activities: number
}

// ── Activity Summary ──────────────────────────────────────
export interface BridgeActivityStat {
  activity_id: number
  activity_name: string
  activity_type: 'Coach evaluador' | 'Coach maestro' | 'Visita Médica APECS' | string
  description: string
  slug: string
  usecase_id: number
  sessions: number
  unique_users: number
  avg_score: number | null
  min_score: number | null
  max_score: number | null
  sessions_pass: number
  assigned_users: number
  pass_rate_pct: number
}

// ── Leaderboard ───────────────────────────────────────────
export interface BridgeLeaderboardUser {
  mb_id: number
  name: string
  email: string
  branch: string
  line: string
  sessions: number
  avg_score: number
  best_score: number
  sessions_pass: number
  last_session: string
  pass_rate_pct: number
}

// ── Trend ─────────────────────────────────────────────────
export interface BridgeTrendPoint {
  period: string        // e.g. '2026-03' for monthly
  sessions: number
  unique_users: number
  avg_score: number
  sessions_pass: number
}

// ── Score Distribution ────────────────────────────────────
export interface BridgeScoreBucket {
  range: string         // e.g. '70-84'
  count: number
  pct: number
}

// ── Completion Rate ───────────────────────────────────────
export interface BridgeCompletionRate {
  activity_id: number
  activity_name: string
  activity_type: string
  assigned: number
  completed: number
  not_started: number
  completion_pct: number
}

// ── Sessions ──────────────────────────────────────────────
export interface BridgeSession {
  id: number
  fecha: string
  mb_id: number
  nombre: string
  email: string
  branch: string
  line: string
  activity_id: number
  actividad: string
  tipo: string
  usecase_id: number
  score: number
  saex_ref: number
}

// ── Members ───────────────────────────────────────────────
export interface BridgeMember {
  mb_id: number
  mb_fullname: string
  mb_email: string
  mb_admin: number
  mb_branch: string
  mb_city: string
  mb_state: string
  mb_line: string
  mb_designation: string
  mb_employee_code: string
  mb_date_create: string
  mb_last_login: string
  mb_status: number
  mb_idTag1: number
  mb_idTag2: number
  mb_idTag3: number
}

// ── Admins ────────────────────────────────────────────────
export interface BridgeAdmin {
  rpa_id: number
  rpa_full_name: string
  rpa_email: string
  rpa_profile_type: string
  rpa_company: string
  rpa_sede: string
  rpa_enabled_stt: number
  rpa_enabled_ae: number
  rpa_mod_admin: number
  rpa_mod_creator: number
  rpa_is_demo: number
  rpa_create_date: string
}

// ── Activity Catalog ──────────────────────────────────────
export interface BridgeActivity {
  simv_id: number
  simv_title: string
  simv_desc: string
  simv_main_activity: string
  simv_type: string
  simv_case: number
  simv_status: number
  simv_datetime: string
  total_sessions: number
  assigned_users: number
}

// ── Assignments ───────────────────────────────────────────
export interface BridgeAssignment {
  asim_id: number
  asim_datetime: string
  mb_id: number
  mb_fullname: string
  mb_email: string
  simv_id: number
  simv_title: string
  simv_type: string
  score: number | null
  completed_at: string | null
  status: 'completed' | 'pending'
}

// ── Login Activity ────────────────────────────────────────
export interface BridgeLoginActivity {
  month: string
  logins: number
  unique_users: number
  user_type: string
}

// ── Tags ──────────────────────────────────────────────────
export interface BridgeTag {
  id: number
  name: string
  description: string
  idStatus: number
  member_count?: number
}

// ── Activity type helpers ─────────────────────────────────
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  'Coach evaluador':    'Coach Evaluador',
  'Coach maestro':      'Coach Maestro',
  'Visita Médica APECS':'Visita Médica',
}

export const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  'Coach evaluador':    'blue',
  'Coach maestro':      'violet',
  'Visita Médica APECS':'green',
}
