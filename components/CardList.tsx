import { SearchFilter } from "@/components/SearchFilter";
import { VirtualCardGrid } from "@/components/VirtualCardGrid";
import { createClient } from "@/lib/supabase/server";

interface CardListProps {
  selectedSet: string;
  searchQuery?: string;
  typeFilter?: string;
  colorFilter?: string;
  rarityFilter?: string;
  sortBy?: string;
}

const CardList = async ({
  selectedSet,
  searchQuery,
  typeFilter,
  colorFilter,
  rarityFilter,
  sortBy = "set",
}: CardListProps) => {
  const supabase = await createClient();

  const isAllCards = selectedSet === "all";

  // Resolve set param — could be a label (e.g. "OP-01") or a pack_id (e.g. "569901")
  let resolvedSet: { id: string; label: string | null; name: string } | null = null;

  if (!isAllCards) {
    const { data: byLabel } = await supabase
      .from("sets")
      .select("id, label, name")
      .eq("label", selectedSet)
      .single();

    if (byLabel) {
      resolvedSet = byLabel;
    } else {
      const { data: byId } = await supabase
        .from("sets")
        .select("id, label, name")
        .eq("id", selectedSet)
        .single();
      resolvedSet = byId;
    }
  }

  const packId = resolvedSet?.id;
  const displayName = isAllCards ? "All Cards" : (resolvedSet?.label ?? resolvedSet?.name ?? selectedSet);

  // Build query with filters
  let query = supabase
    .from("cards")
    .select("*, sets(label, prefix)")
    .order("id");

  if (packId) {
    query = query.eq("pack_id", packId);
  }

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%,effect.ilike.%${searchQuery}%`
    );
  }

  if (typeFilter) {
    query = query.eq("category", typeFilter);
  }

  if (colorFilter) {
    query = query.contains("colors", [colorFilter]);
  }

  if (rarityFilter) {
    query = query.eq("rarity", rarityFilter);
  }

  const [{ data: cards }, { data: sets }] = await Promise.all([
    query,
    supabase.from("sets").select("id, label, name, prefix").order("label"),
  ]);

  // Prefix priority: Boosters (OP→EB→PRB) → Decks → Promo → Special
  const PREFIX_ORDER: Record<string, number> = {
    "BOOSTER PACK": 0,
    "EXTRA BOOSTER": 1,
    "PREMIUM BOOSTER": 2,
    "STARTER DECK": 3,
    "STARTER DECK EX": 3,
    "ULTRA DECK": 3,
  };
  // null prefix (promo/special) gets a high number, sorted by set id after

  type SetInfo = { label: string | null; prefix: string | null };
  const getSetInfo = (card: NonNullable<typeof cards>[number]): SetInfo =>
    (card.sets as unknown as SetInfo) ?? { label: null, prefix: null };

  // Sort cards — Special/TreasureRare always last, then apply user sort
  const sortedCards = cards
    ? [...cards].sort((a, b) => {
        const tailOrder: Record<string, number> = { "Special": 1, "TreasureRare": 2 };
        const rarityDiff = (tailOrder[a.rarity] ?? 0) - (tailOrder[b.rarity] ?? 0);
        if (rarityDiff !== 0) return rarityDiff;

        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "cost-asc":
            return (a.cost ?? 0) - (b.cost ?? 0) || a.id.localeCompare(b.id);
          case "cost-desc":
            return (b.cost ?? 0) - (a.cost ?? 0) || a.id.localeCompare(b.id);
          case "power-desc":
            return (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id);
          case "set":
          default: {
            const setA = getSetInfo(a);
            const setB = getSetInfo(b);
            // Sort by category group first (boosters → decks → promo → special)
            const orderA = PREFIX_ORDER[setA.prefix ?? ""] ?? 99;
            const orderB = PREFIX_ORDER[setB.prefix ?? ""] ?? 99;
            if (orderA !== orderB) return orderA - orderB;
            // Within same category group, sort by set label
            const labelDiff = (setA.label ?? "").localeCompare(setB.label ?? "");
            if (labelDiff !== 0) return labelDiff;
            return a.id.localeCompare(b.id);
          }
        }
      })
    : [];

  return (
    <section className="flex-1 py-6 px-4 lg:px-8">
      <div className="mb-6">
        <SearchFilter sets={sets ?? []} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {displayName}{" "}
          <span className="text-muted-foreground">({cards?.length ?? 0} cards)</span>
        </h2>
      </div>

      {!sortedCards || sortedCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No cards found matching your filters.
          </p>
        </div>
      ) : (
        <VirtualCardGrid
          cards={sortedCards}
          from={selectedSet}
        />
      )}
    </section>
  );
};

export default CardList;
