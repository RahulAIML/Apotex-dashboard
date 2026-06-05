import type {
  Activity,
  ActivitiesResponse,
  AdminsResponse,
  MembersResponse,
  Simulation,
  SimulationsResponse,
} from './types'

const BASE = '/apotex/api'

// ── Exercise Sets ─────────────────────────────────────────────────────────
//
// SET 1 — simulador_Asistentes DB (137.184.208.240)
//   71  = Modelo APECS (DM Apotex)
//   174 = Periamid Coach Maestro
//   175 = Enfermedad de Parkinson Coach Maestro
//   176 = Neristren Coach Maestro
//
// SET 2 — simulador_Asistentes DB (same host)
//   111 = Evaluación de Productos 1 (Coach Evaluador)
//   128 = Evaluación de Productos 2 (Coach Evaluador)
//
// NOTE: IDs 174/175/176 (Coach Maestro) return Calificacion=0 from the
// simulator API — real scores live in simulador_ventas_callback (bridge).
// They are included for session-count accuracy; scoredSims() excludes
// Calificacion=0 sessions from avg/pass-rate calculations automatically.
//
// SET 3 — roleplay_demorp6 DB (same host, different DB)
//   470 = Arabrixen
//   471 = Apodrolen D
//   475 = Cluminol
//   476 = Divertex
//   485 = Periamid
//
const IDS_ASISTENTES = 'id=71&id=111&id=128&id=174&id=175&id=176'
const IDS_DEMORP6    = 'id=470&id=471&id=475&id=476&id=485'

// Activity names for Set 3 (roleplay_demorp6) — hardcoded because
// dim_actividades only covers the simulador_Asistentes database.
export const DEMORP6_ACTIVITIES: Activity[] = [
  { ID_Caso_de_Uso: 470, Caso_de_Uso: 'Arabrixen',   Actividad_Nombre: 'Coach Evaluador' },
  { ID_Caso_de_Uso: 471, Caso_de_Uso: 'Apodrolen D', Actividad_Nombre: 'Coach Evaluador' },
  { ID_Caso_de_Uso: 475, Caso_de_Uso: 'Cluminol',    Actividad_Nombre: 'Coach Evaluador' },
  { ID_Caso_de_Uso: 476, Caso_de_Uso: 'Divertex',    Actividad_Nombre: 'Coach Evaluador' },
  { ID_Caso_de_Uso: 485, Caso_de_Uso: 'Periamid',    Actividad_Nombre: 'Coach Evaluador' },
]

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json() as Promise<T>
}

export async function fetchActivities(): Promise<ActivitiesResponse> {
  const resp = await fetchJSON<ActivitiesResponse>(`${BASE}/dim_actividades?${IDS_ASISTENTES}`)
  // Merge Set 3 activity names (roleplay_demorp6 not covered by dim_actividades)
  const existing = Array.isArray(resp) ? resp : (resp.data ?? [])
  const merged   = [...existing, ...DEMORP6_ACTIVITIES]
  return { ...resp, data: merged } as ActivitiesResponse
}

const COACH_MAESTRO_UC_IDS = new Set([174, 175, 176])

export async function fetchSimulations(): Promise<Simulation[]> {
  // 3 parallel fetches — total wait = slowest single call
  const [raw1Result, raw2Result, cmResult] = await Promise.allSettled([
    // Sets 1+2: simulador_Asistentes (Python Flask)
    fetchJSON<SimulationsResponse>(`${BASE}/rol_play_sim_extractor?${IDS_ASISTENTES}`),
    // Set 3: roleplay_demorp6 (PHP bridge, comma-separated ids, 90s server cache)
    fetchJSON<{ ok: boolean; data: Simulation[]; total_records: number }>(
      `/bridge?action=sim.demorp6&ids=470,471,475,476,485`
    ),
    // Coach Maestro real scores — single query (IDs 174/175/176 have score=0 in simulator)
    fetchJSON<{ ok: boolean; scores: Record<string, number>; count: number }>(
      `/bridge?action=kpi.coach_scores`
    ),
  ])

  const sims1: Simulation[] = raw1Result.status === 'fulfilled'
    ? (Array.isArray(raw1Result.value) ? raw1Result.value : (raw1Result.value.data ?? []))
    : (console.warn('[client] Sets 1+2 fetch failed:', (raw1Result as PromiseRejectedResult).reason), [])

  const sims2: Simulation[] = raw2Result.status === 'fulfilled' && raw2Result.value.ok
    ? raw2Result.value.data
    : (raw2Result.status === 'rejected'
        ? (console.warn('[client] Set 3 fetch failed:', (raw2Result as PromiseRejectedResult).reason), [])
        : [])

  // Build saex_id → score map from the single coach_scores response
  const coachScores = new Map<number, number>()
  if (cmResult.status === 'fulfilled' && cmResult.value.ok) {
    for (const [saexId, score] of Object.entries(cmResult.value.scores ?? {})) {
      if (Number(score) > 0) coachScores.set(Number(saexId), Math.round(Number(score)))
    }
  }

  // Enrich Coach Maestro sessions: replace Calificacion=0 with real bridge score
  const enrichedSims1 = sims1.map(s => {
    if (COACH_MAESTRO_UC_IDS.has(s.ID_Caso_de_Uso) && (s.Calificacion === 0 || !s.Calificacion)) {
      const real = coachScores.get(s.ID_Sim)
      if (real !== undefined) return { ...s, Calificacion: real }
    }
    return s
  })

  return [...enrichedSims1, ...sims2]
}

export async function fetchMembers(): Promise<MembersResponse> {
  return fetchJSON<MembersResponse>(`${BASE}/data/rolplay_apotex_robin/members`)
}

export async function fetchAdmins(): Promise<AdminsResponse> {
  return fetchJSON<AdminsResponse>(`${BASE}/data/rolplay_apotex_robin/administrators`)
}
