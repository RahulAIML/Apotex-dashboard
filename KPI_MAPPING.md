# KPI Mapping: Gentera → Apotex

## Category A — Supported Without Modification

| KPI | Formula | Source | Status |
|-----|---------|--------|--------|
| Total Simulations | `sims.length` | `rol_play_sim_extractor` | ✅ Direct |
| Average Score | `sum(Puntos_Totales) / total_interactions * 100` | `rol_play_sim_extractor` | ✅ Direct |
| Pass Rate | `count(Diagnostico_Final==='Si') / total * 100` | `rol_play_sim_extractor` | ✅ Direct |
| Active Advisors | `new Set(Usuario_Nombre).size` | `rol_play_sim_extractor` | ✅ Direct |
| Total Activities | `activities.length` | `dim_actividades` | ✅ Direct |
| Total Members | `members.data.count` | `members` | ✅ Direct |
| Total Admins | `admins.data.count` | `administrators` | ✅ Direct |
| Score Trend | Group by date → avg(Calificacion) | `rol_play_sim_extractor` | ✅ Direct |
| Score Distribution | Bucket Calificacion 0-20,21-40,41-60,61-80,81-100 | `rol_play_sim_extractor` | ✅ Direct |
| Activity Stats | Group by ID_Caso_de_Uso → count, avg, pass | `rol_play_sim_extractor` | ✅ Direct |
| User Leaderboard | Group by Usuario_Nombre → avg score | `rol_play_sim_extractor` | ✅ Direct |
| Round/Interaction Performance | avg(Puntos_1..6) per position | `rol_play_sim_extractor` | ✅ Direct |

## Category B — Supported With Adaptations

| Gentera KPI | Apotex Adaptation | Source | Notes |
|------------|-------------------|--------|-------|
| Active Branches (Administrador_Nombre) | Branch from `mb_branch` in members | Bridge `list.members` | Different field name |
| Supervisor Stats | Team performance via leaderboard + assignments | Bridge `kpi.leaderboard` + `list.assignments` | No supervisor hierarchy — uses member data |
| Branch Stats | Score by branch from leaderboard | Bridge `kpi.leaderboard` | branch = mb_branch |
| Total Sessions (Roleplay) | Total Sessions (Bridge) | Bridge `kpi.overview` | Different source — simulador_ventas_callback |
| Avg Total Score (Roleplay) | Avg Score (Bridge) | Bridge `kpi.overview` | simv_callback_score |
| Avg Recording Attempts | Assigned/Completed ratio | Bridge `kpi.completion_rate` | No recording data |

## Category C — Not Supported (Removed)

| KPI | Reason |
|----|--------|
| Avg Robin % (AI facial analysis) | `Porcentaje_Robin` only exists in Gentera Roleplay DB — `video_answers` empty in Apotex |
| Avg Facial Expression % | Same — requires Robin AI scoring system not active for Apotex |
| Avg Voice % | Same |
| Avg Words per Minute % | Same |
| Score Dimension Radar (Robin/Facial/Voice/WPM) | All 4 dimensions require Robin AI — not available |
| Criteria Fulfillment (MC_1..MC_20) | Requires Dim_Actividades_Rub.php — Apotex uses different activity schema |
| Avg Video Duration | No video recording data in Apotex |
| Avg Recording Attempts (Grabaciones_Totales) | No recording tracking data |
| Total MC Points | Requires MC criterion data |
| Active Branches (by Administrador_Nombre) | No equivalent field in Apotex sim data |

## Category D — New Apotex-Specific KPIs

| KPI | Formula | Source | Page |
|----|---------|--------|------|
| Assignment Completion Rate | completed/assigned per activity | Bridge `kpi.completion_rate` | Bridge Analytics |
| Login Activity Trend | logins per month | Bridge `kpi.login_activity` | Bridge Analytics |
| Activity Type Breakdown | sessions by type (Coach Eval/Maestro/Visita) | Bridge `kpi.activity_summary` | Bridge Analytics |
| Pending Assignments | count(status='pending') | Bridge `list.assignments` | Teams |
| Pass Rate by Activity Type | Group completion by simv_type | Bridge `kpi.activity_summary` | Bridge Analytics |
| User Assignment Status | per-user assigned vs completed | Bridge `list.assignments` JOIN `list.members` | Teams |
| Total Logins | count(login_logs) | Bridge `kpi.overview` | Bridge Analytics |
| Monthly Engagement | logins + unique users per month | Bridge `kpi.login_activity` | Bridge Analytics |
