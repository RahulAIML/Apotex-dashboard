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

export async function fetchSimulations(): Promise<Simulation[]> {
  // Sets 1 + 2: simulador_Asistentes via Python Flask endpoint
  const raw1 = await fetchJSON<SimulationsResponse>(
    `${BASE}/rol_play_sim_extractor?${IDS_ASISTENTES}`
  )
  const sims1: Simulation[] = Array.isArray(raw1) ? raw1 : (raw1.data ?? [])

  // Set 3: roleplay_demorp6 via PHP bridge sim.demorp6 action
  // Uses ?ids= (comma-separated) — PHP-safe alternative to duplicate ?id= keys
  let sims2: Simulation[] = []
  try {
    const raw2 = await fetchJSON<{ ok: boolean; data: Simulation[]; total_records: number }>(
      `/bridge?action=sim.demorp6&ids=470,471,475,476,485`
    )
    if (raw2.ok && Array.isArray(raw2.data)) sims2 = raw2.data
  } catch (e) {
    console.warn('[client] roleplay_demorp6 fetch failed — Set 3 exercises unavailable:', e)
  }

  return [...sims1, ...sims2]
}

export async function fetchMembers(): Promise<MembersResponse> {
  return fetchJSON<MembersResponse>(`${BASE}/data/rolplay_apotex_robin/members`)
}

export async function fetchAdmins(): Promise<AdminsResponse> {
  return fetchJSON<AdminsResponse>(`${BASE}/data/rolplay_apotex_robin/administrators`)
}
