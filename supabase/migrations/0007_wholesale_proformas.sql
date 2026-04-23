-- Wholesale proforma scenarios: immutable forecast snapshots for the
-- /admin/pnl/proforma what-if tool. Each row is one saved scenario
-- (kiln_count x buyer_count x wholesale_price_multiplier) with its
-- computed revenue/COGS/net/capacity/payback at time of save.
--
-- Append-only. No FKs to orders/products/product_costs — this is a
-- forecasting table, NOT a live transaction record. The same per-SKU
-- cost templates that feed the real /admin/pnl (product_costs table)
-- are the inputs to computeScenario() in src/lib/proforma.ts; this
-- table just records the OUTPUT of a given what-if run.
--
-- Dependencies: 0001 (profiles, public.is_admin()). Matches the
-- hire_scenarios pattern (0005_website_analytics adjacent) — admin-only
-- RLS, no tenant scoping, row-per-saved-forecast.

create table wholesale_proformas (
  id uuid primary key default gen_random_uuid(),
  scenario_name text not null,
  kiln_count int not null check (kiln_count between 1 and 10),
  buyer_count int not null check (buyer_count between 1 and 20),
  wholesale_price_multiplier numeric(3,2) not null
    check (wholesale_price_multiplier between 0.30 and 1.00),
  timeline_weeks int not null default 2 check (timeline_weeks > 0),
  forecasted_revenue_cents bigint not null,
  forecasted_cogs_cents bigint not null,
  forecasted_net_cents bigint not null,
  capacity_utilization_pct numeric(5,2) not null,
  kiln_capex_cents bigint not null default 0,
  payback_weeks numeric(6,2),
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index wholesale_proformas_created_at_idx
  on wholesale_proformas (created_at desc);

create index wholesale_proformas_scenario_axis_idx
  on wholesale_proformas (kiln_count, buyer_count);

alter table wholesale_proformas enable row level security;

create policy wholesale_proformas_admin_all
  on wholesale_proformas for all
  using (public.is_admin()) with check (public.is_admin());
