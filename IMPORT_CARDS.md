# Importing Card Data

Card data comes from [vegapull](https://github.com/mhmedk/vegapull), a Rust CLI that scrapes the official [onepiece-cardgame.com](https://en.onepiece-cardgame.com) site. Card data is static (no daily cron needed) — just re-run when new sets release.

## Prerequisites

- [vegapull](https://github.com/mhmedk/vegapull) (`vega` CLI) installed
- Node.js with `tsx` available (`npx tsx`)
- `.env` file with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Step 1: Pull data with vegapull

```bash
# Pull all packs metadata
vega pull -o data packs

# Pull cards for every pack
for pack_id in $(node -e "const p = JSON.parse(require('fs').readFileSync('data/json/packs.json','utf-8')); console.log(Object.keys(p).join(' '))"); do
  vega pull -o data cards "$pack_id"
done
```

### Output structure

Files are stored under `data/json/` (gitignored):

```
data/
├── json/
│   ├── packs.json              # All packs (sets) metadata
│   ├── cards_569001.json       # Cards for pack 569001 (ST-01)
│   ├── cards_569101.json       # Cards for pack 569101 (OP-01)
│   ├── cards_569901.json       # Promo cards
│   └── ...                     # One file per pack
└── vega.meta.toml              # Vegapull metadata
```

- `packs.json` — A map of `{ pack_id: { id, raw_title, title_parts: { prefix, title, label } } }`
- `cards_<pack_id>.json` — An array of card objects with fields: `id`, `pack_id`, `name`, `rarity`, `category`, `colors`, `cost`, `power`, `counter`, `attributes`, `types`, `effect`, `trigger`, `img_full_url`, `block_number`, etc.

## Step 2: Import into Supabase

```bash
# Load env vars if not already in your shell
set -a && source .env && set +a

# Run the import script
npx tsx scripts/import-cards.ts data/json
```

The script:
1. Reads `packs.json` and all `cards_*.json` files from the given directory
2. Deduplicates cards by ID
3. Upserts sets and cards into Supabase in batches of 500

It is **idempotent** — running it again updates existing rows without creating duplicates.

## When to re-run

Re-run both steps whenever new sets or cards are released on the official site. There is no automated sync — this is a manual process.
