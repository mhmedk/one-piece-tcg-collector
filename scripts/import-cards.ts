import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const BATCH_SIZE = 500;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  return createClient(url, key);
}

// Vegapull packs.json is a map: { [pack_id]: { id, raw_title, title_parts: { prefix, title, label } } }
interface VegapullPack {
  id: string;
  raw_title: string;
  title_parts: {
    prefix: string | null;
    title: string;
    label: string | null;
  };
}

interface VegapullCard {
  id: string;
  pack_id: string;
  name: string;
  rarity: string;
  category: string;
  colors: string[];
  cost: number | null;
  power: number | null;
  counter: number | null;
  life?: number | null;
  attributes: string[];
  types: string[];
  effect: string | null;
  trigger: string | null;
  img_url: string;
  img_full_url: string;
  block_number?: number | null;
}

async function main() {
  const dataDir = process.argv[2];
  if (!dataDir) {
    console.error("Usage: npx tsx scripts/import-cards.ts <vegapull-output-dir>");
    process.exit(1);
  }

  // Read packs.json (map format)
  const packsPath = join(dataDir, "packs.json");
  console.log(`Reading packs from ${packsPath}...`);
  const packsMap: Record<string, VegapullPack> = JSON.parse(readFileSync(packsPath, "utf-8"));
  const packs = Object.values(packsMap);
  console.log(`Found ${packs.length} packs`);

  // Read all cards_*.json files
  const files = readdirSync(dataDir).filter(
    (f) => f.startsWith("cards_") && f.endsWith(".json")
  );
  console.log(`Found ${files.length} card files`);

  const allCards: VegapullCard[] = [];
  for (const file of files) {
    const cards: VegapullCard[] = JSON.parse(
      readFileSync(join(dataDir, file), "utf-8")
    );
    allCards.push(...cards);
  }
  console.log(`Total cards loaded: ${allCards.length}`);

  // Deduplicate cards by id
  const cardMap = new Map<string, VegapullCard>();
  for (const card of allCards) {
    if (!card.id || !card.name) continue;
    if (!cardMap.has(card.id)) {
      cardMap.set(card.id, card);
    }
  }
  const uniqueCards = Array.from(cardMap.values());
  console.log(`Unique cards after dedup: ${uniqueCards.length}`);

  const supabase = getSupabaseClient();

  // Transform packs → sets rows using title_parts
  const setRows = packs.map((pack) => ({
    id: pack.id,
    label: pack.title_parts.label,
    name: pack.title_parts.title,
    prefix: pack.title_parts.prefix,
    raw_title: pack.raw_title,
  }));

  console.log(`Upserting ${setRows.length} sets...`);
  for (let i = 0; i < setRows.length; i += BATCH_SIZE) {
    const batch = setRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("sets")
      .upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`Failed to upsert sets batch:`, error);
      process.exit(1);
    }
  }
  console.log(`Sets upserted successfully`);

  // Transform and upsert cards — use img_full_url, normalize effect
  const cardRows = uniqueCards.map((card) => ({
    id: card.id,
    pack_id: card.pack_id,
    name: card.name,
    rarity: card.rarity,
    category: card.category,
    colors: card.colors,
    cost: card.cost,
    power: card.power,
    counter: card.counter,
    life: card.life ?? null,
    attributes: card.attributes,
    types: card.types,
    effect: card.effect === "-" ? null : card.effect,
    trigger_text: card.trigger,
    img_url: card.img_full_url,
    block_number: card.block_number ?? null,
  }));

  console.log(`Upserting ${cardRows.length} cards...`);
  for (let i = 0; i < cardRows.length; i += BATCH_SIZE) {
    const batch = cardRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("cards")
      .upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(
        `Failed to upsert cards batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );
      process.exit(1);
    }
    console.log(
      `Cards batch ${Math.floor(i / BATCH_SIZE) + 1}: ${Math.min(i + BATCH_SIZE, cardRows.length)}/${cardRows.length}`
    );
  }

  console.log(`\nImport complete: ${setRows.length} sets, ${cardRows.length} cards`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
