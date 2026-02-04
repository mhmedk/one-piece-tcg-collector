/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCollectionEntrySchema } from "@/lib/schemas/collection";

interface RouteParams {
  params: Promise<{ entryId: string }>;
}

// PATCH /api/collection/[entryId] - Update collection entry
export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { entryId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await (supabase as any)
    .from("collection_entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateCollectionEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity;
  if (parsed.data.condition !== undefined) updateData.condition = parsed.data.condition;
  if (parsed.data.purchasePrice !== undefined) updateData.purchase_price = parsed.data.purchasePrice;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const { data: entry, error: updateError } = await (supabase as any)
    .from("collection_entries")
    .update(updateData)
    .eq("id", entryId)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update entry:", updateError);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }

  return NextResponse.json({ entry });
}

// DELETE /api/collection/[entryId] - Delete collection entry
export async function DELETE(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { entryId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership and delete
  const { error: deleteError } = await (supabase as any)
    .from("collection_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Failed to delete entry:", deleteError);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
