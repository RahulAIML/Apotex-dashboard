# Apotex Analytics Dashboard — Technical Documentation

**Version:** 1.0.0
**Date:** June 2026
**Prepared by:** Rolplay Engineering
**Status:** Production

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Infrastructure & Server](#3-infrastructure--server)
4. [Data Sources](#4-data-sources)
5. [KPI Definitions & Formulas](#5-kpi-definitions--formulas)
6. [Frontend Application](#6-frontend-application)
7. [PHP Bridge API](#7-php-bridge-api)
8. [Deployment Guide](#8-deployment-guide)
9. [Server Management Tools](#9-server-management-tools)
10. [Maintenance Procedures](#10-maintenance-procedures)
11. [Security Policy](#11-security-policy)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

### 1.1 Purpose

The Apotex Analytics Dashboard is a production-grade analytics platform built for Apotex's commercial training teams. It consolidates data from two independent simulator backends into a unified, real-time business intelligence interface.

### 1.2 Business Context

Apotex uses the Rolplay platform to train its medical sales representatives through commercial simulations. There are two simulator products active:

| Simulator | Description | Activity Types |
|---|---|---|
| **Coaching Simulator** | AI-driven Q&A coaching sessions | DM Apotex, Coach Evaluador, Coach Maestro |
| **Visita Médica APECS** | Sales visit product simulations | Arabrixen, Cluminol, Apodrolen D, Divertex, Periamid |

### 1.3 Key Metrics at a Glance

| Metric | Value (as of June 2026) |
|---|---|
| Coaching sessions (simulator) | 358 (Apotex-only, filtered) |
| Full platform sessions (bridge) | 767 |
| Active users | 35 |
| Registered members | 24 (with email) |
| Activities deployed | 11 |
| Pass threshold | 70% |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│   React + TypeScript + Vite (served by Vercel CDN)              │
│   https://apotex-dashboard.vercel.app                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS requests
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              serv.aux-rolplay.com : 443                         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │          salinas_reverse_proxy (nginx:alpine)           │   │
│   │                                                         │   │
│   │  /apotex/api/*   ──────────────────────────────────┐   │   │
│   │  /apotex/bridge/* ──────────────────────────────┐   │   │   │
│   └─────────────────────────────────────────────────┼───┼───┘   │
│                                                     │   │       │
│   ┌──────────────────────────────────┐              │   │       │
│   │  api_members_apotex_service      │◄─────────────┘   │       │
│   │  Python Flask : 5000 (internal)  │                   │       │
│   │  Source: simulador_Asistentes DB │                   │       │
│   └──────────────────────────────────┘                   │       │
│                                                           │       │
│   ┌──────────────────────────────────┐                   │       │
│   │  apotex_bridge_container         │◄──────────────────┘       │
│   │  PHP 8.2 Apache : 80 (internal)  │                           │
│   │  Source: rolplay_apotex_robin DB │                           │
│   └──────────────────────────────────┘                           │
│                                                                 │
│                    VPS: 147.182.139.153                         │
│                    OS: CentOS Stream 9                          │
│                    RAM: 7.5 GB | Disk: 24.93 GB                 │
└─────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴──────────────────┐
          ▼                                   ▼
┌──────────────────────┐           ┌──────────────────────┐
│  simulador_Asistentes│           │ rolplay_apotex_robin  │
│  137.184.208.240:3306│           │ 138.68.248.149:3306   │
│  MySQL               │           │ MySQL                 │
│  Coaching Q&A data   │           │ Platform data         │
└──────────────────────┘           └──────────────────────┘
```

### 2.2 Request Flow

1. User opens dashboard at `https://apotex-dashboard.vercel.app`
2. Vercel serves the static React build
3. Browser executes React — fetches data via proxy rewrites in `vercel.json`
4. `fetch("/apotex/api/...")` → Vercel rewrites → `serv.aux-rolplay.com/apotex/api/...`
5. Nginx routes to `api_members_apotex_service` (Python Flask)
6. `fetch("/bridge/...")` → Vercel rewrites → `serv.aux-rolplay.com/apotex/bridge/...`
7. Nginx routes to `apotex_bridge_container` (PHP)
8. PHP queries `rolplay_apotex_robin` MySQL directly
9. JSON response returns to browser → React renders charts

---

## 3. Infrastructure & Server

### 3.1 Server Specifications

| Property | Value |
|---|---|
| Provider | DigitalOcean |
| IP | 147.182.139.153 |
| Hostname | WEBSERVICES-DASHBOARD-POWERBI |
| OS | CentOS Stream Linux 9 |
| Kernel | 5.14.0-570.el9.x86_64 |
| CPU | 4 cores (DO-Regular) |
| RAM | 7.5 GB |
| Disk | 24.93 GB |
| Uptime | 307+ days |

### 3.2 Port Map

| Port | Protocol | Service | Visibility |
|---|---|---|---|
| 22 | TCP | SSH (sshd) | Public |
| 443 | TCP | HTTPS — all API traffic (nginx) | Public |
| 5000 | TCP | Python Simulator API | Internal Docker only |
| 5001 | TCP | Absorb API | Internal |
| 5432 | TCP | PostgreSQL (chat logs) | Internal |
| 7001 | TCP | Exceltis dashboards | Internal |
| 8012 | TCP | Lily dashboard | Internal |
| 8899 | TCP | Adminer DB browser | Public (management) |
| 10000 | TCP | Webmin server panel | Public (management) |

### 3.3 Docker Containers — Apotex Specific

| Container | Image | Network | Role |
|---|---|---|---|
| `salinas_reverse_proxy` | nginx:alpine | host:443 | HTTPS reverse proxy for all services |
| `api_members_apotex_service` | custom Python | internal:5000 | Simulator endpoints (Flask) |
| `apotex_bridge_container` | apotex_bridge:latest | internal:80 | PHP direct-DB bridge |
| `exceltis_dashboard_apotex` | custom | internal:7001 | Legacy Exceltis dashboard |

### 3.4 SSH Access

```bash
ssh -i "D:\Apotex_dashboard\shared_root_key" root@147.182.139.153
```

**Key file location:** `D:\Apotex_dashboard\shared_root_key`

**Windows permission fix (run once if SSH fails):**
```powershell
icacls "D:\Apotex_dashboard\shared_root_key" /inheritance:r /remove "*S-1-5-32"
icacls "D:\Apotex_dashboard\shared_root_key" /grant "$($env:USERDOMAIN)\$($env:USERNAME):R"
```

### 3.5 Nginx Configuration

Config files are host-mounted into `salinas_reverse_proxy`:

```
/root/HTTPS_INFRA_SALINAS/reverse-proxy/
├── nginx.conf              ← main nginx config
└── conf.d/
    ├── apotex.conf         ← Apotex API + bridge routes
    ├── server_tools.conf   ← Portainer + Adminer routes
    └── ...                 ← other client configs
```

**Apotex routes (`conf.d/apotex.conf`):**
```nginx
location /apotex/api/ {
    proxy_pass http://api_members_apotex_service:5000/;
}

location /apotex/bridge/ {
    proxy_pass http://apotex_bridge_container:80/index.php;
}
```

After editing nginx config, reload with:
```bash
docker exec salinas_reverse_proxy nginx -t && docker exec salinas_reverse_proxy nginx -s reload
```

---

## 4. Data Sources

### 4.1 Database 1 — `simulador_Asistentes` (Coaching Simulator)

| Property | Value |
|---|---|
| Host | 137.184.208.240 |
| Port | 3306 |
| Database | `simulador_Asistentes` |
| User | `rpsim` |
| Connection | Via SSH tunnel only (port blocked publicly) |

**Key tables:**

| Table | Records | Description |
|---|---|---|
| `sale_exercises` | 436 | All simulation session results |
| `usecases` | — | Activity definitions |

**Apotex use case IDs:**

| ID | Name | Type |
|---|---|---|
| 71 | DM Apotex | Coach evaluador |
| 111 | Apotex - Coach Evaluador (Productos 1) | Coach evaluador |
| 128 | Apotex - Coach Evaluador (Productos 2) | Coach evaluador |
| 174 | Apotex - Coach Periamid | Coach maestro |
| 175 | Apotex - Coach Parkinson | Coach maestro |
| 176 | Apotex - Coach Neristren | Coach maestro |

**Important fields:**

| Field | Type | Description |
|---|---|---|
| `saex_rp_email` | varchar | User email (null for early pilots) |
| `saex_rp_client` | varchar | Client tag (`'apotex'` or null) |
| `saex_username` | varchar | Display name |
| `Calificacion` | int | Final score 0–100 (use this for all KPIs) |
| `Puntos_Totales` | int | Raw points (0–50 for Coach Eval; 0 for Coach Maestro — do NOT use for avg) |
| `Puntos_1..6` | int/string | Per-interaction points (null or "No aplica" for Coach Maestro) |
| `Diagnostico_Final` | varchar | Legacy field — values: ALTO, MEDIO, BAJO, NO, SI, or long text. **Do NOT use for pass/fail logic** |
| `saex_DateTime` | datetime | Session timestamp |

### 4.2 Database 2 — `rolplay_apotex_robin` (Platform DB)

| Property | Value |
|---|---|
| Host | 138.68.248.149 |
| Port | 3306 |
| Database | `rolplay_apotex_robin` |
| User | `apotexDashboard` |
| Connection | Via SSH tunnel or bridge container internally |

**Key tables:**

| Table | Records | Description |
|---|---|---|
| `simulador_ventas_callback` | 767 | All simulator results (ALL 11 activities) |
| `simulador_ventas` | 12 | Activity catalog |
| `members` | 61 | Platform users (37 have empty email = valid Apotex users) |
| `administrators` | 21 | Admin/supervisor accounts |
| `assign_simuladors_users` | 253 | Activity assignments |
| `login_logs` | 1,290 | Login history |
| `tag1` | 6 | User grouping tags |

**Internal accounts to exclude from KPIs (mb_id 1–4):**

| mb_id | Email | Role |
|---|---|---|
| 1 | ucontenido@rolplay.net | Rolplay Content |
| 2 | udev@rolplay.net | Rolplay Dev |
| 3 | utester@rolplay.net | Rolplay Tester |
| 4 | udemo@rolplay.net | Rolplay Demo |

### 4.3 Data Source Comparison

| Metric | simulador_Asistentes | rolplay_apotex_robin |
|---|---|---|
| Sessions | 436 (6 coaching activities) | 767 (11 activities incl. Visita Médica) |
| Score field | `Calificacion` (0–100) | `simv_callback_score` (0–100) |
| Has Q&A detail | Yes (Pregunta/Respuesta/Retroalimentacion) | No (score only) |
| Has Visita Médica | No (IDs 470,471,475,476,485 missing) | Yes |

**Why two sources:** `simulador_Asistentes` is the AI coaching engine (detailed Q&A, feedback per interaction). `simulador_ventas_callback` is the Apotex platform's own record of all completed sessions including product visit simulations.

---

## 5. KPI Definitions & Formulas

### 5.1 Pass/Fail Standard

**Pass threshold: 70%** (`Calificacion >= 70`)

> ⚠️ Do NOT use `Diagnostico_Final === 'Si'` — this field is a Gentera-era artifact and does not apply to Apotex data. Apotex values are ALTO / MEDIO / BAJO / NO.

### 5.2 Simulator KPIs (Coaching — 6 activities)

| KPI | Formula | Source Field | Notes |
|---|---|---|---|
| Total Simulations | `COUNT(filtered sessions)` | row count | After filterTestUsers() |
| Average Score | `AVG(Calificacion) WHERE Calificacion > 0` | `Calificacion` | Excludes Coach Maestro (score=0 in simulator) |
| Pass Rate | `COUNT(Calificacion >= 70) / COUNT(Calificacion > 0) × 100` | `Calificacion` | Denominator = scored sessions only |
| Active Advisors | `COUNT(DISTINCT Usuario_Nombre)` | `Usuario_Nombre` | After filter |
| Score Trend | Group by date, `AVG(Calificacion > 0)` per day | `Fecha_y_Hora` | — |
| Score Distribution | Bucket `Calificacion` into 0–20, 21–40, 41–60, 61–80, 81–100 | `Calificacion` | — |

> **Why Calificacion > 0 for avg:** Coach Maestro sessions (IDs 174,175,176) store `Calificacion = 0` in `simulador_Asistentes`. Their real score lives in `simulador_ventas_callback`. Including zeros would incorrectly drag the average down.

> **The old formula that caused 4855%:** `sum(Puntos_Totales) / count(applicable Puntos_1..6 interactions) × 100`. For Apotex, `count(applicable)` was only 107 (Coach Maestro has no Puntos_1..6) while `sum(Puntos_Totales)` was 5,098 → result: 4,764%. This formula is valid only for Gentera, not Apotex.

### 5.3 Full Platform KPIs (Bridge — all 11 activities)

| KPI | Formula | Source |
|---|---|---|
| Total Sessions | `COUNT(simulador_ventas_callback)` | bridge `kpi.overview` |
| Avg Score | `AVG(simv_callback_score)` | bridge `kpi.overview` |
| Pass Rate | `COUNT(simv_callback_score >= 70) / total × 100` | bridge `kpi.overview` |
| Active Users | `COUNT(DISTINCT simv_callback_user) WHERE mb_id NOT IN (1,2,3,4)` | bridge `kpi.overview` |
| Completion Rate | `completed / assigned × 100` per activity | bridge `kpi.completion_rate` |
| Leaderboard | Order by `AVG(simv_callback_score) DESC` | bridge `kpi.leaderboard` |

### 5.4 Data Filters Applied

**filterTestUsers() — applied to all simulator data:**
- Removes sessions with names in blocklist (Mario Motta, Glieb, Arqui, Andrea, etc.)
- Removes sessions with non-`@apotex` email domains (e.g. `guadalupe.cuevas@audioweb.com.mx`)
- Removes sessions with no email AND test-looking name patterns

**Bridge filters:**
- `WHERE m.mb_id NOT IN (1,2,3,4)` — excludes Rolplay internal accounts from all user-facing queries

---

## 6. Frontend Application

### 6.1 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type safety |
| Vite | 5.4.3 | Build tool |
| Tailwind CSS | 3.4.11 | Styling |
| Recharts | 2.12.7 | All charts |
| TanStack Query | 5.56.2 | Data fetching & caching |
| Zustand | 5.0.0 | Global state |
| Framer Motion | 11.11.1 | Animations |
| React Router | 6.26.2 | Client-side routing |
| @google/generative-ai | 0.21.0 | AI Assistant (Gemini) |

### 6.2 Page Inventory

| Route | Page | Data Source | Description |
|---|---|---|---|
| `/` | Overview | Simulator + Bridge | Executive summary with full platform banner |
| `/simulations` | Simulations | Simulator | Session-level table with filters |
| `/conversational` | Conversational Intelligence | Simulator | Per-interaction Q&A analysis |
| `/coaching` | AI Coaching | Simulator | Low performers, weak activities |
| `/leaderboard` | Leaderboard | Simulator | User ranking by avg score |
| `/activities` | Activities | Simulator | Per-activity breakdown |
| `/organization` | Organization | Members + Admins | User hierarchy |
| `/business-lines` | Business Lines | Simulator | Product line analytics |
| `/reports` | Reports | Simulator | CSV export interface |
| `/settings` | Configuration | Static | Platform settings display |

> **Note:** `/rolplay` and `/supervisors` routes are intentionally removed. Apotex does not have the RolPlay video coaching module active (`video_answers` table = 0 records).

### 6.3 Global State (Zustand Store)

```typescript
interface AppState {
  language: 'es' | 'en'          // default: 'es'
  theme: 'light' | 'dark'        // default: 'light'
  sidebarCollapsed: boolean
  aiOpen: boolean
  mobileMenuOpen: boolean
  selectedActivityId: number | null
  dateFrom: string | null
  dateTo: string | null
}
```

### 6.4 React Query Cache Keys

| Query Key | Endpoint | Stale Time |
|---|---|---|
| `['activities']` | `/apotex/api/dim_actividades` | 5 min |
| `['simulations']` | `/apotex/api/rol_play_sim_extractor` | 5 min |
| `['members']` | `/apotex/api/data/rolplay_apotex_robin/members` | 5 min |
| `['admins']` | `/apotex/api/data/rolplay_apotex_robin/administrators` | 5 min |
| `['bridge_overview', params]` | `/bridge/?action=kpi.overview` | 5 min |
| `['bridge_leaderboard', limit]` | `/bridge/?action=kpi.leaderboard` | 5 min |
| `['bridge_activities', params]` | `/bridge/?action=kpi.activity_summary` | 5 min |
| `['bridge_trend', gran, params]` | `/bridge/?action=kpi.score_trend` | 5 min |

### 6.5 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_GEMINI_API_KEY` | Optional | — | Google Gemini API key for AI Assistant |
| `VITE_GEMINI_MODEL` | Optional | `gemini-2.0-flash` | Gemini model version |

---

## 7. PHP Bridge API

### 7.1 Location

| Environment | Path |
|---|---|
| Server file | `/root/Bridge_Apotex/index.php` |
| Docker image | `apotex_bridge:latest` |
| Container | `apotex_bridge_container` |
| Public URL | `https://serv.aux-rolplay.com/apotex/bridge/?action=<action>` |

### 7.2 Dockerfile

```dockerfile
FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql
COPY index.php /var/www/html/index.php
COPY .htaccess /var/www/html/.htaccess
RUN a2enmod rewrite
EXPOSE 80
```

### 7.3 Available Actions

| Action | Description | Parameters |
|---|---|---|
| `kpi.overview` | Platform-wide summary KPIs | `date_from`, `date_to` |
| `kpi.activity_summary` | Per-activity breakdown | `date_from`, `date_to` |
| `kpi.leaderboard` | User ranking by avg score | `limit`, `date_from`, `date_to`, `activity_id` |
| `kpi.score_trend` | Score over time | `granularity` (day/week/month), `date_from`, `date_to` |
| `kpi.score_distribution` | Score bucket distribution | `date_from`, `date_to` |
| `kpi.completion_rate` | Completion % per activity | — |
| `kpi.login_activity` | Login logs by month | — |
| `list.members` | Member list | `search` |
| `list.admins` | Admin/supervisor list | — |
| `list.activities` | Activity catalog | — |
| `list.assignments` | Assignment records | `limit` |
| `list.tags` | tag1 and tag2 groups | — |

### 7.4 Response Format

All actions return:
```json
{ "ok": true, "<key>": [...] }
```

On error:
```json
{ "ok": false, "error": "message" }
```

### 7.5 Rebuild & Deploy Bridge

```bash
# 1. Edit the file
nano /root/Bridge_Apotex/index.php

# 2. Rebuild Docker image
cd /root/Bridge_Apotex
docker build -t apotex_bridge:latest .

# 3. Restart container
docker rm -f apotex_bridge_container
docker run -d \
  --name apotex_bridge_container \
  --network https_infra_salinas_app-network \
  --restart unless-stopped \
  apotex_bridge:latest

# 4. Test
curl "https://serv.aux-rolplay.com/apotex/bridge/?action=kpi.overview"
```

**Or upload from Windows:**
```powershell
scp -i "D:\Apotex_dashboard\shared_root_key" `
    "D:\tmp\apotex-bridge-deploy\bridge\index.php" `
    root@147.182.139.153:/root/Bridge_Apotex/index.php
```

---

## 8. Deployment Guide

### 8.1 Prerequisites

- Node.js 18+
- npm 9+
- Git
- Vercel account (or any static host)

### 8.2 Local Development

```bash
# 1. Clone repository
git clone https://github.com/RahulAIML/Apotex-dashboard.git
cd Apotex-dashboard

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env
# Add VITE_GEMINI_API_KEY if you want the AI assistant

# 4. Start development server
npm run dev
# Opens at http://localhost:5173
# API calls are proxied to serv.aux-rolplay.com via vite.config.ts
```

### 8.3 Vercel Deployment

**One-time setup:**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `RahulAIML/Apotex-dashboard` from GitHub
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables:
   - `VITE_GEMINI_API_KEY` = your Gemini key
7. Click **Deploy**

**`vercel.json` handles production API routing:**
```json
{
  "rewrites": [
    {
      "source": "/apotex/api/:path*",
      "destination": "https://serv.aux-rolplay.com/apotex/api/:path*"
    },
    {
      "source": "/bridge/:path*",
      "destination": "https://serv.aux-rolplay.com/apotex/bridge/index.php"
    }
  ]
}
```

### 8.4 Build Commands

```bash
npm run dev       # Development server with hot reload
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

---

## 9. Server Management Tools

All three tools are deployed and accessible without terminal.

### 9.1 Webmin — Full Server Control Panel

| Property | Value |
|---|---|
| URL | `https://147.182.139.153:10000/` |
| Username | `root` |
| Password | `Apotex@2024!` |

> Browser will show SSL warning — click **Advanced → Proceed**. This is expected (self-signed certificate).

**Use for:** File manager, logs, firewall, scheduled tasks, system monitoring.

### 9.2 Portainer — Docker Container Manager

| Property | Value |
|---|---|
| URL | `https://serv.aux-rolplay.com/portainer/` |
| Username | admin (set on first visit) |

**Use for:** Viewing container status, reading logs, restarting containers.

> If you see "Portainer timed out": SSH in and run `docker restart portainer`, then visit the URL within 5 minutes to set the password.

### 9.3 Adminer — Database Browser

| Property | Value |
|---|---|
| URL | `http://147.182.139.153:8899/` |

**Connection 1 — Platform DB:**

| Field | Value |
|---|---|
| System | MySQL |
| Server | `138.68.248.149` |
| Username | `apotexDashboard` |
| Password | `Ecosphere-Durably-Pettiness-Quartet` |
| Database | `rolplay_apotex_robin` |

**Connection 2 — Simulator DB:**

| Field | Value |
|---|---|
| System | MySQL |
| Server | `137.184.208.240` |
| Username | `rpsim` |
| Password | `skeleton-scribe-selective` |
| Database | `simulador_Asistentes` |

> ⚠️ Use `SELECT` only. Never run `UPDATE`, `DELETE`, or `DROP` directly on production databases.

---

## 10. Maintenance Procedures

### 10.1 Updating the Bridge File

**Via Webmin (no terminal needed):**
1. Open `https://147.182.139.153:10000/`
2. Go to **Tools → File Manager**
3. Navigate to `/root/Bridge_Apotex/`
4. Click `index.php` → Edit → Save
5. Open terminal (Webmin → Tools → Terminal):
   ```bash
   cd /root/Bridge_Apotex && docker build -t apotex_bridge:latest . && docker rm -f apotex_bridge_container && docker run -d --name apotex_bridge_container --network https_infra_salinas_app-network --restart unless-stopped apotex_bridge:latest
   ```

**Via SCP from Windows:**
```powershell
scp -i "D:\Apotex_dashboard\shared_root_key" `
    "local\path\to\index.php" `
    root@147.182.139.153:/root/Bridge_Apotex/index.php
```

### 10.2 Deploying a Dashboard Update

```bash
# On your local machine
cd D:\tmp\apotex_dash

# Make changes, test locally
npm run dev

# Build and verify
npm run build   # must show "✓ built in X.XXs" with zero errors

# Commit and push
git add -A
git commit -m "feat: description of change"
git push origin master
# Vercel auto-deploys on push to master
```

### 10.3 Restarting Services

```bash
# Restart bridge (after file update)
docker restart apotex_bridge_container

# Restart simulator API
docker restart api_members_apotex_service

# Reload nginx (after config change)
docker exec salinas_reverse_proxy nginx -s reload

# Restart Portainer (if timed out)
docker restart portainer
```

### 10.4 Checking Logs

```bash
# Bridge logs
docker logs apotex_bridge_container --tail 50

# Simulator API logs
docker logs api_members_apotex_service --tail 50

# Nginx access logs
docker logs salinas_reverse_proxy --tail 100 | grep apotex
```

---

## 11. Security Policy

### 11.1 What Is Protected

| Asset | Protection |
|---|---|
| SSH key | File permissions restricted to current user only (icacls) |
| Database credentials | Not stored in source code — only in bridge PHP on server |
| Server IPs | Not in frontend code — proxied through nginx |
| `.env` files | Excluded from git via `.gitignore` |
| Admin accounts | mb_id 1–4 filtered from all user-facing KPIs |

### 11.2 What Is NOT in the Git Repository

- `.env` files
- SSH private keys
- Database passwords
- Server IP addresses (except via vercel.json which uses the public domain)
- `setup.ini`

### 11.3 Credentials Reference

> Store these in a secure password manager. Do not share in plain text.

| Service | Username | Password / Key |
|---|---|---|
| Server SSH | root | `D:\Apotex_dashboard\shared_root_key` (key file) |
| Webmin | root | `Apotex@2024!` |
| Platform DB | apotexDashboard | `Ecosphere-Durably-Pettiness-Quartet` |
| Simulator DB | rpsim | `skeleton-scribe-selective` |
| Vercel | — | Vercel account login |
| GitHub | RahulAIML | GitHub account login |

---

## 12. Troubleshooting

### 12.1 Dashboard Shows Wrong Numbers

| Symptom | Cause | Fix |
|---|---|---|
| Average Score > 100% | Old formula: `Puntos_Totales / applicable_interactions × 100` | Fixed in v1.0 — use `avg(Calificacion where > 0)` |
| Pass Rate = 0% | `Diagnostico_Final === 'Si'` (never true for Apotex) | Fixed in v1.0 — use `Calificacion >= 70` |
| Test users in data | filterTestUsers() not applied | Check `src/lib/analytics.ts` — `filterTestUsers()` must be called before `computeKPIs()` |

### 12.2 API Returns No Data

```bash
# Test simulator endpoint
curl "https://serv.aux-rolplay.com/apotex/api/dim_actividades?id=71&id=111&id=128&id=174&id=175&id=176"

# Test bridge
curl "https://serv.aux-rolplay.com/apotex/bridge/?action=kpi.overview"

# Check containers are running
ssh -i "D:\Apotex_dashboard\shared_root_key" root@147.182.139.153 "docker ps | grep apotex"
```

### 12.3 Bridge Returns HTML Instead of JSON

PHP error — check logs:
```bash
docker logs apotex_bridge_container --tail 30
```

### 12.4 Vercel Deploy Fails

```bash
# Check build locally first
cd D:\tmp\apotex_dash
npm run build
# Fix any TypeScript errors shown, then push again
```

### 12.5 SSH Key Permission Error (Windows)

```
@@@@@@@@@@@@@@@@@@@@@@@@@
@ WARNING: UNPROTECTED PRIVATE KEY FILE! @
```

Fix:
```powershell
icacls "D:\Apotex_dashboard\shared_root_key" /inheritance:r /remove "*S-1-5-32"
icacls "D:\Apotex_dashboard\shared_root_key" /grant "$($env:USERDOMAIN)\$($env:USERNAME):R"
```

### 12.6 Portainer Shows "Timed Out"

```bash
ssh -i "D:\Apotex_dashboard\shared_root_key" root@147.182.139.153 "docker restart portainer"
# Then immediately open https://serv.aux-rolplay.com/portainer/ and set password
```

### 12.7 Adminer Connection Refused

Adminer uses direct port 8899 — if blocked:
```bash
ssh -i "D:\Apotex_dashboard\shared_root_key" root@147.182.139.153 "firewall-cmd --add-port=8899/tcp --permanent && firewall-cmd --reload"
```

---

## Appendix A — Quick Reference

### Apotex Use Case IDs
`71, 111, 128, 174, 175, 176` (coaching) + `470, 471, 475, 476, 485` (Visita Médica — bridge only)

### Correct Score Formula
```typescript
const avgScore = (sims) => {
  const scored = sims.filter(s => s.Calificacion > 0)
  return scored.length
    ? Math.round(scored.reduce((sum, s) => sum + s.Calificacion, 0) / scored.length)
    : 0
}
```

### Correct Pass Logic
```typescript
const isPass = (s) => s.Calificacion != null && s.Calificacion >= 70
```

### Docker Network
All Apotex containers are on: `https_infra_salinas_app-network`

---

*Document maintained by Rolplay Engineering. Last updated: June 2026.*
