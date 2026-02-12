import "server-only";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Gets the current user and verifies they have admin role.
 * Returns the user row if admin, null otherwise.
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await adminClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data || data.role !== "admin") return null;

  return data;
}
