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

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = new Date();

  // Create sync log entry
  const { data: syncLog, error: logError } = await getSupabaseClient()
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
    // Fetch all sets
    const setsResponse = await fetch(`${API_URL}/sets`);
    if (!setsResponse.ok) {
      throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
    }
    const sets: ApiSet[] = await setsResponse.json();

    // Upsert sets
    const { error: setsError } = await getSupabaseClient()
      .from("sets")
      .upsert(
        sets.map((set) => ({
          set_id: set.set_id,
          set_name: set.set_name,
        })),
        { onConflict: "set_id" },
      );

    if (setsError) {
      throw new Error(`Failed to upsert sets: ${setsError.message}`);
    }

    let totalCardsSynced = 0;

    // Fetch and upsert cards for each set
    for (const set of sets) {
      try {
        const cardsResponse = await fetch(`${API_URL}/cards/${set.set_id}`);
        if (!cardsResponse.ok) {
          console.warn(`Failed to fetch cards for set ${set.set_id}`);
          continue;
        }
        const cards: ApiCard[] = await cardsResponse.json();

        if (cards.length === 0) continue;

        // Upsert cards
        const { error: cardsError } = await getSupabaseClient()
          .from("cards")
          .upsert(
            cards.map((card) => ({
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
          console.error(
            `Failed to upsert cards for set ${set.set_id}:`,
            cardsError,
          );
          continue;
        }

        // Record price history for cards with prices
        const priceHistoryEntries = [];
        for (const card of cards) {
          if (card.market_price || card.inventory_price) {
            // Get the card ID from database
            const { data: dbCard } = await getSupabaseClient()
              .from("cards")
              .select("id")
              .eq("card_set_id", card.card_set_id)
              .single();

            if (dbCard) {
              priceHistoryEntries.push({
                card_id: dbCard.id,
                market_price: card.market_price || null,
                inventory_price: card.inventory_price || null,
              });
            }
          }
        }

        if (priceHistoryEntries.length > 0) {
          await getSupabaseClient()
            .from("price_history")
            .insert(priceHistoryEntries);
        }

        totalCardsSynced += cards.length;
      } catch (error) {
        console.error(`Error syncing set ${set.set_id}:`, error);
      }
    }

    // Update sync log with success
    await getSupabaseClient()
      .from("sync_logs")
      .update({
        status: "completed",
        sets_synced: sets.length,
        cards_synced: totalCardsSynced,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncLog.id);

    return NextResponse.json({
      success: true,
      sets_synced: sets.length,
      cards_synced: totalCardsSynced,
      duration_ms: Date.now() - startTime.getTime(),
    });
  } catch (error) {
    // Update sync log with failure
    await getSupabaseClient()
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
