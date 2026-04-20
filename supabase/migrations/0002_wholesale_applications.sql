-- Wholesale application intake + admin review queue.
-- Stage 2 + 3 of the wholesale protocol: buyers submit applications that
-- persist to this table instead of vanishing into Jeff's inbox, and
-- admins triage them with the existing `is_admin()` helper from 0001.

create type wholesale_buyer_type as enum ('business', 'individual');

create type wholesale_application_status as enum (
  'pending',
  'needs_info',
  'approved',
  'rejected'
);

create table wholesale_applications (
  id uuid primary key default gen_random_uuid(),

  -- Buyer identity
  buyer_type wholesale_buyer_type not null default 'business',
  company_name text,
  company_address text,
  company_website text,
  tax_id text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  shipping_address text,

  -- Intent snapshot
  expected_annual_volume_cents integer,
  cart_items jsonb not null default '[]'::jsonb,
  cart_item_count integer not null default 0,
  cart_retail_total_cents integer not null default 0,
  notes text,

  -- Review state
  status wholesale_application_status not null default 'pending',
  admin_notes text,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,

  -- Lifecycle
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wholesale_applications_status_idx
  on wholesale_applications(status);
create index wholesale_applications_submitted_at_idx
  on wholesale_applications(submitted_at desc);
create index wholesale_applications_contact_email_idx
  on wholesale_applications(contact_email);

create or replace function public.wholesale_applications_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wholesale_applications_touch
  before update on wholesale_applications
  for each row execute function public.wholesale_applications_touch();

alter table wholesale_applications enable row level security;

-- Anyone (including anon) can submit an application — /api/wholesale/submit
-- runs server-side with the service-role client, so this policy mainly
-- protects against accidental direct client inserts being blocked. We keep
-- it locked to admin for selects/updates so buyers can't read each other's
-- submissions.
create policy wholesale_applications_admin_all
  on wholesale_applications
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Allow anonymous + authenticated to INSERT their own application. The
-- server route is the real write path; this is a defensive belt.
create policy wholesale_applications_public_insert
  on wholesale_applications
  for insert
  with check (true);
