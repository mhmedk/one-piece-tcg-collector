import "server-only";
import { cacheTag } from "next/cache";
import { supabase } from "@/lib/supabase/static";

export async function getSets() {
  "use cache";
  cacheTag("sets");

  const { data } = await supabase
    .from("sets")
    .select("id, label, name, prefix")
    .order("label");

  return data ?? [];
}

export async function resolveSet(selectedSet: string) {
  "use cache";
  cacheTag("sets");

  const { data: byLabel } = await supabase
    .from("sets")
    .select("id, label, name")
    .eq("label", selectedSet)
    .single();

  if (byLabel) return byLabel;

  const { data: byId } = await supabase
    .from("sets")
    .select("id, label, name")
    .eq("id", selectedSet)
    .single();

  return byId;
}

interface GetCardsFilters {
  packId?: string;
  packIds?: string[];
  searchQuery?: string;
  typeFilter?: string;
  colorFilter?: string;
  rarityFilter?: string;
}

const PAGE_SIZE = 1000;

export async function getCards(filters: GetCardsFilters = {}) {
  "use cache";
  cacheTag("cards");

  function buildQuery(from: number, to: number) {
    let query = supabase
      .from("cards")
      .select("*, sets(label, prefix)")
      .order("id")
      .range(from, to);

    if (filters.packIds && filters.packIds.length > 0) {
      query = query.in("pack_id", filters.packIds);
    } else if (filters.packId) {
      query = query.eq("pack_id", filters.packId);
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        [
          `name.ilike.%${q}%`,
          `id.ilike.%${q}%`,
          `effect.ilike.%${q}%`,
          `trigger_text.ilike.%${q}%`,
        ].join(",")
      );
    }

    if (filters.typeFilter) {
      query = query.eq("category", filters.typeFilter);
    }

    if (filters.colorFilter) {
      query = query.contains("colors", [filters.colorFilter]);
    }

    if (filters.rarityFilter) {
      query = query.eq("rarity", filters.rarityFilter);
    }

    return query;
  }

  // Fetch all rows by paginating in batches of PAGE_SIZE
  const allRows: NonNullable<Awaited<ReturnType<typeof buildQuery>>["data"]> = [];
  let offset = 0;

  while (true) {
    const { data } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

export async function getSetIdsByPrefixes(prefixes: string[]) {
  "use cache";
  cacheTag("sets");

  const { data } = await supabase
    .from("sets")
    .select("id")
    .in("prefix", prefixes);

  return data?.map((s) => s.id) ?? [];
}

export async function getCard(cardId: string) {
  "use cache";
  cacheTag("cards");

  const { data } = await supabase
    .from("cards")
    .select("*, sets(id, label, name)")
    .eq("id", cardId)
    .single();

  return data;
}
