-- =============================================================================
-- Jimmy Potters — Seed Jeff Bania as admin
-- =============================================================================
-- Two pathways so Jeff is admin whether he signs up BEFORE or AFTER this migration:
--
--   1. RETROACTIVE — any existing profiles row matching one of Jeff's emails is
--      upgraded to role='admin'. Safe no-op if no row exists yet.
--
--   2. AUTO-ON-SIGNUP — replace the handle_new_user() trigger so that when a
--      user signs up with one of Jeff's known emails, the new profiles row is
--      created with role='admin' directly. No second step required.
--
-- Idempotent: re-running just re-writes the trigger body and re-runs the UPDATE.
-- =============================================================================

-- 1. Retroactive upgrade (no-op if Jeff hasn't signed up yet)
update public.profiles
   set role = 'admin',
       updated_at = now()
 where lower(email) in ('jeff.t1.bania@gmail.com', 'jeffbania@gmail.com')
   and role <> 'admin';

-- 2. Replace the new-user trigger to auto-assign 'admin' for Jeff's emails
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role profile_role := 'customer';
begin
  if lower(new.email) in ('jeff.t1.bania@gmail.com', 'jeffbania@gmail.com') then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''), assigned_role);

  return new;
end;
$$;

-- The on_auth_user_created trigger from 0001 already points at
-- public.handle_new_user(); replacing the function above is sufficient.
