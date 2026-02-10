# One Piece TCG Collector - Technical Specification

## Overview

A web application for browsing, collecting, and managing One Piece Trading Card Game collections with portfolio analytics, deck building, and social sharing features.

---

## Tech Stack

### Core
- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix primitives)

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/password + OAuth)
- **Data Source**: Vegapull JSON files, imported via manual CLI script (`npm run import-cards`)
- **Image Storage**: Supabase Storage (WebP, converted from PNG at import time via sharp)
- **Image Delivery**: Served directly from Supabase Storage (no Next.js image optimization)

### Data Fetching
- **Server**: `"use cache"` directive with `cacheTag()` for static data (cards, sets)
- **Client**: SWR for collection mutations with optimistic updates

### Forms & Validation
- **Forms**: React Hook Form
- **Validation**: Zod schemas

### Additional Libraries
- **Virtual Scrolling**: `@tanstack/react-virtual` for large card lists
- **React Compiler**: `babel-plugin-react-compiler` (enabled via `reactCompiler: true` in next.config.ts)
- **Toast Notifications**: `sonner`
- **Theme Management**: `next-themes`

### Testing
- **Unit/Integration**: Vitest (planned, not yet installed)
- **E2E**: Deferred (add later when app stabilizes)

### Infrastructure
- **Hosting**: Vercel (free tier to start)
- **Payments**: Stripe (for premium tier, future)

---

## Architecture

### Data Flow

```
Vegapull JSON files (local)
       │
       ▼ (manual CLI: npm run import-cards)
   Supabase DB ◄──── User Collections (via Server Actions)
       │
       ▼
   "use cache" data functions (lib/data.ts)
       │
       ▼
   Next.js App (Server Components) ───► Users
```

### Caching Strategy

- **`"use cache"` directive**: Applied to data-fetching functions in `lib/data.ts` for cards and sets
- **`cacheTag()`**: Tags cache entries (`"cards"`, `"sets"`) for targeted invalidation
- **On-demand revalidation**: `/api/revalidate` endpoint accepts a `REVALIDATION_SECRET` and calls `revalidateTag()` to bust cache after data imports
- **`cacheComponents: true`**: Enabled in `next.config.ts` for component-level caching

### Key Architectural Decisions

1. **Manual Data Import**: Card/set data is imported from vegapull JSON files via a CLI script (`scripts/import-cards.ts`). The script deduplicates cards, converts images to WebP, uploads to Supabase Storage, and upserts data into Supabase. Frontend never calls any external API directly.

2. **Server Actions for Mutations**: All collection mutations (add, update, delete) use React Server Actions (`lib/actions/collection.ts`) instead of REST API routes. Server Actions handle authentication, validation (Zod), and database operations in a single function.

3. **`"use cache"` for Data Fetching**: Public data (cards, sets) is fetched via functions with the `"use cache"` directive and `cacheTag()`, providing static-like performance with on-demand revalidation. No REST API routes needed for reads.

4. **Price History**: Store prices forever. Display is tiered: free users see 90 days, premium users see full history.

5. **Card Variants**: Initially follow data source structure for variants. Future: treat each variant (alternate art, parallel rares, promos) as separate trackable items.

6. **Images**: Stored in Supabase Storage as WebP (converted from PNG at import time using sharp). Served directly from Supabase Storage with 1-year cache-control headers. Next.js image optimization is disabled (`unoptimized: true`).

---

## Features

### MVP (Phase 1)

#### Browse Cards
- [x] View all cards organized by set
- [x] Responsive fluid grid layout with virtual scrolling (`@tanstack/react-virtual`)
- [x] Card click opens quick-add dialog
- [x] "View details" link to dedicated card page
- [x] Full-text search across card names, IDs, and effect text
- [x] Filters: type (category), color, rarity
- [x] Instant filtering (no apply button)
- [x] Smart default sorting (card ID order)
- [ ] Sort options: name, price, rarity, type, date added

#### Collection Management
- [x] Add cards with metadata per physical copy:
  - Condition (Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged)
  - Purchase price
  - Notes
- [x] All metadata fields optional (quick-add with defaults)
- [x] Track multiple copies of same card (aggregated by condition)
- [x] Edit/delete collection entries
- [ ] DON!! card tracking with different art variations

#### Authentication
- [x] Email/password registration and login
- [x] Google OAuth
- [ ] Discord OAuth
- [ ] Multi-device sync
- [ ] Full data deletion on account delete

#### Theme
- [x] System preference detection
- [x] Manual light/dark toggle
- [x] Persistent theme preference

### Phase 2: Deck Builder

#### Deck Creation
- [ ] Create and save multiple decks
- [ ] Assign leader card (determines valid colors)
- [ ] Add cards from any set (not limited to owned cards)
- [ ] Visual ownership indicator (show which cards you own/need)
- [ ] DON!! card selection with variant tracking

#### Validation (Strict)
- [ ] 50-card deck requirement
- [ ] 4-copy limit per card
- [ ] Leader color restrictions enforced
- [ ] 10 DON!! cards required
- [ ] Real-time validation feedback

#### Sharing
- [ ] Generate shareable links (random short IDs: `/deck/abc123`)
- [ ] Links expire only when user deletes deck
- [ ] Direct links only (no public discovery/browsing)

#### Export
- [ ] JSON export for backup
- [ ] CSV export for spreadsheets

### Phase 3: Analytics Dashboard

#### Portfolio Metrics
- [ ] Total collection value
- [ ] Value breakdown by set
- [ ] Value over time chart
- [ ] Rarity distribution
- [ ] Most valuable cards list
- [ ] Price change indicators

#### Price History
- [ ] Daily price snapshots stored forever
- [ ] Free tier: 90-day chart view
- [ ] Premium tier: Full history access

#### UI
- [ ] Dedicated `/analytics` route
- [ ] Charts using Recharts (or similar)

### Phase 4: Premium Features

#### Tier Structure (Feature-gated, not usage-gated)
- **Free**: Unlimited collection, unlimited decks, 90-day analytics
- **Premium**: Full price history, email price alerts, detailed analytics

#### Premium Features
- [ ] Email notifications for price alerts
- [ ] Full price history access
- [ ] Advanced analytics dashboards
- [ ] Priority support

#### Payments
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Billing portal

### Future Considerations (Not in Initial Roadmap)

- **Wishlist**: Auto-generate from cards needed for decks, price alerts
- **Multi-language**: Interface and card data in multiple languages
- **Barcode Scanner**: Camera-based card entry
- **Social Features**: Comments, likes, follows (currently: no social features planned)

---

## Data Models

### Database Schema (Supabase)

#### `sets`
| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (vegapull pack ID) |
| label | text | Set label (e.g. "OP01"), unique, nullable |
| name | text | Display name |
| prefix | text | Set prefix (e.g. "BOOSTER PACK"), nullable |
| raw_title | text | Original raw title from data source |
| created_at | timestamptz | When imported |
| updated_at | timestamptz | Last import |

#### `cards`
| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (card ID e.g. "ST01-001") |
| pack_id | text | Foreign key to sets |
| name | text | Card name |
| category | text | Leader, Character, Event, Stage |
| rarity | text | Common, SuperRare, Leader, etc. |
| colors | text[] | Card colors array |
| cost | integer | Cost to play (nullable) |
| power | integer | Power stat (nullable) |
| life | integer | Life (leaders only, nullable) |
| counter | integer | Counter value (nullable) |
| attributes | text[] | Array of attributes (Slash, Strike, Ranged, etc.) |
| types | text[] | Array of card types |
| effect | text | Card effect text (nullable, may contain `<br>` tags) |
| trigger_text | text | Trigger effect text (nullable) |
| img_url | text | Supabase Storage URL (WebP) |
| block_number | integer | Block number (nullable) |
| created_at | timestamptz | When imported |
| updated_at | timestamptz | Last import |

#### `collection_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| card_id | text | Foreign key to cards |
| quantity | integer | Number of copies (default 1, must be > 0) |
| condition | text | Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged |
| purchase_price | numeric(10,2) | Purchase price (nullable) |
| notes | text | User notes (nullable) |
| created_at | timestamptz | When added |
| updated_at | timestamptz | Last updated |

**Unique constraint**: `(user_id, card_id, condition)` — prevents duplicate entries for the same card/user/condition combo. Adding a card with the same condition increments quantity instead.

#### `price_history`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| card_id | text | Foreign key to cards |
| market_price | numeric(10,2) | Market price (nullable) |
| recorded_at | timestamptz | Date of snapshot |

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (Supabase Auth) |
| email | text | User email |
| display_name | text | Display name (nullable) |
| avatar_url | text | Avatar URL (nullable) |
| is_premium | boolean | Premium subscriber |
| created_at | timestamptz | Registration date |
| updated_at | timestamptz | Last updated |

Auto-created via trigger on `auth.users` insert.

#### `decks` (not yet implemented)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| name | text | Deck name |
| leader_card_id | text | Foreign key to cards |
| share_id | text | Short random ID for sharing |
| is_shared | boolean | Whether shareable link is active |
| created_at | timestamptz | Creation date |
| updated_at | timestamptz | Last modified |

#### `deck_cards` (not yet implemented)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| deck_id | uuid | Foreign key to decks |
| card_id | text | Foreign key to cards |
| quantity | integer | Number of copies (1-4) |

#### `sync_logs`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sync_type | text | Type of sync operation |
| status | text | pending, success, failed |
| cards_synced | integer | Count of cards synced (nullable) |
| sets_synced | integer | Count of sets synced (nullable) |
| started_at | timestamptz | Sync start time |
| completed_at | timestamptz | Sync end time (nullable) |
| error_message | text | Error details if failed (nullable) |

---

## Server Actions & API Routes

### Server Actions (`lib/actions/collection.ts`)

Collection mutations are handled via React Server Actions:

| Action | Description |
|--------|-------------|
| `getCollectionEntries()` | Fetch authenticated user's collection with card details |
| `addToCollection(data)` | Add card to collection (or increment quantity if same card/condition exists) |
| `updateCollectionEntry(entryId, data)` | Update entry (quantity, condition, price, notes) |
| `deleteCollectionEntry(entryId)` | Remove entry from collection |

All actions validate authentication via `supabase.auth.getUser()` and input via Zod schemas.

### Cached Data Functions (`lib/data.ts`)

Server-side data fetching with `"use cache"` and `cacheTag()`:

| Function | Cache Tag | Description |
|----------|-----------|-------------|
| `getSets()` | `"sets"` | All sets (id, label, name, prefix) |
| `resolveSet(selectedSet)` | `"sets"` | Resolve set by label or ID |
| `getCards(filters)` | `"cards"` | Cards with optional filters (packId, search, type, color, rarity) |
| `getCard(cardId)` | `"cards"` | Single card with set info |

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/revalidate` | POST | On-demand cache revalidation (requires `REVALIDATION_SECRET`) |
| `/api/auth/callback` | GET | Supabase OAuth callback handler |

---

## Page Routes

### Public
| Route | Description | Status |
|-------|-------------|--------|
| `/` | Homepage with card browser (search, filters, virtual grid) | Implemented |
| `/cards/[cardId]` | Card detail page with add-to-collection | Implemented |
| `/(auth)/login` | Login page (email/password + Google OAuth) | Implemented |
| `/(auth)/register` | Registration page | Implemented |

### Protected (Authenticated)
| Route | Description | Status |
|-------|-------------|--------|
| `/collection` | User's collection view with filters | Implemented |
| `/decks` | User's deck list | Not implemented |
| `/decks/[deckId]` | Deck editor | Not implemented |
| `/decks/new` | Create new deck | Not implemented |
| `/analytics` | Analytics dashboard | Not implemented |
| `/settings` | User settings | Not implemented |

---

## UI Components

### Core Components (shadcn/ui + Radix)
- Button, Input, Select, Checkbox, Label
- Dialog, Popover, Dropdown Menu
- Tabs, Card, Badge, Separator
- Skeleton (loading states)
- Alert Dialog
- Avatar
- Form (react-hook-form integration)
- Sonner (toast notifications)

### Custom Components
- `VirtualCardGrid` - Virtual scrolling card grid using `@tanstack/react-virtual`
- `CardTile` - Individual card in grid
- `CardList` - Card list with search/filter integration
- `SearchFilter` - Search input and filter controls
- `CollectionEntryForm` - Form for adding/editing collection entries
- `CollectionEntryCard` - Card display in collection view
- `CollectionCardTile` - Card tile variant for collection
- `CollectionFilters` - Collection-specific filter controls
- `AddToCollectionProvider` - Context provider for add-to-collection dialog state
- `Header` - App header with navigation
- `UserNav` - User menu (avatar, dropdown with logout)
- `ThemeToggle` - Light/dark mode switch
- `ThemeProvider` - Theme context provider (next-themes)

---

## Error Handling

### Data Import Strategy
- Manual CLI script (`npm run import-cards <vegapull-dir>`) imports card/set data
- Script reads local vegapull JSON files, deduplicates, converts images to WebP, upserts to Supabase
- On failure: script exits with error, existing data remains unchanged
- Frontend always reads from Supabase (never affected by import process)

### User-Facing Errors
- Form validation errors shown inline (Zod + react-hook-form)
- Network errors shown as toast notifications (sonner)
- Graceful fallbacks where possible

---

## Security Considerations

- All user data protected by Supabase RLS policies
- Server Actions validate authentication via `supabase.auth.getUser()`
- Revalidation endpoint protected by `REVALIDATION_SECRET`
- No sensitive data in client-side code
- HTTPS enforced via Vercel

---

## Performance Optimizations

- `"use cache"` directive for static data fetching (cards, sets) with cache tags
- On-demand revalidation via `/api/revalidate` (no time-based polling)
- React Compiler enabled (`reactCompiler: true`) for automatic memoization
- `cacheComponents: true` for component-level caching
- Virtual scrolling (`@tanstack/react-virtual`) for large card lists
- SWR for client-side collection data with optimistic updates
- Images served from Supabase Storage with 1-year cache-control headers
- Database indexes on frequently queried columns (including GIN indexes for array columns)

---

## Mobile Considerations

- PWA-ready (responsive web, installable)
- Mobile-first responsive design
- Touch-friendly UI elements
- Online required (no offline support)

---

## Testing Strategy

### Unit Tests (Vitest — planned)
- Deck validation logic
- Price calculation functions
- Data transformation utilities
- Component unit tests

### Integration Tests
- Server Action handlers
- Database operations
- Authentication flows

### E2E Tests (Future)
- Critical user flows when app stabilizes

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Revalidation
REVALIDATION_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (Phase 4)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Deployment

### Vercel Configuration

Currently minimal (`vercel.json` is empty). No cron jobs configured.

### Database Migrations
- Managed via Supabase migrations (`supabase/migrations/`)
- Run migrations before deployment

---

## Development Phases Summary

| Phase | Features | Dependencies |
|-------|----------|--------------|
| **MVP** | Browse, Collection, Auth, Theme | Supabase, shadcn/ui, SWR |
| **Phase 2** | Deck Builder, Sharing, Export | Phase 1 complete |
| **Phase 3** | Analytics Dashboard, Price History | Phase 1 complete |
| **Phase 4** | Premium Tier, Stripe, Email Alerts | Phase 3 complete |
