-- DRAFT — DO NOT AUTO-APPLY.
-- Rename to 0003_customer_segmentation.sql to activate.
--
-- Purpose: move the "wholesale vs retail" classification from the ad-hoc
-- `orders.is_bulk` flag + "quantity >= 10" prototype rule into a first-class
-- `profiles.segment` column, so the drill-down P&L dashboard can trust the
-- segmentation across channels (Stripe retail, Faire wholesale, direct B2B).
--
-- Dependencies: 0001_initial_schema.sql (profiles + orders), 0002 (wholesale apps).
--
-- Rollback: drop the column + enum. `is_bulk` remains intact.

-- 1. Segment enum — tied to how the order was sourced (not price tier).
create type customer_segment as enum (
  'retail',          -- Stripe checkout, 1-9 units, individual buyer
  'wholesale',       -- Faire, direct B2B, or quantity >= 10
  'school_program',  -- After-school pottery classes (NoVA/DC)
  'internal'         -- Staff / gift / test orders
);

-- 2. Per-profile segment. Default = retail; upgraded on wholesale approval.
alter table profiles
  add column if not exists segment customer_segment not null default 'retail';

create index if not exists profiles_segment_idx on profiles(segment);

-- 3. Per-order segment snapshot (orders can be placed by unauthenticated
--    buyers or be manually reclassified — we snapshot at order creation
--    so historical P&L reporting is stable even if a profile's segment
--    flips later).
alter table orders
  add column if not exists segment customer_segment;

create index if not exists orders_segment_idx on orders(segment) where segment is not null;

-- 4. Backfill: existing orders get their segment from is_bulk.
update orders
  set segment = case when is_bulk then 'wholesale'::customer_segment
                     else 'retail'::customer_segment end
  where segment is null;

-- 5. When a wholesale_applications row is marked approved, auto-upgrade the
--    buyer's profile segment if we can match by email.
create or replace function public.upgrade_profile_on_wholesale_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and (old.status is distinct from new.status) then
    update profiles
      set segment = 'wholesale', updated_at = now()
      where email = new.contact_email;
  end if;
  return new;
end;
$$;

drop trigger if exists wholesale_applications_approved_upgrade on wholesale_applications;
create trigger wholesale_applications_approved_upgrade
  after update of status on wholesale_applications
  for each row execute function public.upgrade_profile_on_wholesale_approval();

-- 6. Helpful view the drill-down dashboard can query directly.
create or replace view public.orders_segmented as
  select
    o.*,
    coalesce(o.segment, p.segment, 'retail'::customer_segment) as effective_segment,
    p.name as customer_name
  from orders o
  left join profiles p on p.id = o.member_id;

-- TODO after apply:
--  - Update src/lib/pnl-drilldown.ts `classifySegment()` to read
--    effective_segment from Supabase instead of the quantity threshold.
--  - Surface segment badge on /admin/orders list + /admin/orders/[id].
--  - Add "Segment" select to the wholesale approval workflow so staff can
--    mark school_program / internal manually.
