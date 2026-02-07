/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addToCollectionSchema } from "@/lib/schemas/collection";

// GET /api/collection - List user's collection
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: entries, error } = await (supabase as any)
    .from("collection_entries")
    .select(
      `
      id,
      card_id,
      quantity,
      condition,
      purchase_price,
      notes,
      created_at,
      updated_at,
      card:cards (
        id,
        name,
        img_url,
        rarity,
        pack_id
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch collection:", error);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }

  return NextResponse.json({ entries });
}

// POST /api/collection - Add card to collection
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addToCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { cardId, quantity, condition, purchasePrice, notes } = parsed.data;

  // Verify card exists
  const { data: card, error: cardError } = await (supabase as any)
    .from("cards")
    .select("id")
    .eq("id", cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: "Card not found in database" }, { status: 404 });
  }

  // Check if entry already exists for this card/condition combo
  const { data: existing } = await (supabase as any)
    .from("collection_entries")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .eq("condition", condition)
    .single();

  if (existing) {
    // Update existing entry
    const { data: updated, error: updateError } = await (supabase as any)
      .from("collection_entries")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update collection entry:", updateError);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    return NextResponse.json({ entry: updated, action: "updated" });
  }

  // Create new entry
  const { data: entry, error: insertError } = await (supabase as any)
    .from("collection_entries")
    .insert({
      user_id: user.id,
      card_id: cardId,
      quantity,
      condition,
      purchase_price: purchasePrice || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to add to collection:", insertError);
    return NextResponse.json({ error: "Failed to add to collection" }, { status: 500 });
  }

  return NextResponse.json({ entry, action: "created" }, { status: 201 });
}
