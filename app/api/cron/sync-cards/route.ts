import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// TODO only the prices will change frequently, so we could split this into two separate cron jobs: one for cards data (weekly) and one for prices (daily). The cards data job would only update the cards table if there are changes, and the prices job would only update the price fields + price_history. This would reduce load and risk of conflicts on the cards table. For now we'll keep it simple with one full sync job.

// ─── Constants ───────────────────────────────────────────────────────────────

const OPTCG_API_URL = process.env.NEXT_PUBLIC_OPTCG_API_URL!;
const APITCG_BASE_URL =
  "https://raw.githubusercontent.com/apitcg/one-piece-tcg-data/main/cards/en";

/** Maps each apitcg JSON file to its set_id. null = derive from card id. */
const APITCG_FILES: Record<string, string | null> = {
  "op01.json": "OP-01",
  "op02.json": "OP-02",
  "op03.json": "OP-03",
  "op04.json": "OP-04",
  "op05.json": "OP-05",
  "op06.json": "OP-06",
  "op07.json": "OP-07",
  "op08.json": "OP-08",
  "op09.json": "OP-09",
  "op10.json": "OP-10",
  "op11.json": "OP-11",
  "op12.json": "OP-12",
  "st13.json": "ST-13",
  "st14.json": "ST-14",
  "st15.json": "ST-15",
  "st16.json": "ST-16",
  "st17.json": "ST-17",
  "st18.json": "ST-18",
  "st19.json": "ST-19",
  "st20.json": "ST-20",
  "st21.json": "ST-21",
  "st23.json": "ST-23",
  "st24.json": "ST-24",
  "st25.json": "ST-25",
  "st26.json": "ST-26",
  "st27.json": "ST-27",
  "st28.json": "ST-28",
  "eb01.json": "EB-01",
  "eb02.json": "EB-02",
  "prb01.json": "PRB-01",
  "general.json": null, // ST-01 through ST-12; derive set_id from card id
  "promotions.json": null, // promos; derive set_id from card id
};

const BATCH_SIZE = 500;
const CONCURRENT_FETCH_LIMIT = 5;

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ApitcgCard {
  id: string;
  code: string;
  rarity: string;
  type: string;
  name: string;
  images: { small: string; large: string };
  cost: number;
  attribute: { name: string; image: string };
  power: number;
  counter: string;
  color: string;
  family: string;
  ability: string;
  trigger: string;
  set: { name: string };
  notes: { name: string; url: string }[];
}

interface OptcgApiCard {
  inventory_price: number;
  market_price: number;
  card_name: string;
  set_name: string;
  card_text: string;
  set_id: string;
  rarity: string;
  card_set_id: string;
  card_color: string;
  card_type: string;
  life: string;
  card_cost: string;
  card_power: string;
  sub_types: string;
  counter_amount: number;
  attribute: string;
  card_image_id: string;
  card_image: string;
}

interface DbCard {
  card_set_id: string;
  card_image_id: string;
  set_id: string;
  card_name: string;
  card_type: string;
  card_color: string;
  rarity: string;
  card_cost: string | null;
  card_power: string | null;
  life: string | null;
  counter_amount: number | null;
  attribute: string | null;
  sub_types: string | null;
  card_text: string | null;
  card_image: string;
  market_price?: number | null;
  inventory_price?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  delayMs = 2000,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url);
    if (response.ok || attempt === maxRetries) {
      return response;
    }
    console.log(
      `Fetch ${url} failed with ${response.status}, retrying (${attempt}/${maxRetries})...`,
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

/** Derive set_id from a card id like "ST01-001" → "ST-01", "P-001" → "P", "OP01-001_p1" → "OP-01" */
function deriveSetIdFromCardId(cardId: string): string {
  // P-XXX promos
  if (cardId.startsWith("P-")) return "P";
  // Match patterns like OP01, ST01, EB01, PRB01
  const match = cardId.match(/^(OP|ST|EB|PRB)(\d+)/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, "0")}`;
  }
  return "UNKNOWN";
}

/** Normalize type: "CHARACTER" → "Character", "LEADER" → "Leader", etc. */
function normalizeType(type: string): string {
  if (!type) return type;
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/** Combine ability + trigger into card_text, stripping <br> tags */
function buildCardText(ability: string, trigger: string): string | null {
  const parts: string[] = [];
  if (ability) parts.push(ability.replace(/<br\s*\/?>/gi, "\n"));
  if (trigger) parts.push(trigger.replace(/<br\s*\/?>/gi, "\n"));
  return parts.length > 0 ? parts.join("\n") : null;
}

/** Normalize optcgapi set_ids: "OP09" → "OP-09", "ST01" → "ST-01", etc. */
function normalizeOptcgSetId(setId: string): string {
  return setId.replace(/^(OP|ST|EB|PRB)(\d)/, "$1-$2");
}

/** Transform an apitcg card into a DB card shape */
function transformApitcgCard(
  card: ApitcgCard,
  fileSetId: string | null,
): DbCard {
  const setId = fileSetId ?? deriveSetIdFromCardId(card.id);
  const isLeader = card.type === "LEADER";

  return {
    card_set_id: card.id,
    card_image_id: card.id,
    set_id: setId,
    card_name: card.name,
    card_type: normalizeType(card.type),
    card_color: card.color,
    rarity: card.rarity,
    card_cost: isLeader ? null : (card.cost?.toString() ?? null),
    card_power: card.power?.toString() ?? null,
    life: isLeader ? (card.cost?.toString() ?? null) : null,
    counter_amount:
      card.counter && card.counter !== "-" ? parseInt(card.counter, 10) : null,
    attribute: card.attribute?.name ?? null,
    sub_types: card.family || null,
    card_text: buildCardText(card.ability, card.trigger),
    card_image: card.images.large,
  };
}

/** Transform an optcgapi card into a DB card shape */
function transformOptcgCard(card: OptcgApiCard): DbCard {
  return {
    card_set_id: card.card_set_id,
    card_image_id: card.card_image_id,
    set_id: normalizeOptcgSetId(card.set_id),
    card_name: card.card_name,
    card_type: card.card_type,
    card_color: card.card_color,
    rarity: card.rarity,
    card_cost: card.card_cost || null,
    card_power: card.card_power || null,
    life: card.life || null,
    counter_amount: card.counter_amount || null,
    attribute: card.attribute || null,
    sub_types: card.sub_types || null,
    card_text: card.card_text || null,
    card_image: card.card_image,
    market_price: card.market_price || null,
    inventory_price: card.inventory_price || null,
  };
}

/** Fetch URLs with concurrency limit */
async function fetchConcurrent<T>(
  urls: string[],
  limit: number,
): Promise<(T[] | null)[]> {
  const results: (T[] | null)[] = [];
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const response = await fetchWithRetry(url);
          if (!response.ok) return null;
          return (await response.json()) as T[];
        } catch (err) {
          console.warn(`Failed to fetch ${url}:`, err);
          return null;
        }
      }),
    );
    results.push(...batchResults);
  }
  return results;
}

// ─── Phase 1: Fetch cards from apitcg ────────────────────────────────────────

async function fetchApitcgCards(): Promise<{
  cards: DbCard[];
  setNames: Map<string, string>;
}> {
  const fileEntries = Object.entries(APITCG_FILES);
  const urls = fileEntries.map(([file]) => `${APITCG_BASE_URL}/${file}`);

  console.log(`Fetching ${urls.length} files from apitcg...`);
  const results = await fetchConcurrent<ApitcgCard>(
    urls,
    CONCURRENT_FETCH_LIMIT,
  );

  const cardMap = new Map<string, DbCard>();
  const setNames = new Map<string, string>();
  let totalRaw = 0;

  for (let i = 0; i < fileEntries.length; i++) {
    const [, fileSetId] = fileEntries[i];
    const cards = results[i];
    if (!cards) continue;

    totalRaw += cards.length;
    for (const card of cards) {
      if (!card.id || !card.name || !card.images?.large) continue;

      const dbCard = transformApitcgCard(card, fileSetId);

      // Collect set names from set.name field
      if (card.set?.name) {
        setNames.set(dbCard.set_id, card.set.name);
      }

      // Deduplicate by card_set_id (keep first)
      if (!cardMap.has(dbCard.card_set_id)) {
        cardMap.set(dbCard.card_set_id, dbCard);
      }
    }
  }

  const cards = Array.from(cardMap.values());
  console.log(
    `apitcg: ${cards.length} unique cards from ${totalRaw} raw entries`,
  );
  return { cards, setNames };
}

// ─── Phase 2: Fetch from optcgapi (backup + complement + prices) ─────────────

interface OptcgApiData {
  setCards: OptcgApiCard[];
  deckCards: OptcgApiCard[];
  promoCards: OptcgApiCard[];
}

async function fetchOptcgApiData(): Promise<OptcgApiData> {
  console.log("Fetching from optcgapi...");
  const [setCardsRes, deckCardsRes, promoCardsRes] = await Promise.all([
    fetchWithRetry(`${OPTCG_API_URL}/allSetCards/`),
    fetchWithRetry(`${OPTCG_API_URL}/allSTCards/`),
    fetchWithRetry(`${OPTCG_API_URL}/allPromos/`),
  ]);

  const setCards: OptcgApiCard[] = setCardsRes.ok
    ? await setCardsRes.json()
    : [];
  const deckCards: OptcgApiCard[] = deckCardsRes.ok
    ? await deckCardsRes.json()
    : [];
  const promoCards: OptcgApiCard[] = promoCardsRes.ok
    ? await promoCardsRes.json()
    : [];

  console.log(
    `optcgapi: ${setCards.length} set cards, ${deckCards.length} deck cards, ${promoCards.length} promo cards`,
  );

  return { setCards, deckCards, promoCards };
}

function getOptcgComplementCards(
  optcgData: OptcgApiData,
  apitcgSetIds: Set<string>,
): DbCard[] {
  const allOptcg = [
    ...optcgData.setCards,
    ...optcgData.deckCards,
    ...optcgData.promoCards,
  ];

  const cardMap = new Map<string, DbCard>();
  let skipped = 0;

  for (const card of allOptcg) {
    if (
      !card.card_set_id ||
      !card.card_image ||
      !card.card_image_id ||
      !card.card_name
    ) {
      skipped++;
      continue;
    }

    const dbCard = transformOptcgCard(card);

    // Only keep cards from sets NOT already covered by apitcg
    if (apitcgSetIds.has(dbCard.set_id)) continue;

    if (!cardMap.has(dbCard.card_set_id)) {
      cardMap.set(dbCard.card_set_id, dbCard);
    }
  }

  const cards = Array.from(cardMap.values());
  console.log(
    `optcgapi complement: ${cards.length} cards from sets not in apitcg (skipped ${skipped} invalid)`,
  );
  return cards;
}

function getOptcgFullCards(optcgData: OptcgApiData): DbCard[] {
  const allOptcg = [
    ...optcgData.setCards,
    ...optcgData.deckCards,
    ...optcgData.promoCards,
  ];

  const cardMap = new Map<string, DbCard>();
  let skipped = 0;

  for (const card of allOptcg) {
    if (
      !card.card_set_id ||
      !card.card_image ||
      !card.card_image_id ||
      !card.card_name
    ) {
      skipped++;
      continue;
    }

    const dbCard = transformOptcgCard(card);
    if (!cardMap.has(dbCard.card_set_id)) {
      cardMap.set(dbCard.card_set_id, dbCard);
    }
  }

  const cards = Array.from(cardMap.values());
  console.log(
    `optcgapi fallback: ${cards.length} total cards (skipped ${skipped} invalid)`,
  );
  return cards;
}

// ─── Phase 3: Upsert sets + cards ───────────────────────────────────────────

async function upsertSetsAndCards(
  supabase: ReturnType<typeof getSupabaseClient>,
  cards: DbCard[],
  setNames: Map<string, string>,
) {
  // Collect all unique set_ids from cards
  const setIds = new Set(cards.map((c) => c.set_id));

  // Build set upsert data
  const setsData = Array.from(setIds).map((setId) => ({
    set_id: setId,
    set_name: setNames.get(setId) ?? setId,
  }));

  console.log(`Upserting ${setsData.length} sets...`);
  const { error: setsError } = await supabase
    .from("sets")
    .upsert(setsData, { onConflict: "set_id" });

  if (setsError) {
    throw new Error(`Failed to upsert sets: ${setsError.message}`);
  }

  // Upsert cards in batches
  let totalCards = 0;
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);

    const { error: cardsError } = await supabase.from("cards").upsert(
      batch.map((card) => ({
        card_set_id: card.card_set_id,
        card_image_id: card.card_image_id,
        set_id: card.set_id,
        card_name: card.card_name,
        card_type: card.card_type,
        card_color: card.card_color,
        rarity: card.rarity,
        card_cost: card.card_cost,
        card_power: card.card_power,
        life: card.life,
        counter_amount: card.counter_amount,
        attribute: card.attribute,
        sub_types: card.sub_types,
        card_text: card.card_text,
        card_image: card.card_image,
      })),
      { onConflict: "card_set_id" },
    );

    if (cardsError) {
      throw new Error(
        `Failed to upsert cards batch ${i / BATCH_SIZE + 1}: ${cardsError.message}`,
      );
    }

    totalCards += batch.length;
    console.log(
      `Synced batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalCards}/${cards.length} cards`,
    );
  }

  return { setsCount: setsData.length, cardsCount: totalCards };
}

// ─── Phase 4: Sync prices from optcgapi ─────────────────────────────────────

async function syncPrices(
  supabase: ReturnType<typeof getSupabaseClient>,
  optcgData: OptcgApiData,
) {
  // Build price map from optcgapi data
  const allOptcg = [
    ...optcgData.setCards,
    ...optcgData.deckCards,
    ...optcgData.promoCards,
  ];

  const priceMap = new Map<
    string,
    { market_price: number | null; inventory_price: number | null }
  >();

  for (const card of allOptcg) {
    if (!card.card_set_id) continue;
    const normalizedId = card.card_set_id;
    if (!priceMap.has(normalizedId)) {
      priceMap.set(normalizedId, {
        market_price: card.market_price || null,
        inventory_price: card.inventory_price || null,
      });
    }
  }

  console.log(`Price map: ${priceMap.size} entries`);

  // Fetch all card_set_ids from DB
  const { data: dbCards, error } = await supabase
    .from("cards")
    .select("card_set_id");

  if (error) {
    console.error("Failed to fetch cards for price sync:", error);
    return 0;
  }

  // Match prices: direct match or fallback for alt arts (_p1 → base code)
  const updates: {
    card_set_id: string;
    market_price: number | null;
    inventory_price: number | null;
  }[] = [];

  for (const dbCard of dbCards || []) {
    const cardSetId = dbCard.card_set_id;
    let prices = priceMap.get(cardSetId);

    // Fallback: if card has alt art suffix (_p1, _p2), try base code
    if (!prices && cardSetId.includes("_p")) {
      const baseCode = cardSetId.replace(/_p\d+$/, "");
      prices = priceMap.get(baseCode);
    }

    if (prices && (prices.market_price || prices.inventory_price)) {
      updates.push({ card_set_id: cardSetId, ...prices });
    }
  }

  console.log(`Updating prices for ${updates.length} cards...`);

  // Batch update prices
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const { error: updateError } = await supabase.from("cards").upsert(
      batch.map((u) => ({
        card_set_id: u.card_set_id,
        market_price: u.market_price,
        inventory_price: u.inventory_price,
      })),
      { onConflict: "card_set_id" },
    );

    if (updateError) {
      console.error(`Failed to update price batch:`, updateError);
    }
  }

  return updates.length;
}

// ─── Phase 5: Record price history (unchanged) ──────────────────────────────

async function recordPriceHistory(
  supabase: ReturnType<typeof getSupabaseClient>,
) {
  const { data: cardsWithPrices, error } = await supabase
    .from("cards")
    .select("id, market_price, inventory_price")
    .or("market_price.not.is.null,inventory_price.not.is.null");

  if (error) {
    console.error("Failed to fetch cards for price history:", error);
    return 0;
  }

  if (!cardsWithPrices || cardsWithPrices.length === 0) {
    return 0;
  }

  let recordedCount = 0;
  for (let i = 0; i < cardsWithPrices.length; i += BATCH_SIZE) {
    const batch = cardsWithPrices.slice(i, i + BATCH_SIZE);

    const { error: historyError } = await supabase.from("price_history").insert(
      batch.map((card) => ({
        card_id: card.id,
        market_price: card.market_price,
        inventory_price: card.inventory_price,
      })),
    );

    if (historyError) {
      console.error(`Failed to insert price history batch:`, historyError);
    } else {
      recordedCount += batch.length;
    }
  }

  console.log(`Recorded price history for ${recordedCount} cards`);
  return recordedCount;
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = new Date();
  const supabase = getSupabaseClient();

  const { data: syncLog, error: logError } = await supabase
    .from("sync_logs")
    .insert({ sync_type: "full", status: "running" })
    .select()
    .single();

  if (logError) {
    console.error("Failed to create sync log:", logError);
    return NextResponse.json(
      { error: "Failed to start sync" },
      { status: 500 },
    );
  }

  try {
    // Phase 1: Fetch cards from apitcg (primary source)
    console.log("=== Phase 1: Fetching from apitcg ===");
    let apitcgResult: { cards: DbCard[]; setNames: Map<string, string> };
    let apitcgFailed = false;

    try {
      apitcgResult = await fetchApitcgCards();
      if (apitcgResult.cards.length === 0) {
        console.warn("apitcg returned 0 cards, treating as failure");
        apitcgFailed = true;
        apitcgResult = { cards: [], setNames: new Map() };
      }
    } catch (err) {
      console.warn(
        "apitcg fetch failed entirely, falling back to optcgapi:",
        err,
      );
      apitcgFailed = true;
      apitcgResult = { cards: [], setNames: new Map() };
    }

    // Phase 2: Fetch from optcgapi (backup + complement + prices)
    console.log("=== Phase 2: Fetching from optcgapi ===");
    const optcgData = await fetchOptcgApiData();

    // Build final card list
    let allCards: DbCard[];
    const setNames = apitcgResult.setNames;

    if (apitcgFailed) {
      // Full fallback to optcgapi
      console.log("Using optcgapi as full data source");
      allCards = getOptcgFullCards(optcgData);

      // Collect set names from optcgapi
      for (const card of [
        ...optcgData.setCards,
        ...optcgData.deckCards,
        ...optcgData.promoCards,
      ]) {
        if (card.set_id && card.set_name) {
          const normalizedId = normalizeOptcgSetId(card.set_id);
          if (!setNames.has(normalizedId)) {
            setNames.set(normalizedId, card.set_name);
          }
        }
      }
    } else {
      // Merge apitcg cards + optcgapi complement (sets not in apitcg)
      const apitcgSetIds = new Set(apitcgResult.cards.map((c) => c.set_id));
      const complementCards = getOptcgComplementCards(optcgData, apitcgSetIds);

      // Collect set names from optcgapi for complement sets
      for (const card of [
        ...optcgData.setCards,
        ...optcgData.deckCards,
        ...optcgData.promoCards,
      ]) {
        if (card.set_id && card.set_name) {
          const normalizedId = normalizeOptcgSetId(card.set_id);
          if (!setNames.has(normalizedId)) {
            setNames.set(normalizedId, card.set_name);
          }
        }
      }

      allCards = [...apitcgResult.cards, ...complementCards];
      console.log(
        `Combined: ${apitcgResult.cards.length} apitcg + ${complementCards.length} optcgapi complement = ${allCards.length} total`,
      );
    }

    // Phase 3: Upsert sets + cards
    console.log("=== Phase 3: Upserting sets + cards ===");
    const { setsCount, cardsCount } = await upsertSetsAndCards(
      supabase,
      allCards,
      setNames,
    );
    console.log(`Synced ${setsCount} sets, ${cardsCount} cards`);

    // Phase 4: Sync prices from optcgapi
    console.log("=== Phase 4: Syncing prices ===");
    const priceCount = await syncPrices(supabase, optcgData);
    console.log(`Updated ${priceCount} card prices`);

    // Phase 5: Record price history
    console.log("=== Phase 5: Recording price history ===");
    await recordPriceHistory(supabase);

    // Update sync log
    await supabase
      .from("sync_logs")
      .update({
        status: "completed",
        sets_synced: setsCount,
        cards_synced: cardsCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog.id);

    return NextResponse.json({
      success: true,
      sets_synced: setsCount,
      cards_synced: cardsCount,
      prices_updated: priceCount,
      apitcg_primary: !apitcgFailed,
      duration_ms: Date.now() - startTime.getTime(),
    });
  } catch (error) {
    await supabase
      .from("sync_logs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog.id);

    console.error("Sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
