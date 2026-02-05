import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_OPTCG_API_URL!;

// Create Supabase client lazily to avoid build-time errors
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface ApiSet {
  set_id: string;
  set_name: string;
}

interface ApiDeck {
  structure_deck_id: string;
  structure_deck_name: string;
}

interface ApiCard {
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
  date_scraped: string;
  card_image_id: string;
  card_image: string;
}

async function syncSets(supabase: ReturnType<typeof getSupabaseClient>) {
  // Fetch all sets from API (note: API requires trailing slash)
  const setsResponse = await fetch(`${API_URL}/allSets/`);
  if (!setsResponse.ok) {
    throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
  }
  const sets: ApiSet[] = await setsResponse.json();

  // Fetch all starter decks from API
  const decksResponse = await fetch(`${API_URL}/allDecks/`);
  if (!decksResponse.ok) {
    throw new Error(`Failed to fetch decks: ${decksResponse.status}`);
  }
  const decks: ApiDeck[] = await decksResponse.json();

  // Map decks to set format
  const deckSets: ApiSet[] = decks.map((deck) => ({
    set_id: deck.structure_deck_id,
    set_name: deck.structure_deck_name,
  }));

  // Combine sets and decks, add promo as a virtual set
  const allSets = [
    ...sets,
    ...deckSets,
    { set_id: "PROMO", set_name: "Promotional Cards" },
  ];

  // Upsert all sets
  const { error: setsError } = await supabase
    .from("sets")
    .upsert(
      allSets.map((set) => ({
        set_id: set.set_id,
        set_name: set.set_name,
      })),
      { onConflict: "set_id" },
    );

  if (setsError) {
    throw new Error(`Failed to upsert sets: ${setsError.message}`);
  }

  return allSets.length;
}

async function syncCards(supabase: ReturnType<typeof getSupabaseClient>) {
  let totalCards = 0;

  // Fetch all set cards at once (more efficient than per-set)
  console.log("Fetching all set cards...");
  const setCardsResponse = await fetch(`${API_URL}/allSetCards/`);
  if (!setCardsResponse.ok) {
    throw new Error(`Failed to fetch set cards: ${setCardsResponse.status}`);
  }
  const setCards: ApiCard[] = await setCardsResponse.json();
  console.log(`Fetched ${setCards.length} set cards`);

  // Fetch all starter deck cards
  console.log("Fetching all starter deck cards...");
  const deckCardsResponse = await fetch(`${API_URL}/allSTCards/`);
  if (!deckCardsResponse.ok) {
    throw new Error(`Failed to fetch deck cards: ${deckCardsResponse.status}`);
  }
  const deckCards: ApiCard[] = await deckCardsResponse.json();
  console.log(`Fetched ${deckCards.length} starter deck cards`);

  // Fetch all promo cards (optional - API may not support this endpoint)
  let promoCardsWithSetId: ApiCard[] = [];
  console.log("Fetching all promo cards...");
  try {
    const promoCardsResponse = await fetch(`${API_URL}/allPromoCards/`);
    if (promoCardsResponse.ok) {
      const promoCards: ApiCard[] = await promoCardsResponse.json();
      promoCardsWithSetId = promoCards.map((card) => ({
        ...card,
        set_id: "PROMO",
      }));
      console.log(`Fetched ${promoCards.length} promo cards`);
    } else {
      console.log("Promo cards endpoint not available, skipping...");
    }
  } catch (error) {
    console.log("Failed to fetch promo cards, skipping...", error);
  }

  // Combine all cards, filter invalid ones, and deduplicate by card_set_id
  const allCardsRaw = [...setCards, ...deckCards, ...promoCardsWithSetId];
  const cardMap = new Map<string, ApiCard>();
  let skippedCount = 0;

  for (const card of allCardsRaw) {
    // Skip cards missing required fields
    if (!card.card_set_id || !card.card_image || !card.card_image_id || !card.card_name) {
      skippedCount++;
      continue;
    }
    // Keep the first occurrence
    if (!cardMap.has(card.card_set_id)) {
      cardMap.set(card.card_set_id, card);
    }
  }
  const allCards = Array.from(cardMap.values());
  console.log(`Total cards to sync: ${allCards.length} (deduplicated from ${allCardsRaw.length}, skipped ${skippedCount} invalid)`);

  // Extract unique set_ids from cards and create any missing sets
  const cardSetIds = new Set(allCards.map((card) => card.set_id));
  const { data: existingSets } = await supabase.from("sets").select("set_id");
  const existingSetIds = new Set(existingSets?.map((s) => s.set_id) || []);

  const missingSets = Array.from(cardSetIds).filter((id) => !existingSetIds.has(id));
  if (missingSets.length > 0) {
    console.log(`Creating ${missingSets.length} missing sets: ${missingSets.join(", ")}`);
    const { error: missingSetsError } = await supabase
      .from("sets")
      .upsert(
        missingSets.map((setId) => ({
          set_id: setId,
          set_name: setId, // Use set_id as name since we don't have the proper name
        })),
        { onConflict: "set_id" },
      );
    if (missingSetsError) {
      console.error("Failed to create missing sets:", missingSetsError);
    }
  }

  // Upsert cards in batches of 500 to avoid payload limits
  const BATCH_SIZE = 500;
  for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
    const batch = allCards.slice(i, i + BATCH_SIZE);

    const { error: cardsError } = await supabase
      .from("cards")
      .upsert(
        batch.map((card) => ({
          card_set_id: card.card_set_id,
          set_id: card.set_id,
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
          card_image_id: card.card_image_id,
          market_price: card.market_price || null,
          inventory_price: card.inventory_price || null,
        })),
        { onConflict: "card_set_id" },
      );

    if (cardsError) {
      console.error(`Failed to upsert cards batch ${i / BATCH_SIZE + 1}:`, cardsError);
      throw new Error(`Failed to upsert cards: ${cardsError.message}`);
    }

    totalCards += batch.length;
    console.log(`Synced batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalCards}/${allCards.length} cards`);
  }

  return totalCards;
}

async function recordPriceHistory(supabase: ReturnType<typeof getSupabaseClient>) {
  // Get all cards with prices from database
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

  // Insert price history in batches
  const BATCH_SIZE = 500;
  let recordedCount = 0;

  for (let i = 0; i < cardsWithPrices.length; i += BATCH_SIZE) {
    const batch = cardsWithPrices.slice(i, i + BATCH_SIZE);

    const { error: historyError } = await supabase
      .from("price_history")
      .insert(
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

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = new Date();
  const supabase = getSupabaseClient();

  // Create sync log entry
  const { data: syncLog, error: logError } = await supabase
    .from("sync_logs")
    .insert({
      sync_type: "full",
      status: "running",
    })
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
    // Sync sets (including starter decks and promo)
    console.log("Syncing sets...");
    const setsCount = await syncSets(supabase);
    console.log(`Synced ${setsCount} sets`);

    // Sync all cards
    console.log("Syncing cards...");
    const cardsCount = await syncCards(supabase);
    console.log(`Synced ${cardsCount} cards`);

    // Record price history
    console.log("Recording price history...");
    await recordPriceHistory(supabase);

    // Update sync log with success
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
      duration_ms: Date.now() - startTime.getTime(),
    });
  } catch (error) {
    // Update sync log with failure
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
