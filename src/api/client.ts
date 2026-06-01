import type {
  ActivitiesResponse,
  AdminsResponse,
  MembersResponse,
  Simulation,
  SimulationsResponse,
} from './types'

const BASE = '/apotex/api'
// Apotex use-case IDs: 71·111·128 = Coach Evaluador | 174·175·176 = Coach Maestro
const IDS = 'id=71&id=111&id=128&id=174&id=175&id=176'

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
