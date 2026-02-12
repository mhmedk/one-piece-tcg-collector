"use server";

import { getAdminUser } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/admin";
import {
  collectionEntrySchema,
  type CollectionEntryFormData,
} from "@/lib/schemas/admin/collection-entries";
import { revalidatePath } from "next/cache";

export async function getCollectionEntries() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("collection_entries")
    .select("*, card:cards(name), user:users(email)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCollectionEntry(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("collection_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCollectionEntry(formData: CollectionEntryFormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = collectionEntrySchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient
    .from("collection_entries")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/admin/collection-entries");
  return { success: true };
}

export async function updateCollectionEntry(
  id: string,
  formData: CollectionEntryFormData
) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = collectionEntrySchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient
    .from("collection_entries")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/collection-entries");
  return { success: true };
}

export async function deleteCollectionEntry(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { error } = await adminClient
    .from("collection_entries")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/collection-entries");
  return { success: true };
}
