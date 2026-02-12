"use server";

import { getAdminUser } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/admin";
import {
  priceHistorySchema,
  type PriceHistoryFormData,
} from "@/lib/schemas/admin/price-history";
import { revalidatePath } from "next/cache";

export async function getPriceHistory() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("price_history")
    .select("*, card:cards(name)")
    .order("recorded_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPriceHistoryEntry(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("price_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createPriceHistory(formData: PriceHistoryFormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = priceHistorySchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient
    .from("price_history")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/admin/price-history");
  return { success: true };
}

export async function updatePriceHistory(
  id: string,
  formData: PriceHistoryFormData
) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = priceHistorySchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient
    .from("price_history")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/price-history");
  return { success: true };
}

export async function deletePriceHistory(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { error } = await adminClient
    .from("price_history")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/price-history");
  return { success: true };
}
