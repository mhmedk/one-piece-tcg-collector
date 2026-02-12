"use server";

import { getAdminUser } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/admin";
import { cardSchema, type CardFormData } from "@/lib/schemas/admin/cards";
import { revalidatePath } from "next/cache";

export async function getCards() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("cards")
    .select("*")
    .order("id");

  if (error) throw new Error(error.message);
  return data;
}

export async function getCard(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCard(formData: CardFormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = cardSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient.from("cards").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/cards");
  return { success: true };
}

export async function updateCard(id: string, formData: CardFormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = cardSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient
    .from("cards")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/cards");
  return { success: true };
}

export async function deleteCard(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { error } = await adminClient.from("cards").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/cards");
  return { success: true };
}
