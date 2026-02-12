import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Service-role Supabase client that bypasses RLS. Server-only. */
export const adminClient = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  { auth: { persistSession: false } }
);
