-- SkyPulse MVP: initial schema
-- 10 tables matching PRD specification

-- 1. businesses
create table businesses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  business_type text not null check (business_type in ('pharmacy', 'convenience_store', 'cafe')),
  address       text not null,
  lat           double precision not null,
  lng           double precision not null,
  timezone      text not null default 'Asia/Jerusalem',
  opening_hours_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. business_categories
create table business_categories (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null references businesses(id) on delete cascade,
  category_name          text not null,
  margin_level           text not null check (margin_level in ('low', 'medium', 'high')),
  weather_sensitivity    text not null check (weather_sensitivity in ('low', 'medium', 'high')),
  event_sensitivity      text not null check (event_sensitivity in ('low', 'medium', 'high')),
  air_quality_sensitivity text not null check (air_quality_sensitivity in ('low', 'medium', 'high')),
  created_at             timestamptz not null default now()
);

create index idx_business_categories_business_id on business_categories(business_id);

-- 3. agent_runs
create table agent_runs (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references businesses(id) on delete cascade,
  run_type                 text not null check (run_type in ('weekly', 'day_ahead', 'intraday')),
  trigger_type             text not null check (trigger_type in ('manual', 'scheduled', 'signal_change', 'demo_simulation')),
  planning_start           timestamptz not null,
  planning_end             timestamptz not null,
  status                   text not null default 'running' check (status in ('running', 'completed', 'failed')),
  overall_opportunity_score double precision not null default 0,
  overall_risk_score       double precision not null default 0,
  summary                  text,
  created_at               timestamptz not null default now(),
  completed_at             timestamptz
);

create index idx_agent_runs_business_id on agent_runs(business_id);
create index idx_agent_runs_status on agent_runs(status);

-- 4. signal_snapshots
create table signal_snapshots (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  run_id          uuid not null references agent_runs(id) on delete cascade,
  signal_type     text not null check (signal_type in ('weather', 'air_quality', 'places', 'events', 'mock_mobility', 'mock_inventory')),
  raw_json        jsonb not null default '{}'::jsonb,
  normalized_json jsonb not null default '{}'::jsonb,
  source          text not null,
  created_at      timestamptz not null default now()
);

create index idx_signal_snapshots_business_id on signal_snapshots(business_id);
create index idx_signal_snapshots_run_id on signal_snapshots(run_id);

-- 5. signal_changes
create table signal_changes (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  run_id             uuid not null references agent_runs(id) on delete cascade,
  signal_type        text not null check (signal_type in ('weather', 'air_quality', 'places', 'events', 'mock_mobility', 'mock_inventory')),
  previous_value_json jsonb not null default '{}'::jsonb,
  new_value_json     jsonb not null default '{}'::jsonb,
  change_severity    text not null check (change_severity in ('low', 'medium', 'high', 'critical')),
  requires_action    boolean not null default false,
  detected_at        timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

create index idx_signal_changes_business_id on signal_changes(business_id);
create index idx_signal_changes_run_id on signal_changes(run_id);

-- 6. recommendations
create table recommendations (
  id                  uuid primary key default gen_random_uuid(),
  run_id              uuid not null references agent_runs(id) on delete cascade,
  business_id         uuid not null references businesses(id) on delete cascade,
  created_by_run_type text not null check (created_by_run_type in ('weekly', 'day_ahead', 'intraday')),
  date                date not null,
  time_window         text not null,
  vertical            text not null check (vertical in ('pharmacy', 'convenience_store', 'cafe')),
  recommendation_type text not null check (recommendation_type in ('inventory', 'staffing', 'marketing', 'layout', 'hours', 'alert')),
  priority            text not null check (priority in ('low', 'medium', 'high', 'critical')),
  confidence          double precision not null,
  status              text not null default 'suggested' check (status in ('suggested', 'accepted', 'active', 'updated', 'cancelled', 'completed', 'ignored')),
  title               text not null,
  action              text not null,
  why                 text not null,
  source_signals      text[] not null default '{}',
  expected_impact     jsonb not null default '{}'::jsonb,
  effort              text not null check (effort in ('low', 'medium', 'high')),
  owner               text not null,
  valid_from          timestamptz not null,
  valid_until         timestamptz not null,
  last_validated_at   timestamptz not null default now(),
  superseded_by       uuid references recommendations(id),
  update_reason       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_recommendations_business_id on recommendations(business_id);
create index idx_recommendations_run_id on recommendations(run_id);
create index idx_recommendations_status on recommendations(status);
create index idx_recommendations_date on recommendations(date);

-- 7. events
create table events (
  id                   uuid primary key default gen_random_uuid(),
  run_id               uuid not null references agent_runs(id) on delete cascade,
  business_id          uuid not null references businesses(id) on delete cascade,
  name                 text not null,
  venue                text not null,
  date                 date not null,
  start_time           timestamptz not null,
  end_time             timestamptz not null,
  distance_km          double precision not null,
  estimated_attendance text not null check (estimated_attendance in ('low', 'medium', 'high', 'unknown')),
  confidence           double precision not null,
  business_relevance   text,
  source_url           text,
  raw_json             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_events_business_id on events(business_id);
create index idx_events_run_id on events(run_id);
create index idx_events_date on events(date);

-- 8. places
create table places (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  place_id           text not null,
  name               text not null,
  place_type         text not null,
  lat                double precision not null,
  lng                double precision not null,
  distance_meters    double precision not null,
  rating             double precision,
  business_status    text,
  opening_hours_json jsonb,
  raw_json           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_places_business_id on places(business_id);

-- 9. alerts
create table alerts (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  recommendation_id uuid not null references recommendations(id) on delete cascade,
  alert_type        text not null,
  severity          text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title             text not null,
  message           text not null,
  created_at        timestamptz not null default now(),
  acknowledged_at   timestamptz
);

create index idx_alerts_business_id on alerts(business_id);

-- 10. campaigns
create table campaigns (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references agent_runs(id) on delete cascade,
  recommendation_id uuid not null references recommendations(id) on delete cascade,
  channel           text not null check (channel in ('whatsapp', 'instagram', 'shelf_sign', 'staff_script')),
  message           text not null,
  send_time         timestamptz not null,
  created_at        timestamptz not null default now()
);

create index idx_campaigns_run_id on campaigns(run_id);
