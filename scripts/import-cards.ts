import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const BATCH_SIZE = 500;
const STORAGE_BUCKET = "card-images";
const STORAGE_BASE_URL = "https://splzhikuvhxalnttksqz.supabase.co/storage/v1/object/public/card-images";
const IMAGE_CONCURRENCY = 10;
const WEBP_QUALITY = 80;

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

function getWebpFilename(imgFullUrl: string): string {
  return imgFullUrl.split("/").pop()!.split("?")[0].replace(".png", ".webp");
}

async function uploadMissingImages(
  supabase: ReturnType<typeof getSupabaseClient>,
  cards: VegapullCard[]
) {
  // List existing files in the bucket
  const existingFiles = new Set<string>();
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list("", { limit: 1000, offset });
    if (error) {
      console.error("Failed to list storage files:", error);
      break;
    }
    if (!data || data.length === 0) break;
    for (const file of data) existingFiles.add(file.name);
    offset += data.length;
  }
  console.log(`Existing images in storage: ${existingFiles.size}`);

  // Find cards whose image is not yet uploaded
  const missing = cards.filter(
    (card) => !existingFiles.has(getWebpFilename(card.img_full_url))
  );
  if (missing.length === 0) {
    console.log("All card images already in storage, skipping upload.");
    return;
  }
  console.log(`Uploading ${missing.length} missing card images...`);

  let done = 0;
  let errors = 0;
  const queue = [...missing];

  async function worker() {
    while (queue.length > 0) {
      const card = queue.shift()!;
      const filename = getWebpFilename(card.img_full_url);
      try {
        const res = await fetch(card.img_full_url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const pngBuffer = Buffer.from(await res.arrayBuffer());
        const webpBuffer = await sharp(pngBuffer)
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();

        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filename, webpBuffer, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });
        if (error) throw error;
      } catch (err) {
        console.error(`  Failed: ${filename} - ${err}`);
        errors++;
      }
      done++;
      if (done % 50 === 0 || done === missing.length) {
        console.log(`  Images: ${done}/${missing.length} (${errors} errors)`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: IMAGE_CONCURRENCY }, () => worker())
  );
  console.log(
    `Image upload complete: ${done - errors} uploaded, ${errors} errors`
  );
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

  // Detect combined packs (e.g. "OP14-EB04") and split into separate sets
  // Maps card ID prefix (e.g. "OP14") to the correct set ID
  const COMBINED_LABEL_RE = /^([A-Z]+\d+)-([A-Z]+\d+)$/;
  const cardPrefixToSetId = new Map<string, string>();
  const formatLabel = (raw: string) => raw.replace(/([A-Z]+)(\d+)/, "$1-$2");

  // Name overrides for sub-sets that have their own distinct name
  const SET_NAME_OVERRIDES: Record<string, string> = {
    "EB-04": "EGGHEAD CRISIS",
  };

  // Build a mapping from label prefix (e.g. "OP", "EB") to set prefix ("BOOSTER PACK", "EXTRA BOOSTER")
  // by looking at existing non-combined packs
  const labelPrefixToSetPrefix = new Map<string, string>();
  for (const pack of packs) {
    const label = pack.title_parts.label;
    if (!label || COMBINED_LABEL_RE.test(label)) continue;
    const letterPrefix = label.replace(/-?\d+$/, ""); // "OP-01" → "OP"
    if (pack.title_parts.prefix && !labelPrefixToSetPrefix.has(letterPrefix)) {
      labelPrefixToSetPrefix.set(letterPrefix, pack.title_parts.prefix);
    }
  }

  const setRows: { id: string; label: string | null; name: string; prefix: string | null; raw_title: string }[] = [];

  for (const pack of packs) {
    const label = pack.title_parts.label;
    const match = label?.match(COMBINED_LABEL_RE);

    if (match) {
      const [, prefix1, prefix2] = match;
      const secondaryId = `${pack.id}_${prefix2.toLowerCase()}`;
      const letters1 = prefix1.replace(/\d+$/, ""); // "OP14" → "OP"
      const letters2 = prefix2.replace(/\d+$/, ""); // "EB04" → "EB"

      const label1 = formatLabel(prefix1);
      const label2 = formatLabel(prefix2);

      // Primary sub-set keeps the original pack ID
      setRows.push({
        id: pack.id,
        label: label1,
        name: SET_NAME_OVERRIDES[label1] ?? pack.title_parts.title,
        prefix: labelPrefixToSetPrefix.get(letters1) ?? pack.title_parts.prefix,
        raw_title: pack.raw_title,
      });
      // Secondary sub-set gets a derived ID
      setRows.push({
        id: secondaryId,
        label: label2,
        name: SET_NAME_OVERRIDES[label2] ?? pack.title_parts.title,
        prefix: labelPrefixToSetPrefix.get(letters2) ?? pack.title_parts.prefix,
        raw_title: pack.raw_title,
      });

      cardPrefixToSetId.set(prefix1, pack.id);
      cardPrefixToSetId.set(prefix2, secondaryId);
      console.log(`Split combined pack ${label} → ${formatLabel(prefix1)} (${pack.id}, ${labelPrefixToSetPrefix.get(letters1)}) + ${formatLabel(prefix2)} (${secondaryId}, ${labelPrefixToSetPrefix.get(letters2)})`);
    } else {
      setRows.push({
        id: pack.id,
        label: pack.title_parts.label,
        name: pack.title_parts.title,
        prefix: pack.title_parts.prefix,
        raw_title: pack.raw_title,
      });
    }
  }

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

  // Upload missing card images to Supabase Storage
  await uploadMissingImages(supabase, uniqueCards);

  // Transform and upsert cards — use img_full_url, normalize effect
  // For cards in split packs, override pack_id based on card ID prefix
  // Some cards have IDs from other sets but belong to a specific split sub-set
  const CARD_PACK_OVERRIDES: Record<string, string> = {
    "EB01-023_p1": "569114_eb04", // Alternate art reprint included in EB-04
  };

  const getPackId = (card: VegapullCard): string => {
    if (CARD_PACK_OVERRIDES[card.id]) return CARD_PACK_OVERRIDES[card.id];
    const prefix = card.id.split("-")[0];
    return cardPrefixToSetId.get(prefix) ?? card.pack_id;
  };

  const cardRows = uniqueCards.map((card) => ({
    id: card.id,
    pack_id: getPackId(card),
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
    img_url: `${STORAGE_BASE_URL}/${getWebpFilename(card.img_full_url)}`,
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

  // Trigger on-demand revalidation so cached pages reflect new data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (appUrl && revalidationSecret) {
    try {
      const res = await fetch(`${appUrl}/api/revalidate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${revalidationSecret}` },
      });
      const body = await res.json();
      console.log(`Revalidation: ${res.ok ? "success" : "failed"}`, body);
    } catch (err) {
      console.warn("Revalidation request failed (non-blocking):", err);
    }
  } else {
    console.log("Skipping revalidation (NEXT_PUBLIC_APP_URL or REVALIDATION_SECRET not set)");
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
