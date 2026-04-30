-- Migration: vendors registry + back-link FKs from expense tables.
-- Purpose: PR 1 of admin compliance + vendors initiative.
-- Created: 2026-04-30 by JP-BIZ-INTEL under Jokoy.
-- Single worst-case figures only (Rule #42). Acronyms expanded on first use.
--
-- New domain:
--   vendors           -- master list of every paid third party (hosting, domain,
--                        payments, chat, email, other). One row per vendor.
--   FK columns        -- overhead_expenses.vendor_id, recurring_expenses.vendor_id
--                        replace the legacy free-text vendor field for join-ready
--                        aggregation.
--
-- RLS (Row-Level Security): admin-only read+write, mirroring the recurring_expenses
-- policy at 0001_initial_schema.sql:479.

-- =========================================================================
-- 1. ENUMS
-- =========================================================================

create type vendor_role as enum (
  'hosting',
  'domain',
  'payments',
  'chat',
  'email',
  'other'
);

create type vendor_status as enum (
  'active',
  'overdue',
  'cancelled',
  'paused'
);

-- =========================================================================
-- 2. VENDORS MASTER TABLE
-- =========================================================================

create table vendors (
  -- identity
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role vendor_role not null,

  -- account access
  login_url text,
  account_email text,

  -- cost (USD + COP per Rule 3b currency)
  monthly_cost_usd numeric(10, 2),
  monthly_cost_cop integer,
  cost_rate_date date,
  cost_rate_source text,
  billing_day_of_month integer check (billing_day_of_month is null or (billing_day_of_month between 1 and 31)),

  -- contract
  contract_term_months integer check (contract_term_months is null or contract_term_months >= 0),
  contract_starts_at date,
  contract_ends_at date,
  auto_renew boolean not null default false,
  cancellation_deadline_days integer check (cancellation_deadline_days is null or cancellation_deadline_days >= 0),

  -- domain (only relevant when role = 'domain')
  domain_expires_at timestamptz,
  domain_last_checked_at timestamptz,

  -- compliance documents (W-9 = IRS Form W-9; COI = Certificate of Insurance)
  w9_on_file boolean not null default false,
  w9_document_id uuid references financial_documents(id) on delete set null,
  coi_on_file boolean not null default false,
  coi_document_id uuid references financial_documents(id) on delete set null,
  coi_expires_at date,

  -- lifecycle
  status vendor_status not null default 'active',
  notes text,

  -- audit columns
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null
);

-- Renewal-cron lookup indexes (RDAP cron + COI watcher).
create index vendors_domain_expires_at_idx on vendors(domain_expires_at)
  where domain_expires_at is not null;
create index vendors_coi_expires_at_idx on vendors(coi_expires_at)
  where coi_expires_at is not null;
create index vendors_contract_ends_at_idx on vendors(contract_ends_at)
  where contract_ends_at is not null;
create index vendors_role_status_idx on vendors(role, status);

-- updated_at autotouch
create or replace function vendors_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vendors_updated_at
  before update on vendors
  for each row execute function vendors_set_updated_at();

-- =========================================================================
-- 3. BACK-LINK FK COLUMNS ON EXISTING EXPENSE TABLES
-- =========================================================================

alter table overhead_expenses
  add column vendor_id uuid references vendors(id) on delete set null;

alter table recurring_expenses
  add column vendor_id uuid references vendors(id) on delete set null;

create index overhead_expenses_vendor_id_idx on overhead_expenses(vendor_id)
  where vendor_id is not null;
create index recurring_expenses_vendor_id_idx on recurring_expenses(vendor_id)
  where vendor_id is not null;

-- =========================================================================
-- 4. ROW-LEVEL SECURITY
-- =========================================================================

alter table vendors enable row level security;

create policy vendors_admin_all on vendors
  for all using (public.is_admin()) with check (public.is_admin());
