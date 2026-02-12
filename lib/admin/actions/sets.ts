"use server";

import { getAdminUser } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/admin";
import { setSchema, type SetFormData } from "@/lib/schemas/admin/sets";
import { revalidatePath } from "next/cache";

export async function getSets() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("sets")
    .select("*")
    .order("label");

  if (error) throw new Error(error.message);
  return data;
}

export async function getSet(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("sets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createSet(formData: SetFormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = setSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient.from("sets").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/admin/sets");
  return { success: true };
}

export async function updateSet(id: string, formData: SetFormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const parsed = setSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { error } = await adminClient
    .from("sets")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/sets");
  return { success: true };
}

export async function deleteSet(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { error } = await adminClient.from("sets").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/sets");
  return { success: true };
}
