"use server";

import { getAdminUser } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getSyncLogs() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { data, error } = await adminClient
    .from("sync_logs")
    .select("*")
    .order("started_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSyncLog(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const { error } = await adminClient
    .from("sync_logs")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/sync-logs");
  return { success: true };
}
