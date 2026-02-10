# One Piece TCG Collector - Technical Specification

## Overview

A web application for browsing, collecting, and managing One Piece Trading Card Game collections with portfolio analytics, deck building, and social sharing features.

---

## Tech Stack

### Core
- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui with Base UI (not Radix)

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/password + OAuth)
- **Data Source**: Vegapull JSON files, imported via manual CLI script (`npm run import-cards`)
- **Image Storage**: Supabase Storage (WebP, converted from PNG at import time via sharp)
- **Image Delivery**: Served directly from Supabase Storage (no Next.js image optimization)

### Data Fetching
- **Server**: React Server Components for page loads
- **Client**: SWR for mutations with optimistic updates

### Forms & Validation
- **Forms**: React Hook Form
- **Validation**: Zod schemas

### Testing
- **Unit/Integration**: Vitest
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
   Supabase DB ◄──── User Collections/Decks
       │
       ▼
   Next.js App ───► Users
```

### Key Architectural Decisions

1. **Manual Data Import**: Card/set data is imported from vegapull JSON files via a CLI script (`scripts/import-cards.ts`). The script deduplicates cards, converts images to WebP, uploads to Supabase Storage, and upserts data into Supabase. Frontend never calls any external API directly.

2. **Price History**: Store prices forever. Display is tiered: free users see 90 days, premium users see full history.

3. **Card Variants**: Initially follow data source structure for variants. Future: treat each variant (alternate art, parallel rares, promos) as separate trackable items.

4. **Images**: Stored in Supabase Storage as WebP (converted from PNG at import time using sharp). Served directly from Supabase Storage with 1-year cache-control headers. Next.js image optimization is disabled (`unoptimized: true`).

---

## Features

### MVP (Phase 1)

#### Browse Cards
- [x] View all cards organized by set
- [ ] Responsive fluid grid layout (auto-columns based on screen width)
- [ ] Card click opens quick-add popover
- [ ] "View details" link to dedicated card page
- [ ] Full-text search across card names and text
- [ ] Advanced filters: type, rarity, cost, power, attribute (AND/OR logic)
- [ ] Instant filtering (no apply button)
- [ ] Smart default sorting (card number in set)
- [ ] Sort options: name, price, rarity, type, date added

#### Collection Management
- [ ] Add cards with rich metadata per physical copy:
  - Condition (mint, near-mint, played, heavily played)
  - Price paid
  - Date acquired
  - Source/notes
- [ ] All metadata fields optional (quick-add with defaults)
- [ ] Track multiple copies of same card separately
- [ ] Edit/delete collection entries
- [ ] DON!! card tracking with different art variations

#### Authentication
- [ ] Email/password registration and login
- [ ] OAuth providers (Google, Discord, etc.)
- [ ] Multi-device sync
- [ ] Full data deletion on account delete

#### Theme
- [ ] System preference detection
- [ ] Manual light/dark toggle
- [ ] Persistent theme preference

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
| label | text | Set label (e.g. "OP01"), nullable |
| name | text | Display name |
| prefix | text | Set prefix, nullable |
| raw_title | text | Original raw title from data source |
| created_at | timestamp | When imported |
| updated_at | timestamp | Last import |

#### `cards`
| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (vegapull card ID) |
| pack_id | text | Foreign key to sets |
| name | text | Card name |
| category | text | Character, Event, Stage, Leader, DON!! |
| rarity | text | C, UC, R, SR, SEC, L, etc. |
| attributes | text[] | Array of attributes (Slash, Strike, Ranged, etc.) |
| types | text[] | Array of card types |
| colors | text[] | Card colors array |
| cost | integer | Cost to play (nullable) |
| power | integer | Power stat (nullable) |
| life | integer | Life (leaders only, nullable) |
| counter | integer | Counter value (nullable) |
| effect | text | Card effect text (nullable) |
| trigger_text | text | Trigger effect text (nullable) |
| img_url | text | Supabase Storage URL (WebP) |
| block_number | integer | Block number (nullable) |
| created_at | timestamp | When imported |
| updated_at | timestamp | Last import |

#### `price_history`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| card_id | text | Foreign key to cards |
| market_price | decimal | Market price (nullable) |
| recorded_at | date | Date of snapshot |

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (Supabase Auth) |
| email | text | User email |
| display_name | text | Display name (nullable) |
| avatar_url | text | Avatar URL (nullable) |
| is_premium | boolean | Premium subscriber |
| created_at | timestamp | Registration date |
| updated_at | timestamp | Last updated |

#### `collection_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| card_id | text | Foreign key to cards |
| quantity | integer | Number of copies |
| condition | text | mint, near-mint, played, heavily-played |
| purchase_price | decimal | Purchase price (nullable) |
| notes | text | User notes (nullable) |
| created_at | timestamp | When added |
| updated_at | timestamp | Last updated |

#### `decks` (not yet implemented)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| name | text | Deck name |
| leader_card_id | text | Foreign key to cards |
| share_id | text | Short random ID for sharing |
| is_shared | boolean | Whether shareable link is active |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last modified |

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
| status | text | success, failed, partial |
| cards_synced | integer | Count of cards synced (nullable) |
| sets_synced | integer | Count of sets synced (nullable) |
| started_at | timestamp | Sync start time |
| completed_at | timestamp | Sync end time (nullable) |
| error_message | text | Error details if failed (nullable) |

---

## API Routes (Next.js)

### Public Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/sets` | GET | List all sets (from cache) |
| `/api/sets/[setId]/cards` | GET | Cards in a set (from cache) |
| `/api/cards/[cardId]` | GET | Single card details |
| `/api/cards/search` | GET | Search/filter cards |
| `/api/decks/[shareId]` | GET | View shared deck |

### Protected Routes (Authenticated)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/collection` | GET | User's collection |
| `/api/collection` | POST | Add card to collection |
| `/api/collection/[entryId]` | PATCH | Update collection entry |
| `/api/collection/[entryId]` | DELETE | Remove from collection |
| `/api/decks` | GET | User's decks |
| `/api/decks` | POST | Create deck |
| `/api/decks/[deckId]` | PATCH | Update deck |
| `/api/decks/[deckId]` | DELETE | Delete deck |
| `/api/decks/[deckId]/share` | POST | Generate share link |
| `/api/analytics` | GET | User's analytics data |

### Admin Routes (not yet implemented)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/sync` | POST | Trigger manual sync |
| `/api/admin/sync/status` | GET | Get sync status/logs |

---

## Page Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Homepage with card browser |
| `/sets/[setId]` | Cards filtered by set |
| `/cards/[cardId]` | Card detail page |
| `/deck/[shareId]` | View shared deck (public) |
| `/login` | Authentication page |
| `/register` | Registration page |

### Protected (Authenticated)
| Route | Description |
|-------|-------------|
| `/collection` | User's collection view |
| `/decks` | User's deck list |
| `/decks/[deckId]` | Deck editor |
| `/decks/new` | Create new deck |
| `/analytics` | Analytics dashboard |
| `/settings` | User settings |

### Admin
| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/sync` | Sync management |

---

## UI Components

### Core Components (shadcn/ui + Base UI)
- Button, Input, Select, Checkbox
- Dialog (modal), Popover, Dropdown Menu
- Tabs, Accordion
- Toast notifications
- Form components

### Custom Components
- `CardGrid` - Responsive card display grid
- `CardTile` - Individual card in grid
- `CardPopover` - Quick-add popover on card click
- `CardDetailPage` - Full card information page
- `FilterSidebar` - Search and filter controls
- `SetSelector` - Set filter dropdown/list
- `CollectionEntry` - Card in collection with metadata
- `DeckBuilder` - Deck editing interface
- `DeckValidation` - Real-time deck rule validation
- `PriceChart` - Price history visualization
- `AnalyticsDashboard` - Portfolio metrics display
- `ThemeToggle` - Light/dark mode switch

---

## Admin Panel

### Access Control
- Hardcoded admin email addresses in environment variables
- Check against `ADMIN_EMAILS` env var on protected routes

### Features
- View last sync timestamp
- View sync error logs
- Trigger manual data sync
- View sync history

---

## Error Handling

### Data Import Strategy
- Manual CLI script (`npm run import-cards <vegapull-dir>`) imports card/set data
- Script reads local vegapull JSON files, deduplicates, converts images to WebP, upserts to Supabase
- On failure: script exits with error, existing data remains unchanged
- Frontend always reads from Supabase (never affected by import process)

### User-Facing Errors
- Form validation errors shown inline
- Network errors shown as toast notifications
- Graceful fallbacks where possible

---

## Security Considerations

- All user data protected by Supabase RLS policies
- API routes validate authentication via Supabase Auth
- Admin routes check against hardcoded admin emails
- No sensitive data in client-side code
- HTTPS enforced via Vercel

---

## Performance Optimizations

- Server Components for initial page loads
- SWR for client-side collection data with optimistic updates
- Images served from Supabase Storage with 1-year cache-control headers
- Database indexes on frequently queried columns
- Pagination for large card lists

---

## Mobile Considerations

- PWA-ready (responsive web, installable)
- Mobile-first responsive design
- Touch-friendly UI elements
- Online required (no offline support)

---

## Testing Strategy

### Unit Tests (Vitest)
- Deck validation logic
- Price calculation functions
- Data transformation utilities
- Component unit tests

### Integration Tests
- API route handlers
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

# Admin
ADMIN_EMAILS=admin@example.com,admin2@example.com

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
- Managed via Supabase migrations
- Run migrations before deployment

---

## Development Phases Summary

| Phase | Features | Dependencies |
|-------|----------|--------------|
| **MVP** | Browse, Collection, Auth, Theme | Supabase, shadcn/ui, SWR |
| **Phase 2** | Deck Builder, Sharing, Export | Phase 1 complete |
| **Phase 3** | Analytics Dashboard, Price History | Phase 1 complete |
| **Phase 4** | Premium Tier, Stripe, Email Alerts | Phase 3 complete |

---

*Specification finalized: Interview complete*
