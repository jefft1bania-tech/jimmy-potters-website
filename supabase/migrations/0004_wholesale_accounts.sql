-- Stage 4 of the wholesale protocol: invite-and-accept flow.
--
-- An admin approves a wholesale_applications row which creates a
-- wholesale_accounts row + fires a Supabase Auth invite email. The buyer
-- clicks the link, lands on /wholesale/accept, sets a password, and the
-- row flips from 'invited' to 'active'. The gate for wholesale pricing
-- downstream is `public.is_wholesale()` — an active row for auth.uid().
--
-- Dependencies: 0001 (profiles, is_admin()), 0002 (wholesale_applications).
-- Deliberately does NOT depend on DRAFT-0003; segment classification can
-- be layered on later without reshaping this table.

create type wholesale_account_status as enum ('invited', 'active', 'suspended');

create table wholesale_accounts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references wholesale_applications(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  contact_email text not null,
  company_name text,
  status wholesale_account_status not null default 'invited',
  invited_by uuid references profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  activated_at timestamptz,
  last_invite_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index wholesale_accounts_email_uidx
  on wholesale_accounts (lower(contact_email));
create index wholesale_accounts_profile_idx on wholesale_accounts(profile_id);
create index wholesale_accounts_application_idx on wholesale_accounts(application_id);
create index wholesale_accounts_status_idx on wholesale_accounts(status);

create or replace function public.wholesale_accounts_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wholesale_accounts_touch
  before update on wholesale_accounts
  for each row execute function public.wholesale_accounts_touch();

-- Gate helper for downstream pricing / checkout routes.
create or replace function public.is_wholesale()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wholesale_accounts
    where profile_id = auth.uid() and status = 'active'
  );
$$;

alter table wholesale_accounts enable row level security;

-- Admins can see + manage every row.
create policy wholesale_accounts_admin_all
  on wholesale_accounts for all
  using (public.is_admin()) with check (public.is_admin());

-- Buyers can read only their own row (used by /account + wholesale UI).
create policy wholesale_accounts_self_read
  on wholesale_accounts for select
  using (profile_id = auth.uid());
