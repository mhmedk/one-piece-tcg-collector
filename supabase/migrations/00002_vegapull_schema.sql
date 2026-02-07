-- Vegapull Schema Migration
-- Replaces optcgapi.com data model with vegapull-based schema
-- All existing data is dev-only, safe to drop

-- ============================================
-- DROP OLD TABLES (except users)
-- ============================================
drop table if exists public.collection_entries cascade;
drop table if exists public.price_history cascade;
drop table if exists public.sync_logs cascade;
drop table if exists public.cards cascade;
drop table if exists public.sets cascade;

-- Drop old trigger function (will be recreated)
drop function if exists public.handle_updated_at() cascade;

-- ============================================
-- SETS TABLE
-- ============================================
create table public.sets (
  id text primary key,                          -- vegapull pack_id (e.g. "569001")
  label text unique,                            -- "ST-01", "OP-01" (null for promo/other)
  name text not null,                           -- clean title
  prefix text,                                  -- "BOOSTER PACK", "STARTER DECK", etc.
  raw_title text not null,                      -- full original title from vegapull
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- CARDS TABLE
-- ============================================
create table public.cards (
  id text primary key,                          -- card ID "ST01-001"
  pack_id text not null references public.sets(id) on delete cascade,
  name text not null,
  rarity text not null,                         -- "Common", "SuperRare", "Leader", etc.
  category text not null,                       -- "Leader", "Character", "Event", "Stage"
  colors text[] not null,                       -- array for multi-color support
  cost integer,
  power integer,
  counter integer,
  life integer,
  attributes text[] not null,
  types text[] not null,
  effect text,                                  -- card effect text (may contain <br> tags)
  trigger_text text,                            -- trigger effect
  img_url text not null,
  block_number integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for cards
create index idx_cards_pack_id on public.cards(pack_id);
create index idx_cards_name on public.cards(name);
create index idx_cards_category on public.cards(category);
create index idx_cards_rarity on public.cards(rarity);
create index idx_cards_colors on public.cards using gin(colors);
create index idx_cards_types on public.cards using gin(types);

-- ============================================
-- COLLECTION ENTRIES TABLE
-- ============================================
create table public.collection_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.cards(id) on delete cascade,
  quantity integer default 1 not null check (quantity > 0),
  condition text default 'Near Mint' not null,
  purchase_price numeric(10, 2),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, card_id, condition)
);

create index idx_collection_user_id on public.collection_entries(user_id);
create index idx_collection_card_id on public.collection_entries(card_id);

-- ============================================
-- PRICE HISTORY TABLE
-- ============================================
create table public.price_history (
  id uuid default gen_random_uuid() primary key,
  card_id text not null references public.cards(id) on delete cascade,
  market_price numeric(10, 2),
  recorded_at timestamptz default now() not null
);

create index idx_price_history_card_id on public.price_history(card_id);
create index idx_price_history_recorded_at on public.price_history(recorded_at);

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

create trigger handle_collection_updated_at
  before update on public.collection_entries
  for each row execute function public.handle_updated_at();

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

grant select on public.sets to anon, authenticated;
grant select on public.cards to anon, authenticated;
grant select on public.price_history to anon, authenticated;
grant select, insert, update, delete on public.collection_entries to authenticated;
