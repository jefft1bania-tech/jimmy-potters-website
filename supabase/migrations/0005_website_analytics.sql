-- =============================================================================
-- Jimmy Potters — Website Analytics (self-hosted, no paid vendor)
-- =============================================================================
-- Measures website functionality + brand resonance:
--   * Who visits (unique visitors / sessions / pageviews)
--   * Where they come from (referrer, UTMs, search vs direct vs social)
--   * What they do (page funnel, add_to_cart, checkout_start/complete,
--     wholesale_apply_submit — the #1 brand/functionality KPI)
--   * How long they stay (time_on_page_sec, max_scroll_pct) + whether they
--     bounce / return
--
-- Hybrid collection strategy:
--   * middleware.ts fires server-side page_views row on every non-asset
--     request (adblock-proof, Vercel geo headers).
--   * <Analytics /> client component enriches that row on pagehide with
--     scroll + time-on-page via sendBeacon → /api/track/event.
--   * Named events (wholesale_apply_submit, checkout_complete, etc.) go
--     straight into `events` with a session FK.
--
-- Privacy:
--   * Honor navigator.doNotTrack === '1' — server still logs an anonymous
--     row (no UA, no city), client library becomes a no-op, no localStorage.
--   * IP is never stored; we keep country only (from Vercel geo header).
--
-- Dependencies: 0001 (profiles, is_admin). No hard dep on 0002/0004.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SESSIONS — one row per (visitor × 30-min-idle window)
-- -----------------------------------------------------------------------------
create table website_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,           -- client-generated; sticks 30 min idle
  visitor_id text not null,                  -- client-generated; 2yr localStorage
  first_path text,
  first_referrer text,
  referrer_host text,                        -- extracted host (e.g. google.com)
  traffic_source text,                       -- google_organic / google_paid /
                                             -- direct / social / referral / other
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  country text,
  region text,
  city text,
  device text,                               -- mobile / tablet / desktop
  browser text,
  os text,
  viewport_width integer,
  is_bot boolean not null default false,
  is_wholesale boolean not null default false, -- flipped when visitor hits /wholesale
  is_returning boolean not null default false,
  dnt boolean not null default false,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  page_count integer not null default 0,
  event_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index website_sessions_started_idx on website_sessions(started_at desc);
create index website_sessions_visitor_idx on website_sessions(visitor_id);
create index website_sessions_source_idx on website_sessions(traffic_source);
create index website_sessions_country_idx on website_sessions(country);
create index website_sessions_is_bot_idx on website_sessions(is_bot);

-- -----------------------------------------------------------------------------
-- 2. PAGE VIEWS — one row per page load (server-inserted, client-enriched)
-- -----------------------------------------------------------------------------
create table website_page_views (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,                  -- soft FK → website_sessions.session_id
  visitor_id text not null,
  path text not null,
  query text,
  referrer text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  user_agent text,
  country text,
  device text,
  viewport_width integer,
  time_on_page_sec integer,                  -- filled in by client on pagehide
  max_scroll_pct integer,                    -- 0-100, filled in by client
  is_bot boolean not null default false,
  dnt boolean not null default false,
  created_at timestamptz not null default now()
);

create index website_page_views_created_idx on website_page_views(created_at desc);
create index website_page_views_session_idx on website_page_views(session_id);
create index website_page_views_path_idx on website_page_views(path);
create index website_page_views_is_bot_idx on website_page_views(is_bot);

-- -----------------------------------------------------------------------------
-- 3. EVENTS — named client events (wholesale_apply_submit, add_to_cart, …)
-- -----------------------------------------------------------------------------
create table website_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  visitor_id text not null,
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  path text,
  created_at timestamptz not null default now()
);

create index website_events_created_idx on website_events(created_at desc);
create index website_events_name_idx on website_events(event_name);
create index website_events_session_idx on website_events(session_id);

-- -----------------------------------------------------------------------------
-- 4. RLS — service-role inserts only, admins read everything
-- -----------------------------------------------------------------------------
alter table website_sessions enable row level security;
alter table website_page_views enable row level security;
alter table website_events enable row level security;

-- Admin full access via is_admin() helper from 0001_initial_schema.sql.
create policy website_sessions_admin_all on website_sessions
  for all using (public.is_admin()) with check (public.is_admin());
create policy website_page_views_admin_all on website_page_views
  for all using (public.is_admin()) with check (public.is_admin());
create policy website_events_admin_all on website_events
  for all using (public.is_admin()) with check (public.is_admin());

-- No anon/auth user policies — writes flow exclusively through the
-- service-role key on the server. Client components call /api/track/event
-- which uses createSupabaseAdminClient() to insert.

-- -----------------------------------------------------------------------------
-- 5. CONVENIENCE VIEW — top-line metrics for /admin/analytics
-- -----------------------------------------------------------------------------
create or replace view vw_analytics_overview as
with today_bounds as (
  select date_trunc('day', now()) as d0
),
v7 as (
  select count(distinct visitor_id) as uv_7d
  from website_sessions
  where started_at >= now() - interval '7 days' and not is_bot
),
v30 as (
  select count(distinct visitor_id) as uv_30d
  from website_sessions
  where started_at >= now() - interval '30 days' and not is_bot
),
v_today as (
  select count(distinct visitor_id) as uv_today
  from website_sessions, today_bounds
  where started_at >= d0 and not is_bot
),
pv_today as (
  select count(*) as pv_today
  from website_page_views, today_bounds
  where created_at >= d0 and not is_bot
),
pv_7d as (
  select count(*) as pv_7d
  from website_page_views
  where created_at >= now() - interval '7 days' and not is_bot
),
wa_7d as (
  select count(*) as wholesale_apply_7d
  from website_events
  where event_name = 'wholesale_apply_submit'
    and created_at >= now() - interval '7 days'
),
wa_30d as (
  select count(*) as wholesale_apply_30d
  from website_events
  where event_name = 'wholesale_apply_submit'
    and created_at >= now() - interval '30 days'
),
cc_7d as (
  select count(*) as checkout_complete_7d
  from website_events
  where event_name = 'checkout_complete'
    and created_at >= now() - interval '7 days'
),
bounce_7d as (
  select
    coalesce(avg(case when page_count <= 1 then 1.0 else 0.0 end), 0) as bounce_rate_7d,
    coalesce(avg(extract(epoch from (last_seen_at - started_at))), 0) as avg_session_sec_7d
  from website_sessions
  where started_at >= now() - interval '7 days' and not is_bot
)
select
  v_today.uv_today,
  v7.uv_7d,
  v30.uv_30d,
  pv_today.pv_today,
  pv_7d.pv_7d,
  wa_7d.wholesale_apply_7d,
  wa_30d.wholesale_apply_30d,
  cc_7d.checkout_complete_7d,
  bounce_7d.bounce_rate_7d,
  bounce_7d.avg_session_sec_7d
from v_today, v7, v30, pv_today, pv_7d, wa_7d, wa_30d, cc_7d, bounce_7d;
