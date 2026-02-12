-- My OP Binder - Initial Schema
-- Run this migration in the Supabase SQL Editor

-- ============================================
-- SETS TABLE
-- ============================================
create table public.sets (
  id uuid default gen_random_uuid() primary key,
  set_id text unique not null,
  set_name text not null,
  release_date date,
  card_count integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for frequent queries
create index idx_sets_set_id on public.sets(set_id);

-- ============================================
-- CARDS TABLE
-- ============================================
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  card_set_id text unique not null,
  set_id text not null references public.sets(set_id) on delete cascade,
  card_name text not null,
  card_type text not null,
  card_color text not null,
  rarity text not null,
  card_cost text,
  card_power text,
  life text,
  counter_amount integer,
  attribute text,
  sub_types text,
  card_text text,
  card_image text not null,
  card_image_id text not null,
  market_price numeric(10, 2),
  inventory_price numeric(10, 2),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for frequent queries
create index idx_cards_set_id on public.cards(set_id);
create index idx_cards_card_name on public.cards(card_name);
create index idx_cards_card_type on public.cards(card_type);
create index idx_cards_card_color on public.cards(card_color);
create index idx_cards_rarity on public.cards(rarity);

-- ============================================
-- PRICE HISTORY TABLE
-- ============================================
create table public.price_history (
  id uuid default gen_random_uuid() primary key,
  card_id uuid not null references public.cards(id) on delete cascade,
  market_price numeric(10, 2),
  inventory_price numeric(10, 2),
  recorded_at timestamptz default now() not null
);

-- Index for querying price history
create index idx_price_history_card_id on public.price_history(card_id);
create index idx_price_history_recorded_at on public.price_history(recorded_at);

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  is_premium boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- COLLECTION ENTRIES TABLE
-- ============================================
create table public.collection_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  quantity integer default 1 not null check (quantity > 0),
  condition text default 'Near Mint' not null,
  purchase_price numeric(10, 2),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Prevent duplicate entries for same card/user/condition
  unique(user_id, card_id, condition)
);

-- Indexes for collection queries
create index idx_collection_user_id on public.collection_entries(user_id);
create index idx_collection_card_id on public.collection_entries(card_id);

-- ============================================
-- SYNC LOGS TABLE
-- ============================================
create table public.sync_logs (
  id uuid default gen_random_uuid() primary key,
  sync_type text not null,
  status text default 'pending' not null,
  cards_synced integer,
  sets_synced integer,
  error_message text,
  started_at timestamptz default now() not null,
  completed_at timestamptz
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_sets_updated_at
  before update on public.sets
  for each row execute function public.handle_updated_at();

create trigger handle_cards_updated_at
  before update on public.cards
  for each row execute function public.handle_updated_at();

create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger handle_collection_updated_at
  before update on public.collection_entries
  for each row execute function public.handle_updated_at();

-- ============================================
-- AUTO-CREATE USER PROFILE TRIGGER
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Sets: Public read access
alter table public.sets enable row level security;

create policy "Sets are viewable by everyone"
  on public.sets for select
  using (true);

-- Cards: Public read access
alter table public.cards enable row level security;

create policy "Cards are viewable by everyone"
  on public.cards for select
  using (true);

-- Price History: Public read access
alter table public.price_history enable row level security;

create policy "Price history is viewable by everyone"
  on public.price_history for select
  using (true);

-- Users: Users can only see and update their own profile
alter table public.users enable row level security;

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Collection Entries: Users can only manage their own collection
alter table public.collection_entries enable row level security;

create policy "Users can view their own collection"
  on public.collection_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own collection"
  on public.collection_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collection entries"
  on public.collection_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collection entries"
  on public.collection_entries for delete
  using (auth.uid() = user_id);

-- Sync Logs: No public access (service role only)
alter table public.sync_logs enable row level security;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Public tables (read-only for anon)
grant select on public.sets to anon, authenticated;
grant select on public.cards to anon, authenticated;
grant select on public.price_history to anon, authenticated;

-- User tables (authenticated only)
grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.collection_entries to authenticated;

-- Service role has full access via RLS bypass
