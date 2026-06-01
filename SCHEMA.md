# Database Schema — rolplay_apotex_robin

| Key | Value |
|-----|-------|
| Host | 138.68.248.149 |
| Database | rolplay_apotex_robin |
| User | apotexDashboard |
| Bridge | https://serv.aux-rolplay.com/apotex/bridge/ |

---

## login_logs
**Estimated rows:** 1234

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| log_id | int(11) | PRI | ? |
| log_user | int(11) |  | ? |
| log_type_user | enum('user','admin','supervisor','gerente') |  | ? |
| log_datetime | timestamp |  | ? |
| log_user_agent | varchar(100) |  | ? |

## simulador_ventas_callback
**Estimated rows:** 789

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| simv_callback_id | int(10) unsigned | PRI | ? |
| simv_callback_user | int(10) unsigned | MUL | ? |
| simv_callback_rolplay | int(10) unsigned |  | ? |
| simv_callback_saex | int(11) unsigned |  | ? |
| simv_callback_score | float |  | ? |
| simv_callback_feedback | text |  | ? |
| simv_callback_feedback_datetime | datetime |  | ? |
| simv_callback_datetime | datetime |  | ? |

## assign_simuladors_users
**Estimated rows:** 253

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| asim_id | int(10) unsigned | PRI | ? |
| asim_user | int(10) unsigned | MUL | ? |
| asim_simulator | int(10) unsigned |  | ? |
| asim_datetime | datetime |  | ? |

## members
**Estimated rows:** 61

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| mb_id | int(250) | PRI | ? |
| mb_idDepartament | int(11) | MUL | ? |
| mb_idTag1 | int(11) | MUL | ? |
| mb_idTag2 | int(11) | MUL | ? |
| mb_idTag3 | int(11) | MUL | ? |
| mb_admin | int(250) | MUL | ? |
| mb_fullname | varchar(100) |  | ? |
| mb_user | varchar(100) | MUL | ? |
| mb_pass | varchar(50) |  | ? |
| mb_email | varchar(50) |  | ? |
| mb_reference | varchar(50) |  | ? |
| mb_user_token | varchar(100) |  | ? |
| mb_route | varchar(50) |  | ? |
| mb_date_create | datetime |  | ? |
| mb_last_login | datetime |  | ? |
| mb_status | tinyint(1) |  | ? |
| mb_user_agent | varchar(100) |  | ? |
| mb_country | varchar(50) |  | ? |
| mb_state | varchar(50) |  | ? |
| mb_city | varchar(50) |  | ? |
| mb_branch | varchar(50) |  | ? |
| mb_line | varchar(50) |  | ? |
| mb_designation | varchar(50) |  | ? |
| mb_employee_code | varchar(50) |  | ? |
| memberscol | varchar(45) |  | ? |

## control_supervisor_admin
**Estimated rows:** 25

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| csa_id | int(250) | PRI | ? |
| csa_supervisor | int(250) | MUL | ? |
| csa_admin | int(250) | MUL | ? |
| csa_datetime | datetime |  | ? |
| csa_status | tinyint(1) |  | ? |
| csa_datetime_update | datetime |  | ? |

## administrators
**Estimated rows:** 21

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| rpa_id | int(250) | PRI | ? |
| rpa_full_name | varchar(100) |  | ? |
| rpa_email | varchar(50) |  | ? |
| rpa_user | varchar(50) |  | ? |
| rpa_password | varchar(50) |  | ? |
| rpa_profile_type | enum('dev','tenant','supervisor','admin','enradmin') |  | ? |
| rp_assoc_tenant | int(250) |  | ? |
| rpa_company | varchar(250) |  | ? |
| rpa_sede | varchar(50) |  | ? |
| rpa_enabled_stt | tinyint(1) |  | ? |
| rpa_enabled_ae | tinyint(1) |  | ? |
| rpa_mod_admin | tinyint(1) |  | ? |
| rpa_mod_admin_global | tinyint(1) |  | ? |
| rpa_mod_creator | tinyint(1) |  | ? |
| rpa_mod_doedit | tinyint(1) |  | ? |
| rpa_parent | int(250) |  | ? |
| rpa_is_demo | tinyint(1) |  | ? |
| rpa_create_date | datetime |  | ? |
| rpa_expiration_demo | date |  | ? |

## simulador_ventas
**Estimated rows:** 12

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| simv_id | int(10) unsigned | PRI | ? |
| simv_title | varchar(150) |  | ? |
| simv_desc | varchar(250) |  | ? |
| simv_main_activity | varchar(50) |  | ? |
| simv_absorb | varchar(250) |  | ? |
| simv_tag1 | int(10) unsigned | MUL | ? |
| simv_type | enum('Coach evaluador','Coach maestro','Visita Médica APECS') |  | ? |
| simv_url | varchar(150) |  | ? |
| simv_report_url | varchar(250) |  | ? |
| simv_case | int(10) unsigned | MUL | ? |
| simv_score | int(10) unsigned |  | ? |
| simv_status | tinyint(1) |  | ? |
| simv_datetime | datetime |  | ? |

## control_tenant_supervisor
**Estimated rows:** 8

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| ctp_id | int(250) | PRI | ? |
| ctp_tenant | int(250) | MUL | ? |
| ctp_supervisor | int(250) |  | ? |
| ctp_datetime | datetime |  | ? |

## tag1
**Estimated rows:** 6

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(11) | PRI | ? |
| name | varchar(45) |  | ? |
| description | varchar(45) |  | ? |
| idStatus | tinyint(4) |  | ? |

## tag2
**Estimated rows:** 2

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(11) | PRI | ? |
| idTag1 | int(11) |  | ? |
| idStatus | tinyint(4) |  | ? |
| name | varchar(45) |  | ? |
| description | varchar(45) |  | ? |

## creator_teams
**Estimated rows:** 2

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cteam_id | int(10) unsigned | PRI | ? |
| cteam_creator | int(10) unsigned |  | ? |
| cteam_leader | int(10) unsigned |  | ? |
| cteam_datetime | datetime |  | ? |

## poll_robin
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| pls_id | int(250) | PRI | ? |
| pls_url | varchar(250) |  | ? |
| pls_poll | varchar(250) |  | ? |
| rob_status | tinyint(1) |  | ? |

## creator_duplicates
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cdup_id | int(250) | PRI | ? |
| cdup_creator | int(250) |  | ? |
| cdup_leader | int(250) |  | ? |
| cdup_activity | varchar(250) |  | ? |
| cdup_status | int(11) |  | ? |
| cdup_datetime | datetime |  | ? |

## twa_registers
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| twa_id | int(11) | PRI | ? |
| twa_register | varchar(250) | MUL | ? |
| twa_source | varchar(250) |  | ? |
| twa_source_media | varchar(250) |  | ? |
| twa_source_poster | varchar(250) |  | ? |
| twa_source_time | varchar(10) |  | ? |
| twa_source_timexec | varchar(10) |  | ? |
| rp_usr_id | int(11) | MUL | ? |
| rp_anw_id | int(11) | MUL | ? |
| twa_json | longtext |  | ? |
| twa_json_performance | longtext |  | ? |
| twa_TotalJoy | decimal(10,2) |  | ? |
| twa_TotalDisgust | decimal(10,2) |  | ? |
| twa_TotalAnger | decimal(10,2) |  | ? |
| twa_TotalSadness | decimal(10,2) |  | ? |
| twa_TotalSurprise | decimal(10,2) |  | ? |
| twa_TotalFear | decimal(10,2) |  | ? |
| twa_positive_percent | decimal(10,2) |  | ? |
| twa_neutral_percent | decimal(10,2) |  | ? |
| twa_negative_percent | decimal(10,2) |  | ? |
| twa_createDate | datetime |  | ? |
| twa_analysisDate | datetime |  | ? |
| twa_status_percent | tinyint(1) |  | ? |
| twa_status_kairos | varchar(250) |  | ? |
| twa_status_code_kairos | int(5) |  | ? |
| twa_num_requests_kairos | int(5) |  | ? |
| twa_nm_json | longtext |  | ? |
| twa_nm_performance | mediumtext |  | ? |
| twa_nm_voice_energy | decimal(10,2) |  | ? |
| twa_nm_status | varchar(150) |  | ? |
| twa_status | varchar(250) |  | ? |
| twa_hands_performance | longtext |  | ? |

## comments_admin_anw
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmtadmin_id | int(250) | PRI | ? |
| cmtadmin_admin | int(250) |  | ? |
| cmtadmin_comment | text |  | ? |
| cmtadmin_question | varchar(250) |  | ? |
| cmtadmin_timeline | varchar(250) |  | ? |
| cmtadmin_comment_time | time |  | ? |
| cmtadmin_datetime | datetime |  | ? |

## tag3
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(11) | PRI | ? |
| idTag2 | int(11) |  | ? |
| idStatus | tinyint(4) |  | ? |
| name | varchar(45) |  | ? |
| description | varchar(45) |  | ? |

## palabrasFiltro
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| pex_id | int(150) | PRI | ? |
| pex_palabra | varchar(150) |  | ? |

## comments_admin
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmt_id | int(250) | PRI | ? |
| cmt_admin | int(250) | MUL | ? |
| cmt_user | int(250) | MUL | ? |
| cmt_question | varchar(250) | MUL | ? |
| cmt_comment | text |  | ? |
| cmt_create_dete | datetime |  | ? |

## creator_control_docs
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| edocs_id | int(250) | PRI | ? |
| edocs_activity | varchar(250) | MUL | ? |
| edocs_exercise | varchar(250) |  | ? |
| edocs_admin | int(250) |  | ? |
| edocs_doc_name | varchar(250) |  | ? |
| edocs_doc_type | varchar(50) |  | ? |
| edocs_doc_size | float |  | ? |
| edocs_datetime | datetime |  | ? |

## baseline_tags
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bsltag_id | int(10) unsigned | PRI | ? |
| bsltag_tag | varchar(50) |  | ? |
| bsltag_status | tinyint(1) |  | ? |

## creator_baseline_activty
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bsl_id | int(10) unsigned | PRI | ? |
| bsl_base | varchar(60) | MUL | ? |
| bsl_compare | int(10) unsigned | MUL | ? |
| bsl_admin | int(10) unsigned | MUL | ? |
| bsl_datetime | datetime |  | ? |
| bsl_status | tinyint(1) |  | ? |

## baseline_schedule
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bslsch_id | int(10) unsigned | PRI | ? |
| bslsch_base | varchar(60) | MUL | ? |
| bslsch_recurrence | enum('week','mid','month') | MUL | ? |
| bslsch_start_recurrence | datetime |  | ? |
| bslsch_end_recurrence | datetime |  | ? |
| bslsch_status | tinyint(1) |  | ? |

## creator_assign_act_users
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| acu_id | int(250) | PRI | ? |
| acu_user | int(250) |  | ? |
| acu_admin | int(250) |  | ? |
| acu_activity | varchar(250) |  | ? |
| acu_status | int(1) |  | ? |
| acu_activated_status | tinyint(1) |  | ? |
| acu_datetime | datetime |  | ? |

## vsr_analysis
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| twa_id | int(11) | PRI | ? |
| twa_register | varchar(250) | MUL | ? |
| twa_source | varchar(250) |  | ? |
| twa_source_media | varchar(250) | MUL | ? |
| twa_source_poster | varchar(250) |  | ? |
| twa_source_time | varchar(10) |  | ? |
| twa_source_timexec | varchar(10) |  | ? |
| rp_usr_id | int(11) | MUL | ? |
| twa_json | longtext |  | ? |
| twa_json_performance | longtext |  | ? |
| twa_TotalJoy | decimal(10,2) |  | ? |
| twa_TotalDisgust | decimal(10,2) |  | ? |
| twa_TotalAnger | decimal(10,2) |  | ? |
| twa_TotalSadness | decimal(10,2) |  | ? |
| twa_TotalSurprise | decimal(10,2) |  | ? |
| twa_TotalFear | decimal(10,2) |  | ? |
| twa_positive_percent | decimal(10,2) |  | ? |
| twa_neutral_percent | decimal(10,2) |  | ? |
| twa_negative_percent | decimal(10,2) |  | ? |
| twa_createDate | datetime |  | ? |
| twa_analysisDate | datetime |  | ? |
| twa_status_percent | tinyint(1) |  | ? |
| twa_status_kairos | varchar(250) |  | ? |
| twa_status_code_kairos | int(5) |  | ? |
| twa_num_requests_kairos | int(5) |  | ? |
| twa_nm_json | longtext |  | ? |
| twa_nm_ContentAvrg | decimal(10,2) |  | ? |
| twa_nm_AngryAvrg | decimal(10,2) |  | ? |
| twa_nm_UpsetAvrg | decimal(10,2) |  | ? |
| twa_nm_StressAvrg | decimal(10,2) |  | ? |
| twa_nm_HesitationAvrg | decimal(10,2) |  | ? |
| twa_nm_UncertaintyAvrg | decimal(10,2) |  | ? |
| twa_nm_ExcitementAvrg | decimal(10,2) |  | ? |
| twa_nm_EmbarrassmentAvrg | decimal(10,2) |  | ? |
| twa_nm_IntensivelyThinkingAvrg | decimal(10,2) |  | ? |
| twa_nm_ImaginationActivityAvrg | decimal(10,2) |  | ? |
| twa_nm_ConcentrationAvrg | decimal(10,2) |  | ? |
| twa_nm_AtmosphereAvrg | decimal(10,2) |  | ? |
| twa_nm_EnergyAvrg | decimal(10,2) |  | ? |
| twa_nm_EmoCogAvrg | decimal(10,2) |  | ? |
| twa_nm_AnticipationAvrg | decimal(10,2) |  | ? |
| twa_nm_BrainPowerAvrg | decimal(10,2) |  | ? |
| twa_nm_ExtremeEmotionAvrg | decimal(10,2) |  | ? |
| twa_nm_SAFAvrg | decimal(10,2) |  | ? |
| twa_nm_DissatisfactionAvrg | decimal(10,2) |  | ? |
| twa_nm_Summary | varchar(250) |  | ? |
| twa_nm_status | varchar(250) |  | ? |
| twa_tf_json | varchar(250) |  | ? |
| twa_tf_media | varchar(250) |  | ? |
| twa_tf_status | tinyint(1) |  | ? |
| twa_tf_analysis_date | datetime |  | ? |
| twa_status | varchar(250) |  | ? |

## creator_activity
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| pl_id | int(10) unsigned | PRI | ? |
| pl_admin | int(10) unsigned | MUL | ? |
| pl_source | varchar(250) | MUL | ? |
| pl_is_personalised | tinyint(1) |  | ? |
| pl_create_date | datetime |  | ? |
| pl_title | varchar(250) |  | ? |
| pl_desc | text |  | ? |
| pl_intro_video | text |  | ? |
| pl_tag | varchar(50) |  | ? |
| pl_sequence | text |  | ? |
| pl_feedback | tinyint(1) |  | ? |
| pl_rubric | text |  | ? |
| pl_recording_time | int(10) unsigned |  | ? |
| pl_limit_attempts | int(10) unsigned |  | ? |
| pl_limit_days | int(10) unsigned |  | ? |
| pl_published | tinyint(1) |  | ? |
| pl_published_datetime | datetime |  | ? |
| pl_baseline | enum('noBase','base','baseDuplicate') |  | ? |
| pl_baseline_tag | int(10) unsigned |  | ? |
| pl_robin_ws | varchar(150) |  | ? |
| pl_robin_items | text |  | ? |
| pl_robin_setup | text |  | ? |
| pl_score_balance | text |  | ? |
| pl_virtual_sale | text |  | ? |
| pl_deleted | tinyint(1) |  | ? |
| pl_deleted_date | datetime |  | ? |

## status
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | tinyint(4) | PRI | ? |
| nombre | varchar(60) |  | ? |

## lms
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| lms_id | int(250) | PRI | ? |
| lms_source | varchar(250) |  | ? |
| lms_title | text |  | ? |
| lms_body | text |  | ? |
| lms_image | text |  | ? |
| lms_image_type | varchar(250) |  | ? |
| lms_image_size | int(250) |  | ? |
| lms_creator | int(250) |  | ? |
| lms_status | tinyint(1) |  | ? |
| lms_datetime | timestamp |  | ? |

## baseline_question
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bslq_id | int(10) unsigned | PRI | ? |
| bslq_form | int(10) unsigned |  | ? |
| bslq_question | varchar(200) | MUL | ? |
| bslq_main_number | int(10) unsigned |  | ? |
| bslq_number | varchar(200) |  | ? |
| bslq_status | tinyint(4) |  | ? |
| bslq_datetime | timestamp |  | ? |

## special_phrases
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| sph_id | int(10) unsigned | PRI | ? |
| sph_default | varchar(150) |  | ? |
| sph_options | text |  | ? |

## lessons
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(11) | PRI | ? |
| lesson | varchar(15) |  | ? |
| poll | varchar(50) |  | ? |
| usr_id | int(11) |  | ? |
| admin_id | int(11) |  | ? |
| start | int(10) unsigned |  | ? |
| end | int(10) unsigned |  | ? |
| quizProm | float |  | ? |

## baseline_evaluation_activity
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bslea_id | int(10) unsigned | PRI | ? |
| bslea_form | int(10) unsigned |  | ? |
| bslea_poll | varchar(60) | MUL | ? |
| bslea_question | varchar(60) | MUL | ? |
| bslea_user | int(10) unsigned | MUL | ? |
| bslea_status | tinyint(4) |  | ? |
| bslea_datetime | timestamp |  | ? |

## sp_usr
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| spusr_id | int(250) | PRI | ? |
| spusr_user | varchar(250) |  | ? |
| spusr_pass | varchar(250) |  | ? |

## informe
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(250) | PRI | ? |
| info | longtext |  | ? |
| titulo | text |  | ? |

## baseline_evaluation
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bsle_id | int(10) unsigned | PRI | ? |
| blse_baseline_evaluation_activity | int(10) unsigned | MUL | ? |
| blse_admin | int(10) unsigned | MUL | ? |
| blse_user_activity | int(10) unsigned | MUL | ? |
| bsle_user | int(10) unsigned | MUL | ? |
| bsle_is_admin | int(10) unsigned |  | ? |
| bsle_question | varchar(20) |  | ? |
| bsle_orden | int(10) unsigned |  | ? |
| bsle_status | tinyint(4) |  | ? |
| bsle_answer | text |  | ? |
| bsle_datetime | timestamp |  | ? |

## video_self_recording
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| vsr_id | int(250) | PRI | ? |
| vsr_user | int(250) | MUL | ? |
| vsr_datetime | datetime |  | ? |
| vsr_video | varchar(150) |  | ? |
| vsr_video_duration | varchar(10) |  | ? |
| vsr_filter | text |  | ? |
| vsr_filter_sequence | tinyint(1) |  | ? |
| vsr_filter_notmention | text |  | ? |
| vsr_analysis | varchar(250) |  | ? |
| vsr_analysis_status | int(11) |  | ? |
| vsr_voice_http | varchar(250) |  | ? |
| vsr_stt_http | varchar(250) |  | ? |
| vsr_stt_json_init | varchar(250) |  | ? |
| vsr_stt_transcription | text |  | ? |
| vsr_stt_transcription_json | text |  | ? |
| vsr_stt_json | longtext |  | ? |
| vsr_stt_status | varchar(250) |  | ? |
| vsr_stt_xdroid_version | int(10) unsigned |  | ? |
| vsr_rst_json | mediumtext |  | ? |
| vsr_rst_analysis | varchar(5) |  | ? |
| vsr_rst_confidence | decimal(10,2) |  | ? |
| vsr_rst_status | enum('0','1','2') |  | ? |
| vsr_rst_date | datetime |  | ? |

## simulador_ventas_resultados
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| simv_res_id | int(10) unsigned | PRI | ? |
| simv_res_user | int(10) unsigned | MUL | ? |
| simv_res_rp | int(10) unsigned |  | ? |
| simv_res_sim_case | varchar(50) |  | ? |
| simv_res_sim_datetime | datetime |  | ? |
| simv_res_attempts | int(11) |  | ? |

## dictionary
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| dict_id | int(10) unsigned | PRI | ? |
| dict_word | varchar(250) |  | ? |
| dict_replace | varchar(250) |  | ? |
| dict_datetime | datetime |  | ? |

## baseline_activty
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| bsl_id | int(10) unsigned | PRI | ? |
| bsl_base | varchar(60) | MUL | ? |
| bsl_compare | varchar(60) | MUL | ? |
| bsl_admin | int(10) unsigned | MUL | ? |
| bsl_datetime | datetime |  | ? |
| bsl_status | tinyint(1) |  | ? |

## video_questions
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| vq_id | int(10) unsigned | PRI | ? |
| vq_source | varchar(250) | MUL | ? |
| vq_poll | varchar(250) | MUL | ? |
| vq_title | text |  | ? |
| vq_video | varchar(150) |  | ? |
| vq_filter | text |  | ? |
| vq_filter_sequence | tinyint(1) |  | ? |
| vq_filter_notmention | text |  | ? |
| vq_filter_phrases | text |  | ? |
| vq_filter_phrases_notmention | text |  | ? |
| vq_filter_mulmention | text |  | ? |
| vq_rubric | text |  | ? |
| vq_veredict | text |  | ? |
| vq_score_required | int(10) unsigned |  | ? |
| vq_trans_lang | enum('es','en','pt') |  | ? |
| vq_create_date | datetime |  | ? |

## control_docs
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| edocs_id | int(250) | PRI | ? |
| edocs_activity | varchar(250) | MUL | ? |
| edocs_exercise | varchar(250) | MUL | ? |
| edocs_admin | int(250) | MUL | ? |
| edocs_doc_name | varchar(250) |  | ? |
| edocs_doc_type | varchar(50) |  | ? |
| edocs_doc_size | float |  | ? |
| edocs_datetime | datetime |  | ? |

## departaments
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(11) | PRI | ? |
| idTag3 | int(11) |  | ? |
| name | varchar(60) |  | ? |
| description | varchar(45) |  | ? |
| idStatus | tinyint(4) |  | ? |

## video_answers_historic
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| vah_id | int(250) | PRI | ? |
| vah_poll | varchar(250) | MUL | ? |
| vah_question | varchar(250) | MUL | ? |
| vah_user | int(250) | MUL | ? |
| vah_user_token | varchar(100) |  | ? |
| vah_video | varchar(250) |  | ? |
| vah_video_duration | varchar(100) |  | ? |
| vah_create_date | datetime |  | ? |
| vah_recording_attempts | int(11) |  | ? |
| vah_analysis | text |  | ? |
| vah_analysis_status | enum('0','1','2','3') |  | ? |
| vah_stt_transcription | longtext |  | ? |
| vah_stt_transcription_json | longtext |  | ? |
| vah_stt_total_words | int(50) |  | ? |
| vah_stt_ppm | int(50) |  | ? |
| vah_filter_mention | int(50) |  | ? |
| vah_filter_notmention | int(50) |  | ? |
| vah_filter_phrases | int(50) |  | ? |
| vah_filter_notphrases | int(50) |  | ? |
| vah_filter_mention_usr | int(50) |  | ? |
| vah_filter_notmention_usr | int(50) |  | ? |
| vah_filter_phrases_usr | int(50) |  | ? |
| vah_filter_notphrases_usr | int(50) |  | ? |
| vah_filter_mention_percent | float |  | ? |
| vah_filter_notmention_percent | float |  | ? |
| vah_filter_phrases_percent | float |  | ? |
| vah_filter_notphrases_percent | float |  | ? |
| vah_exercise_sequence | tinyint(1) |  | ? |
| vah_usr_sequence | tinyint(1) |  | ? |
| vah_voice_http | varchar(250) |  | ? |
| vah_stt_http | varchar(250) |  | ? |
| vah_stt_json_init | varchar(250) |  | ? |
| vah_stt_json | longtext |  | ? |
| vah_stt_status | varchar(150) |  | ? |
| vah_stt_xdroid_version | int(11) |  | ? |
| vah_stt_date | datetime |  | ? |
| vah_rst_json | mediumtext |  | ? |
| vah_rst_analysis | varchar(5) |  | ? |
| vah_rst_confidence | decimal(10,2) |  | ? |
| vah_rst_status | enum('0','1','2') |  | ? |
| vah_rst_date | datetime |  | ? |
| vah_score | decimal(10,2) |  | ? |
| vah_score_attempts | int(10) |  | ? |
| vah_mandatory_speech | decimal(10,2) |  | ? |
| vah_mandatory_speech_percent | decimal(10,2) |  | ? |
| vah_forbidden_speech_score | decimal(10,2) |  | ? |
| vah_forbidden_speech_percent | decimal(10,2) |  | ? |
| vah_voice_energy_score | decimal(10,2) |  | ? |
| vah_voice_energy_percent | decimal(10,2) |  | ? |
| vah_speech_rate_score | decimal(10,2) |  | ? |
| vah_speech_rate_percent | decimal(10,2) |  | ? |
| vah_facial_emotion_score | decimal(10,2) |  | ? |
| vah_facial_emotion_percent | decimal(10,2) |  | ? |
| vah_mention_reportscore | int(11) |  | ? |
| vah_phrases_reportscore | int(11) |  | ? |
| vah_notmention_reportscore | int(11) |  | ? |
| vah_notphrases_reportscore | int(11) |  | ? |
| vah_speech_reportscore | int(11) |  | ? |
| vah_voice_energy_reportscore | int(11) |  | ? |
| vah_facial_reportscore | int(11) |  | ? |
| vah_user_browser_agent | varchar(250) |  | ? |
| vah_user_ip | varchar(50) |  | ? |
| vah_confirmed | tinyint(1) |  | ? |
| vah_status | tinyint(4) |  | ? |

## conn_admin_part
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cnap_id | int(250) | PRI | ? |
| cnap_admin | int(250) |  | ? |
| cnap_part | int(250) |  | ? |
| cnap_status | tinyint(1) |  | ? |
| cnap_datetime | datetime |  | ? |

## deepgram_diccionary
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| dmd_id | int(10) unsigned | PRI | ? |
| dmd_description | varchar(100) |  | ? |
| dmd_replace | mediumtext |  | ? |
| dmd_keywords | mediumtext |  | ? |

## assign_act_users
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| acu_id | int(10) unsigned | PRI | ? |
| acu_user | int(10) unsigned | MUL | ? |
| acu_admin | int(10) unsigned |  | ? |
| acu_activity | varchar(250) |  | ? |
| acu_status | int(1) |  | ? |
| acu_activated_status | tinyint(1) |  | ? |
| acu_datetime | datetime |  | ? |

## video_answers_admin
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| vad_id | int(11) | PRI | ? |
| vad_poll | varchar(250) | MUL | ? |
| vad_question | varchar(250) | MUL | ? |
| vad_admin | varchar(250) | MUL | ? |
| vad_video | varchar(250) |  | ? |
| vad_video_duration | varchar(50) |  | ? |
| vad_create_date | datetime |  | ? |

## comments_supervisor
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmt_id | int(11) | PRI | ? |
| cmt_supervisor | int(11) |  | ? |
| cmt_user | int(11) |  | ? |
| cmt_question | varchar(250) |  | ? |
| cmt_comment | text |  | ? |
| cmt_create_dete | datetime |  | ? |

## services_api
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| sap_id | int(250) | PRI | ? |
| sap_service | varchar(50) |  | ? |
| sap_section | varchar(50) |  | ? |
| sap_exercise | varchar(50) |  | ? |
| sap_user | int(250) |  | ? |
| sap_datetime | datetime |  | ? |

## deepgram_activities
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| dmac_id | int(10) unsigned | PRI | ? |
| dmac_dictionary | int(10) unsigned | MUL | ? |
| dmac_activity | varchar(100) | MUL | ? |

## answers_csrpt_opt
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| csrpt_id | int(100) | PRI | ? |
| csrpt_option | varchar(50) |  | ? |

## video_answers
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| va_id | int(250) | PRI | ? |
| va_poll | varchar(250) | MUL | ? |
| va_question | varchar(250) | MUL | ? |
| va_user | int(250) | MUL | ? |
| va_user_token | varchar(100) |  | ? |
| va_video | varchar(250) |  | ? |
| va_video_duration | varchar(100) |  | ? |
| va_create_date | datetime |  | ? |
| va_recording_attempts | int(11) |  | ? |
| va_analysis | text |  | ? |
| va_analysis_status | enum('0','1','2','3') |  | ? |
| va_stt_transcription | longtext |  | ? |
| va_stt_transcription_json | longtext |  | ? |
| va_stt_total_words | int(50) |  | ? |
| va_stt_ppm | int(50) |  | ? |
| va_filter_mention | int(50) |  | ? |
| va_filter_notmention | int(50) |  | ? |
| va_filter_phrases | int(50) |  | ? |
| va_filter_notphrases | int(50) |  | ? |
| va_filter_mention_usr | int(50) |  | ? |
| va_filter_notmention_usr | int(50) |  | ? |
| va_filter_phrases_usr | int(50) |  | ? |
| va_filter_notphrases_usr | int(50) |  | ? |
| va_filter_mention_percent | float |  | ? |
| va_filter_notmention_percent | float |  | ? |
| va_filter_phrases_percent | float |  | ? |
| va_filter_notphrases_percent | float |  | ? |
| va_exercise_sequence | tinyint(1) |  | ? |
| va_usr_sequence | tinyint(1) |  | ? |
| va_voice_http | varchar(250) |  | ? |
| va_stt_http | varchar(250) |  | ? |
| va_stt_json_init | varchar(250) |  | ? |
| va_stt_json | longtext |  | ? |
| va_stt_status | varchar(150) |  | ? |
| va_stt_xdroid_version | int(11) |  | ? |
| va_stt_date | datetime |  | ? |
| va_rst_json | mediumtext |  | ? |
| va_rst_analysis | varchar(5) |  | ? |
| va_rst_confidence | decimal(10,2) |  | ? |
| va_rst_status | enum('0','1','2') |  | ? |
| va_rst_date | datetime |  | ? |
| va_score | decimal(10,2) |  | ? |
| va_score_attempts | int(10) |  | ? |
| va_mandatory_speech | decimal(10,2) |  | ? |
| va_mandatory_speech_percent | decimal(10,2) |  | ? |
| va_forbidden_speech_score | decimal(10,2) |  | ? |
| va_forbidden_speech_percent | decimal(10,2) |  | ? |
| va_voice_energy_score | decimal(10,2) |  | ? |
| va_voice_energy_percent | decimal(10,2) |  | ? |
| va_speech_rate_score | decimal(10,2) |  | ? |
| va_speech_rate_percent | decimal(10,2) |  | ? |
| va_facial_emotion_score | decimal(10,2) |  | ? |
| va_facial_emotion_percent | decimal(10,2) |  | ? |
| va_mention_reportscore | int(10) unsigned |  | ? |
| va_phrases_reportscore | int(10) unsigned |  | ? |
| va_notmention_reportscore | int(10) unsigned |  | ? |
| va_notphrases_reportscore | int(10) unsigned |  | ? |
| va_speech_reportscore | int(10) unsigned |  | ? |
| va_voice_energy_reportscore | int(10) unsigned |  | ? |
| va_facial_reportscore | int(10) unsigned |  | ? |
| va_facial_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_facial_process_startdate | datetime |  | ? |
| va_facial_process_enddate | datetime |  | ? |
| va_transcription_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_transcription_process_startdate | datetime |  | ? |
| va_transcription_process_enddate | datetime |  | ? |
| va_voice_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_voice_process_startdate | datetime |  | ? |
| va_voice_process_enddate | datetime |  | ? |
| va_transcoding_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_transcoding_process_startdate | datetime |  | ? |
| va_transcoding_process_enddate | datetime |  | ? |
| va_score_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_score_process_startdate | datetime |  | ? |
| va_score_process_enddate | datetime |  | ? |
| va_intervalLimit | int(10) unsigned |  | ? |
| va_user_browser_agent | varchar(250) |  | ? |
| va_user_ip | varchar(50) |  | ? |
| va_confirmed | tinyint(1) |  | ? |
| va_status | tinyint(4) |  | ? |
| msi_robin_score | varchar(50) |  | ? |
| msi_robin_score_must | int(10) unsigned |  | ? |
| msi_robin_score_nice | int(10) unsigned |  | ? |
| msi_robin_evaluation | text |  | ? |
| msi_robin_feedback | longtext |  | ? |
| msi_robin_response | longtext |  | ? |
| msi_robin_status | int(10) |  | ? |
| msi_robin_facial | int(10) unsigned |  | ? |
| msi_robin_facial_status | tinyint(1) |  | ? |
| msi_robin_voice | int(10) unsigned |  | ? |
| msi_robin_voice_status | tinyint(1) |  | ? |
| msi_robin_ppm | int(10) unsigned |  | ? |
| msi_robin_total | int(10) unsigned |  | ? |
| va_hands_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_hands_process_startdate | datetime |  | ? |
| va_hands_process_enddate | datetime |  | ? |

## comments_representante
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmt_id | int(11) | PRI | ? |
| cmt_user | int(11) |  | ? |
| cmt_admin | int(11) |  | ? |
| cmt_question | varchar(250) |  | ? |
| cmt_comment | text |  | ? |
| cmt_create_dete | datetime |  | ? |

## comments_feedback_activity
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmtu_id | int(250) | PRI | ? |
| cmtu_user | int(250) |  | ? |
| cmtu_is_admin | tinyint(1) |  | ? |
| cmtu_user_activity | int(250) |  | ? |
| cmtu_comment | text |  | ? |
| cmtu_question | varchar(250) |  | ? |
| cmtu_datetime | datetime |  | ? |

## quiz
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| id | int(11) | PRI | ? |
| usr_id | int(11) |  | ? |
| usr_name | varchar(255) |  | ? |
| lesson_id | varchar(10) |  | ? |
| admin_id | int(11) |  | ? |
| corrects | int(11) |  | ? |
| date | datetime |  | ? |

## answers_csrpt
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| csrpt_id | int(250) | PRI | ? |
| csrpt_user | int(250) | MUL | ? |
| csrpt_answer | varchar(250) | MUL | ? |
| csrpt_option | varchar(250) |  | ? |
| csrpt_user_agent | text |  | ? |
| csrpt_date | datetime |  | ? |

## users_introvid
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| uintrovid_id | int(10) unsigned | PRI | ? |
| uintrovid_type | enum('admin','user') |  | ? |
| uintrovid_user | int(10) unsigned |  | ? |
| uintrovid_datetime | datetime |  | ? |

## polls
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| pl_id | int(10) unsigned | PRI | ? |
| pl_admin | int(10) unsigned | MUL | ? |
| pl_source | varchar(250) | MUL | ? |
| pl_parent_creator | int(10) unsigned |  | ? |
| pl_parent_act | varchar(250) |  | ? |
| pl_is_personalised | tinyint(1) |  | ? |
| pl_url | varchar(150) |  | ? |
| pl_create_date | datetime |  | ? |
| pl_title | varchar(250) |  | ? |
| pl_desc | text |  | ? |
| pl_intro_video | text |  | ? |
| pl_tag | varchar(50) |  | ? |
| pl_sequence | text |  | ? |
| pl_feedback | tinyint(1) |  | ? |
| pl_rubric | text |  | ? |
| pl_recording_time | int(10) unsigned |  | ? |
| pl_limit_attempts | int(10) unsigned |  | ? |
| pl_limit_days | int(10) unsigned |  | ? |
| pl_published | tinyint(4) |  | ? |
| pl_baseline | enum('noBase','base','baseDuplicate') |  | ? |
| pl_baseline_tag | int(10) unsigned |  | ? |
| pl_baseline_form | tinyint(1) |  | ? |
| pl_deleted | tinyint(1) |  | ? |
| pl_deleted_date | datetime |  | ? |

## creator_exercises_model
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| vad_id | int(11) | PRI | ? |
| vad_poll | varchar(250) | MUL | ? |
| vad_question | varchar(250) | MUL | ? |
| vad_admin | varchar(250) | MUL | ? |
| vad_video | varchar(250) |  | ? |
| vad_video_duration | varchar(50) |  | ? |
| vad_create_date | datetime |  | ? |

## analysis_logs_v1
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| trh_id | int(250) | PRI | ? |
| trh_user | int(250) |  | ? |
| trh_activity | varchar(250) |  | ? |
| trh_exercise | varchar(250) |  | ? |
| trh_video_duration | decimal(10,2) |  | ? |
| trh_positive_percent | decimal(10,2) |  | ? |
| trh_neutral_percent | decimal(10,2) |  | ? |
| trh_negative_percent | decimal(10,2) |  | ? |
| trh_total_words | int(250) |  | ? |
| trh_ppm | int(250) |  | ? |
| trh_pc | int(250) |  | ? |
| trh_pp | int(250) |  | ? |
| trh_fc | int(250) |  | ? |
| trh_fp | int(250) |  | ? |
| trh_pc_user | int(250) |  | ? |
| trh_pp_user | int(250) |  | ? |
| trh_fc_user | int(250) |  | ? |
| trh_fp_user | int(250) |  | ? |
| trh_pc_user_percent | decimal(10,2) |  | ? |
| trh_pp_user_percent | decimal(10,2) |  | ? |
| trh_fc_user_percent | int(250) |  | ? |
| trh_fp_user_percent | int(250) |  | ? |
| trh_exercise_sequence | tinyint(1) |  | ? |
| trh_user_sequence | tinyint(1) |  | ? |
| trh_voice_energy | decimal(10,2) |  | ? |
| trh_user_agent | varchar(250) |  | ? |
| trh_score | decimal(10,2) |  | ? |
| trh_mandatory_speech | decimal(10,2) |  | ? |
| trh_mandatory_speech_percent | decimal(10,2) |  | ? |
| trh_forbidden_speech_score | decimal(10,2) |  | ? |
| trh_forbidden_speech_percent | decimal(10,2) |  | ? |
| trh_voice_energy_score | decimal(10,2) |  | ? |
| trh_voice_energy_percent | decimal(10,2) |  | ? |
| trh_speech_rate_score | decimal(10,2) |  | ? |
| trh_speech_rate_percent | decimal(10,2) |  | ? |
| trh_facial_emotion_score | decimal(10,2) |  | ? |
| trh_facial_emotion_percent | decimal(10,2) |  | ? |
| trh_mention_reportscore | int(10) unsigned |  | ? |
| trh_phrases_reportscore | int(10) unsigned |  | ? |
| trh_notmention_reportscore | int(10) unsigned |  | ? |
| trh_notphrases_reportscore | int(10) unsigned |  | ? |
| trh_speech_reportscore | int(10) unsigned |  | ? |
| trh_voice_energy_reportscore | int(10) unsigned |  | ? |
| trh_facial_reportscore | int(10) unsigned |  | ? |
| trh_robin_feedback | longtext |  | ? |
| trh_robin_score | float unsigned |  | ? |
| trh_robin_facial | float unsigned |  | ? |
| trh_robin_voice | float unsigned |  | ? |
| trh_robin_ppm | float unsigned |  | ? |
| trh_robin_total | float unsigned |  | ? |
| trh_datetime | datetime |  | ? |

## user_changepass
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| ucp_id | int(10) unsigned | PRI | ? |
| ucp_user | int(10) unsigned |  | ? |
| ucp_datetime | datetime |  | ? |

## comments_feedback
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmtu_id | int(250) | PRI | ? |
| cmtu_user | int(250) |  | ? |
| cmtu_is_admin | tinyint(1) |  | ? |
| cmtu_user_activity | int(250) |  | ? |
| cmtu_comment | text |  | ? |
| cmtu_question | varchar(250) |  | ? |
| cmtu_timeline | varchar(250) |  | ? |
| cmtu_comment_time | time |  | ? |
| cmtu_datetime | datetime |  | ? |

## poll_user
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| pls_id | int(250) | PRI | ? |
| pls_user | int(150) | MUL | ? |
| pls_poll | varchar(250) | MUL | ? |
| pls_date | datetime |  | ? |
| pls_date_confirm | datetime |  | ? |
| pls_status | tinyint(1) | MUL | ? |

## creator_exercises
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| vq_id | int(10) unsigned | PRI | ? |
| vq_source | varchar(250) | MUL | ? |
| vq_poll | varchar(250) | MUL | ? |
| vq_title | text |  | ? |
| vq_video | varchar(150) |  | ? |
| vq_filter | text |  | ? |
| vq_filter_sequence | tinyint(1) |  | ? |
| vq_filter_notmention | text |  | ? |
| vq_filter_phrases | text |  | ? |
| vq_filter_phrases_notmention | text |  | ? |
| vq_filter_mulmention | text |  | ? |
| vq_rubric | text |  | ? |
| vq_veredict | text |  | ? |
| vq_score_required | int(10) unsigned |  | ? |
| vq_trans_lang | enum('es','en','pt') |  | ? |
| vq_create_date | datetime |  | ? |

## analysis_logs
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| trh_id | int(10) unsigned | PRI | ? |
| trh_user | int(10) unsigned | MUL | ? |
| trh_activity | varchar(250) |  | ? |
| trh_exercise | varchar(250) |  | ? |
| trh_video | varchar(250) |  | ? |
| trh_video_duration | decimal(10,2) |  | ? |
| trh_analysis_id | varchar(50) |  | ? |
| trh_facial_json | longtext |  | ? |
| trh_facial_positive_percent | decimal(10,2) |  | ? |
| trh_facial_neutral_percent | decimal(10,2) |  | ? |
| trh_facial_negative_percent | decimal(10,2) |  | ? |
| trh_total_words | int(10) unsigned |  | ? |
| trh_ppm | int(10) unsigned |  | ? |
| trh_voice_json | longtext |  | ? |
| trh_voice_energy | decimal(10,2) |  | ? |
| trh_hands_json | longtext |  | ? |
| trh_user_agent | varchar(250) |  | ? |
| trh_transcription | longtext |  | ? |
| trh_robin_feedback | longtext |  | ? |
| trh_robin_score | float unsigned |  | ? |
| trh_robin_facial | float unsigned |  | ? |
| trh_robin_voice | float unsigned |  | ? |
| trh_robin_ppm | float unsigned |  | ? |
| trh_robin_total | float unsigned |  | ? |
| trh_datetime | datetime |  | ? |

## twa_registers_historic
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| twah_id | int(11) | PRI | ? |
| twah_register | varchar(250) | MUL | ? |
| twah_source | varchar(250) |  | ? |
| twah_source_media | varchar(250) |  | ? |
| twah_source_poster | varchar(250) |  | ? |
| twah_source_time | varchar(10) |  | ? |
| twah_source_timexec | varchar(10) |  | ? |
| rp_usr_id | int(11) | MUL | ? |
| rp_anw_id | int(11) | MUL | ? |
| twah_json | longtext |  | ? |
| twah_json_performance | longtext |  | ? |
| twah_TotalJoy | decimal(10,2) |  | ? |
| twah_TotalDisgust | decimal(10,2) |  | ? |
| twah_TotalAnger | decimal(10,2) |  | ? |
| twah_TotalSadness | decimal(10,2) |  | ? |
| twah_TotalSurprise | decimal(10,2) |  | ? |
| twah_TotalFear | decimal(10,2) |  | ? |
| twah_positive_percent | decimal(10,2) |  | ? |
| twah_neutral_percent | decimal(10,2) |  | ? |
| twah_negative_percent | decimal(10,2) |  | ? |
| twah_createDate | datetime |  | ? |
| twah_analysisDate | datetime |  | ? |
| twah_status_percent | tinyint(1) |  | ? |
| twah_status_kairos | varchar(250) |  | ? |
| twah_status_code_kairos | int(5) |  | ? |
| twah_num_requests_kairos | int(5) |  | ? |
| twah_nm_json | longtext |  | ? |
| twah_nm_performance | mediumtext |  | ? |
| twah_nm_voice_energy | decimal(10,2) |  | ? |
| twah_nm_status | varchar(150) |  | ? |
| twah_status | varchar(250) |  | ? |

## comments_exercise
**Estimated rows:** 0

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| cmt_ex_id | int(250) | PRI | ? |
| cmt_ex_admin | int(250) | MUL | ? |
| cmt_ex_user | int(250) | MUL | ? |
| cmt_ex_comment | text |  | ? |
| cmt_ex_activity | varchar(250) | MUL | ? |
| cmt_ex_exercise | varchar(250) | MUL | ? |
| cmt_ex_datetime | datetime |  | ? |

## vista_analisis_procesos
**Estimated rows:** None

| Column | Type | Key | Nullable |
|--------|------|-----|----------|
| va_id | int(250) |  | ? |
| va_user | int(250) |  | ? |
| va_poll | varchar(250) |  | ? |
| va_question | varchar(250) |  | ? |
| va_video | varchar(250) |  | ? |
| va_video_duration | varchar(100) |  | ? |
| va_create_date | datetime |  | ? |
| va_analysis | text |  | ? |
| va_analysis_status | enum('0','1','2','3') |  | ? |
| va_facial_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_facial_process_startdate | datetime |  | ? |
| va_facial_process_enddate | datetime |  | ? |
| va_transcription_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_transcription_process_startdate | datetime |  | ? |
| va_transcription_process_enddate | datetime |  | ? |
| va_voice_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_voice_process_startdate | datetime |  | ? |
| va_voice_process_enddate | datetime |  | ? |
| va_transcoding_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_transcoding_process_startdate | datetime |  | ? |
| va_transcoding_process_enddate | datetime |  | ? |
| va_score_process | enum('no_process','process_started','processed','process_error') |  | ? |
| va_score_process_startdate | datetime |  | ? |
| va_score_process_enddate | datetime |  | ? |
| va_intervalLimit | int(10) unsigned |  | ? |
| va_score | decimal(10,2) |  | ? |
