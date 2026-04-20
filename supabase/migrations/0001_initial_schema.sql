-- Jimmy Potters — initial Supabase schema
-- Runs once against a fresh project. Idempotent via IF NOT EXISTS where possible.

-- =========================================================================
-- 1. PROFILES (extends auth.users) + helper
-- =========================================================================

create type profile_role as enum ('customer', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role profile_role not null default 'customer',
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''), 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================================
-- 2. ORDERS + order_items + shipments
-- =========================================================================

create type order_type as enum ('guest', 'registered');
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'refunded', 'cancelled');
create type payment_method_type as enum ('stripe', 'venmo', 'paypal');

create table orders (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete set null,
  email text not null,
  type order_type not null,
  shipping jsonb not null,
  buyer_state text not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  sales_tax_cents integer not null default 0 check (sales_tax_cents >= 0),
  shipping_cost_cents integer not null default 0,
  internal_shipping_cost_cents integer not null default 0,
  total_cents integer not null check (total_cents >= 0),
  payment_method payment_method_type not null default 'stripe',
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  stripe_fee_cents integer,
  status order_status not null default 'pending',
  is_bulk boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  refunded_at timestamptz
);

create index orders_member_id_idx on orders(member_id);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);
create index orders_is_bulk_idx on orders(is_bulk) where is_bulk = true;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  image text
);

create index order_items_order_id_idx on order_items(order_id);
create index order_items_product_id_idx on order_items(product_id);

create type shipment_status_type as enum (
  'queued', 'in_production', 'packed', 'shipped', 'in_transit', 'delivered', 'delayed'
);
create type shipment_flag as enum ('normal', 'heads_up', 'critical', 'urgent');
create type carrier_type as enum ('fedex', 'usps', 'ups', 'local');

create table shipments (
  order_id uuid primary key references orders(id) on delete cascade,
  required_ship_by date,
  promised_delivery date,
  production_started_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  carrier carrier_type,
  tracking_number text,
  shipment_status shipment_status_type not null default 'queued',
  flag shipment_flag not null default 'normal',
  notes text
);

create index shipments_required_ship_by_idx on shipments(required_ship_by);
create index shipments_status_idx on shipments(shipment_status);
create index shipments_flag_idx on shipments(flag) where flag <> 'normal';

-- =========================================================================
-- 3. COSTS — per-SKU template + per-order overrides + overhead
-- =========================================================================

create table product_costs (
  product_id text primary key,
  materials_cents integer not null default 0,
  labor_cents integer not null default 0,
  packaging_cents integer not null default 0,
  freight_cents integer not null default 0,
  other_cents integer not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);

create table order_cost_overrides (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  materials_cents integer,
  labor_cents integer,
  packaging_cents integer,
  freight_cents integer,
  other_cents integer,
  notes text,
  updated_at timestamptz not null default now(),
  unique(order_id)
);

create type overhead_category as enum (
  'rent', 'utilities_power', 'utilities_water', 'utilities_gas',
  'internet', 'insurance', 'security', 'waste',
  'tools', 'studio_supplies', 'marketing', 'professional_services',
  'software', 'shipping_supplies', 'other'
);

create table overhead_expenses (
  id uuid primary key default gen_random_uuid(),
  category overhead_category not null,
  amount_cents integer not null check (amount_cents >= 0),
  incurred_on date not null,
  vendor text,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'recurring', 'document_import')),
  source_ref uuid,
  created_at timestamptz not null default now()
);

create index overhead_expenses_incurred_on_idx on overhead_expenses(incurred_on desc);
create index overhead_expenses_category_idx on overhead_expenses(category);

create type recurrence_type as enum ('monthly', 'quarterly', 'annual');

create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  category overhead_category not null,
  amount_cents integer not null check (amount_cents >= 0),
  recurrence recurrence_type not null,
  vendor text,
  starts_on date not null,
  ends_on date,
  last_posted_on date,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 4. PAYMENTS — manual Venmo/PayPal confirmations + refunds
-- =========================================================================

create table payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider payment_method_type not null,
  amount_cents integer not null check (amount_cents >= 0),
  received_on date not null,
  confirmed_by uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create type refund_status as enum ('pending', 'succeeded', 'failed');

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  dispute_id uuid,
  stripe_refund_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  status refund_status not null default 'pending',
  issued_at timestamptz not null default now(),
  issued_by uuid references profiles(id)
);

-- =========================================================================
-- 5. DOCUMENTS — uploaded receipts + parsed data
-- =========================================================================

create type document_category as enum (
  'receipt', 'invoice', 'bill', 'bank_statement', '1099', 'w2', 'other'
);
create type document_status as enum ('pending', 'parsed', 'confirmed', 'rejected');

create table financial_documents (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes integer not null,
  uploaded_by uuid references profiles(id),
  category document_category not null default 'other',
  status document_status not null default 'pending',
  extracted_vendor text,
  extracted_amount_cents integer,
  extracted_issued_on date,
  extracted_tax_cents integer,
  extracted_line_items jsonb,
  extracted_raw_text text,
  ai_confidence numeric(3, 2),
  linked_expense_id uuid references overhead_expenses(id) on delete set null,
  linked_order_id uuid references orders(id) on delete set null,
  tax_year integer,
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index financial_documents_status_idx on financial_documents(status);
create index financial_documents_tax_year_idx on financial_documents(tax_year);

-- =========================================================================
-- 6. BULK ORDER PRICING + NOTIFICATION LOG + AI INSIGHTS
-- =========================================================================

create type customer_type as enum ('wholesale', 'faire', 'direct_bulk', 'school_program');

create table bulk_order_pricing (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade unique,
  customer_type customer_type not null,
  tier_discount_pct numeric(5, 2) default 0,
  volume_unit_cost_cents integer,
  notes text
);

create type notification_type_enum as enum (
  'bulk_order_created',
  'ship_by_30d', 'ship_by_14d', 'ship_by_7d', 'ship_by_3d', 'overdue',
  'customer_refund_issued', 'dispute_opened'
);

create table notification_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  notification_type notification_type_enum not null,
  recipient_email text not null,
  sent_at timestamptz not null default now(),
  payload jsonb
);

create unique index notification_log_dedupe_idx
  on notification_log(order_id, notification_type)
  where order_id is not null;

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  query_hash text not null,
  query_text text not null,
  prompt_version text not null,
  data_snapshot jsonb,
  response_markdown text not null,
  input_tokens integer,
  output_tokens integer,
  generated_at timestamptz not null default now(),
  generated_by uuid references profiles(id)
);

create index ai_insights_query_hash_idx on ai_insights(query_hash, generated_at desc);

-- =========================================================================
-- 7. LABOR — roles, per-product times, per-order requirements, workers, hiring scenarios
-- =========================================================================

create type tax_treatment_type as enum ('w2', '1099', 'temp_agency');

create table labor_roles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  display_name text not null,
  default_hourly_rate_cents integer not null default 0,
  default_contract_rate_cents integer,
  default_piece_rate_cents integer,
  tax_treatment tax_treatment_type not null default 'w2',
  notes text,
  created_at timestamptz not null default now()
);

create table product_labor_times (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  role_id uuid not null references labor_roles(id) on delete cascade,
  minutes_per_unit numeric(6, 2) not null check (minutes_per_unit >= 0),
  notes text,
  unique(product_id, role_id)
);

create table labor_requirements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  role_id uuid not null references labor_roles(id),
  estimated_minutes numeric(8, 2) not null,
  estimated_cost_cents integer not null,
  actual_minutes numeric(8, 2),
  actual_cost_cents integer,
  actual_workers_used integer,
  notes text,
  unique(order_id, role_id)
);

create type worker_status as enum ('active', 'on_call', 'inactive', 'candidate');
create type compensation_type as enum ('hourly_w2', 'contract_1099', 'temp_agency', 'piece_rate');

create table workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  contact_phone text,
  contact_email text,
  status worker_status not null default 'candidate',
  compensation_type compensation_type,
  base_rate_cents integer,
  role_keys text[],
  notes text,
  hired_on date,
  offboarded_on date,
  created_at timestamptz not null default now()
);

create table hire_scenarios (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references labor_roles(id),
  scenario_name text not null,
  weekly_hours_est numeric(6, 2) not null,
  duration_weeks_est numeric(6, 2) not null,
  base_rate_cents_input integer not null,
  fully_loaded_cost_cents_hourly_w2 integer,
  fully_loaded_cost_cents_1099 integer,
  fully_loaded_cost_cents_temp_agency integer,
  fully_loaded_cost_cents_piece_rate integer,
  ai_recommendation text,
  generated_at timestamptz not null default now()
);

-- =========================================================================
-- 8. CUSTOMER SERVICE — disputes
-- =========================================================================

create type dispute_type_enum as enum (
  'not_received', 'damaged', 'wrong_item', 'refund_request', 'late_delivery', 'other'
);
create type dispute_status as enum (
  'new', 'investigating', 'awaiting_customer',
  'resolved_refund', 'resolved_replacement', 'resolved_no_action', 'closed'
);
create type dispute_channel as enum ('chat_widget', 'email', 'voice', 'manual');

create table customer_disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  customer_email text not null,
  dispute_type dispute_type_enum not null,
  opened_at timestamptz not null default now(),
  opened_via dispute_channel not null default 'manual',
  status dispute_status not null default 'new',
  resolution_notes text,
  closed_at timestamptz,
  handled_by uuid references profiles(id),
  chat_transcript jsonb
);

create index customer_disputes_status_idx on customer_disputes(status);
create index customer_disputes_opened_at_idx on customer_disputes(opened_at desc);

-- late FK now that customer_disputes exists
alter table refunds
  add constraint refunds_dispute_id_fkey
  foreign key (dispute_id) references customer_disputes(id) on delete set null;

-- =========================================================================
-- 9. ROW-LEVEL SECURITY
-- =========================================================================

alter table profiles                enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table shipments               enable row level security;
alter table product_costs           enable row level security;
alter table order_cost_overrides    enable row level security;
alter table overhead_expenses       enable row level security;
alter table recurring_expenses      enable row level security;
alter table payment_records         enable row level security;
alter table refunds                 enable row level security;
alter table financial_documents     enable row level security;
alter table bulk_order_pricing      enable row level security;
alter table notification_log        enable row level security;
alter table ai_insights             enable row level security;
alter table labor_roles             enable row level security;
alter table product_labor_times     enable row level security;
alter table labor_requirements      enable row level security;
alter table workers                 enable row level security;
alter table hire_scenarios          enable row level security;
alter table customer_disputes       enable row level security;

-- Profiles: users read/update self; admins read all
create policy profiles_self_select   on profiles for select using (auth.uid() = id or public.is_admin());
create policy profiles_self_update   on profiles for update using (auth.uid() = id);
create policy profiles_admin_update  on profiles for update using (public.is_admin());

-- Orders: customer can see their own rows (matched by member_id); admins see all
create policy orders_self_select on orders
  for select using (member_id = auth.uid() or public.is_admin());
create policy orders_admin_all on orders
  for all using (public.is_admin()) with check (public.is_admin());

-- Order items follow their parent order
create policy order_items_self_select on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.member_id = auth.uid() or public.is_admin())
    )
  );
create policy order_items_admin_all on order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Shipments: customers see their own shipments
create policy shipments_self_select on shipments
  for select using (
    exists (
      select 1 from orders o
      where o.id = shipments.order_id
        and (o.member_id = auth.uid() or public.is_admin())
    )
  );
create policy shipments_admin_all on shipments
  for all using (public.is_admin()) with check (public.is_admin());

-- Everything else: admin-only
create policy product_costs_admin on product_costs           for all using (public.is_admin()) with check (public.is_admin());
create policy order_cost_admin    on order_cost_overrides    for all using (public.is_admin()) with check (public.is_admin());
create policy overhead_admin      on overhead_expenses       for all using (public.is_admin()) with check (public.is_admin());
create policy recurring_admin     on recurring_expenses      for all using (public.is_admin()) with check (public.is_admin());
create policy payment_records_admin on payment_records       for all using (public.is_admin()) with check (public.is_admin());
create policy refunds_admin       on refunds                 for all using (public.is_admin()) with check (public.is_admin());
create policy documents_admin     on financial_documents     for all using (public.is_admin()) with check (public.is_admin());
create policy bulk_pricing_admin  on bulk_order_pricing      for all using (public.is_admin()) with check (public.is_admin());
create policy notification_admin  on notification_log        for all using (public.is_admin()) with check (public.is_admin());
create policy ai_insights_admin   on ai_insights             for all using (public.is_admin()) with check (public.is_admin());
create policy labor_roles_admin   on labor_roles             for all using (public.is_admin()) with check (public.is_admin());
create policy labor_times_admin   on product_labor_times     for all using (public.is_admin()) with check (public.is_admin());
create policy labor_req_admin     on labor_requirements      for all using (public.is_admin()) with check (public.is_admin());
create policy workers_admin       on workers                 for all using (public.is_admin()) with check (public.is_admin());
create policy hire_scenarios_admin on hire_scenarios         for all using (public.is_admin()) with check (public.is_admin());

-- Customer disputes: customers can insert their own; admins see/update all
create policy disputes_customer_insert on customer_disputes
  for insert with check (customer_email = auth.email() or public.is_admin());
create policy disputes_admin_all on customer_disputes
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- 10. STORAGE BUCKET for financial documents
-- =========================================================================

insert into storage.buckets (id, name, public) values ('financial-documents', 'financial-documents', false)
  on conflict (id) do nothing;

create policy "financial-docs admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'financial-documents' and public.is_admin());

create policy "financial-docs admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'financial-documents' and public.is_admin());

create policy "financial-docs admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'financial-documents' and public.is_admin());

-- =========================================================================
-- 11. SEED LABOR ROLES (non-destructive defaults)
-- =========================================================================

insert into labor_roles (role_key, display_name, default_hourly_rate_cents, tax_treatment) values
  ('throwing',        'Throwing / Hand-Building', 2000, 'w2'),
  ('glazing',         'Glazing',                  1800, 'w2'),
  ('painting',        'Painting / Decoration',    1800, 'w2'),
  ('boxing',          'Boxing / Packing',         1500, 'w2'),
  ('driving_to_fedex','Driving to FedEx',         2000, 'w2'),
  ('studio_cleanup',  'Studio Cleanup',           1500, 'w2')
on conflict (role_key) do nothing;
