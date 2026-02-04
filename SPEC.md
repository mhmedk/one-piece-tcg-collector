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
- **Data Source**: optcgapi.com API (cached daily)
- **Image Delivery**: CDN proxy/cache (Vercel Edge)

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
- **Cron Jobs**: Vercel Cron (daily data sync)
- **Payments**: Stripe (for premium tier)

---

## Architecture

### Data Flow

```
optcgapi.com API
       │
       ▼ (daily cron job)
   Supabase DB ◄──── User Collections/Decks
       │
       ▼
   Next.js App ───► Users
```

### Key Architectural Decisions

1. **Cached API Data**: Daily Vercel cron job fetches all card/set data from optcgapi.com and stores in Supabase. Frontend never calls external API directly.

2. **Price History**: Store prices from each daily sync forever. Display is tiered: free users see 90 days, premium users see full history.

3. **Card Variants**: Initially follow API structure for variants. Future: treat each variant (alternate art, parallel rares, promos) as separate trackable items.

4. **Images**: Route through Vercel's CDN for caching and optimization. No self-hosted image storage.

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
| id | uuid | Primary key |
| set_id | text | External API ID |
| set_name | text | Display name |
| created_at | timestamp | When synced |
| updated_at | timestamp | Last sync |

#### `cards`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| card_id | text | External API ID |
| set_id | uuid | Foreign key to sets |
| card_name | text | Card name |
| card_type | text | Character, Event, Stage, Leader, DON!! |
| rarity | text | C, UC, R, SR, SEC, L, etc. |
| attribute | text | Slash, Strike, Ranged, etc. |
| card_power | integer | Power stat |
| card_cost | integer | Cost to play |
| life | integer | Life (leaders only) |
| counter_amount | integer | Counter value |
| card_image | text | Image URL |
| colors | text[] | Card colors array |
| card_text | text | Card effect text |
| created_at | timestamp | When synced |
| updated_at | timestamp | Last sync |

#### `price_history`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| card_id | uuid | Foreign key to cards |
| market_price | decimal | Market price |
| inventory_price | decimal | Inventory price |
| recorded_at | date | Date of snapshot |

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (Supabase Auth) |
| email | text | User email |
| is_premium | boolean | Premium subscriber |
| premium_until | timestamp | Subscription end date |
| created_at | timestamp | Registration date |

#### `collection_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| card_id | uuid | Foreign key to cards |
| condition | text | mint, near-mint, played, heavily-played |
| price_paid | decimal | Purchase price (nullable) |
| acquired_at | date | Date acquired (nullable) |
| source | text | Where acquired (nullable) |
| notes | text | User notes (nullable) |
| created_at | timestamp | When added |

#### `decks`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| name | text | Deck name |
| leader_card_id | uuid | Foreign key to cards |
| share_id | text | Short random ID for sharing |
| is_shared | boolean | Whether shareable link is active |
| created_at | timestamp | Creation date |
| updated_at | timestamp | Last modified |

#### `deck_cards`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| deck_id | uuid | Foreign key to decks |
| card_id | uuid | Foreign key to cards |
| quantity | integer | Number of copies (1-4) |

#### `sync_logs`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| started_at | timestamp | Sync start time |
| completed_at | timestamp | Sync end time |
| status | text | success, failed, partial |
| cards_updated | integer | Count of cards updated |
| error_message | text | Error details if failed |

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

### Admin Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/sync` | POST | Trigger manual sync |
| `/api/admin/sync/status` | GET | Get sync status/logs |

### Cron Routes (Vercel Cron)
| Route | Schedule | Description |
|-------|----------|-------------|
| `/api/cron/sync-cards` | Daily | Sync all card data from API |

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

### Data Sync Strategy
- Daily cron fetches from optcgapi.com
- On success: update all card/price data in Supabase
- On failure: log error, keep existing cached data
- Frontend always reads from Supabase (never affected by API downtime)

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
- SWR for client-side data mutations with optimistic updates
- Image optimization via Vercel CDN
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

# External API
OPTCG_API_BASE_URL=https://optcgapi.com

# Admin
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Stripe (Phase 4)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Cron Secret (Vercel)
CRON_SECRET=
```

---

## Deployment

### Vercel Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-cards",
      "schedule": "0 6 * * *"
    }
  ]
}
```

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
