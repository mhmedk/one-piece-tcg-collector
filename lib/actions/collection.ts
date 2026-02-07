/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  addToCollectionSchema,
  updateCollectionEntrySchema,
  type AddToCollectionData,
  type UpdateCollectionEntryData,
} from "@/lib/schemas/collection";

export async function getCollectionEntries() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { entries: [], error: "Unauthorized" };
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
        pack_id,
        colors,
        category
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch collection:", error);
    return { entries: [], error: "Failed to fetch collection" };
  }

  return { entries };
}

export async function addToCollection(data: AddToCollectionData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = addToCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.flatten() };
  }

  const { cardId, quantity, condition, purchasePrice, notes } = parsed.data;

  // Verify card exists
  const { data: card, error: cardError } = await (supabase as any)
    .from("cards")
    .select("id")
    .eq("id", cardId)
    .single();

  if (cardError || !card) {
    return { error: "Card not found in database" };
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
    const { data: updated, error: updateError } = await (supabase as any)
      .from("collection_entries")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update collection entry:", updateError);
      return { error: "Failed to update collection" };
    }

    return { entry: updated, action: "updated" as const };
  }

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
    return { error: "Failed to add to collection" };
  }

  return { entry, action: "created" as const };
}

export async function updateCollectionEntry(
  entryId: string,
  data: UpdateCollectionEntryData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await (supabase as any)
    .from("collection_entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return { error: "Entry not found" };
  }

  const parsed = updateCollectionEntrySchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.flatten() };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity;
  if (parsed.data.condition !== undefined) updateData.condition = parsed.data.condition;
  if (parsed.data.purchasePrice !== undefined)
    updateData.purchase_price = parsed.data.purchasePrice;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const { data: entry, error: updateError } = await (supabase as any)
    .from("collection_entries")
    .update(updateData)
    .eq("id", entryId)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update entry:", updateError);
    return { error: "Failed to update entry" };
  }

  return { entry };
}

export async function deleteCollectionEntry(entryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error: deleteError } = await (supabase as any)
    .from("collection_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Failed to delete entry:", deleteError);
    return { error: "Failed to delete entry" };
  }

  return { success: true };
}
