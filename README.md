# Apotex Analytics Dashboard

Production-ready analytics dashboard for Apotex, built on the Gentera dashboard baseline.

## Architecture

```
Browser
  ↓
Vite Dev Server (proxy)
  ↓
┌─────────────────────────────────────────────────┐
│            serv.aux-rolplay.com                 │
│                                                 │
│  /apotex/api/...      → Python Flask (Docker)   │
│    dim_actividades         use cases 71,111,    │
│    rol_play_sim_extractor  128,174,175,176       │
│    members / admins                             │
│                                                 │
│  /apotex/bridge/...   → PHP Bridge (Docker)     │
│    kpi.overview            rolplay_apotex_robin │
│    kpi.activity_summary    138.68.248.149       │
│    kpi.leaderboard                              │
│    kpi.score_trend                              │
│    kpi.completion_rate                          │
│    list.members / admins                        │
│    list.assignments                             │
│    kpi.login_activity                           │
└─────────────────────────────────────────────────┘
```

## Pages

| Route | Page | Data Source |
|-------|------|-------------|
| `/` | Overview | Simulator endpoints |
| `/simulations` | Simulations | Simulator endpoints |
| `/leaderboard` | Leaderboard | Simulator endpoints |
| `/activities` | Activities | Simulator endpoints |
| `/organization` | Organization | Members + Admins |
| `/coaching` | Coaching | Simulator endpoints |
| `/rolplay` | **Bridge Analytics** | PHP Bridge (all KPIs) |
| `/supervisors` | **Teams & Assignments** | PHP Bridge |
| `/business-lines` | Business Lines | Simulator endpoints |
| `/reports` | Reports | Simulator + Bridge |
| `/settings` | Settings | Static |

## Setup

```bash
npm install
cp .env.example .env
# Add VITE_GEMINI_API_KEY if you want the AI assistant
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Optional | Gemini API key for AI assistant |
| `VITE_GEMINI_MODEL` | Optional | Default: `gemini-2.0-flash` |
| `PORT` | Optional | Production port, default `4173` |

## Confidential Data Policy

- No credentials, IPs, or passwords are stored in this repository
- All API endpoints are proxied — the browser never sees server IPs
- DB credentials live only in the `.env` file on the server (not committed)
- The `.gitignore` excludes all `.env` files

## KPI Documentation

See [KPI_MAPPING.md](./KPI_MAPPING.md) for full KPI mapping: Gentera → Apotex.

## Schema Documentation

See [SCHEMA.md](./SCHEMA.md) for full database schema: tables, columns, relationships.
