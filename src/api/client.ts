import type {
  ActivitiesResponse,
  AdminsResponse,
  MembersResponse,
  Simulation,
  SimulationsResponse,
} from './types'

const BASE = '/apotex/api'
// Simulator use-case IDs: 71 = DM Apotex (APECS) | 111·128 = Coach Evaluador
// Coach Maestro (174·175·176) returns Calificacion=0 from simulator API —
// their scores live in the bridge (simulador_ventas_callback). Excluded here.
const IDS = 'id=71&id=111&id=128'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json() as Promise<T>
}

export async function fetchActivities(): Promise<ActivitiesResponse> {
  return fetchJSON<ActivitiesResponse>(`${BASE}/dim_actividades?${IDS}`)
}

export async function fetchSimulations(): Promise<Simulation[]> {
  const raw = await fetchJSON<SimulationsResponse>(`${BASE}/rol_play_sim_extractor?${IDS}`)
  if (Array.isArray(raw)) return raw
  if ('data' in raw && Array.isArray(raw.data)) return raw.data
  return []
}

export async function fetchMembers(): Promise<MembersResponse> {
  return fetchJSON<MembersResponse>(`${BASE}/data/rolplay_apotex_robin/members`)
}

export async function fetchAdmins(): Promise<AdminsResponse> {
  return fetchJSON<AdminsResponse>(`${BASE}/data/rolplay_apotex_robin/administrators`)
}
