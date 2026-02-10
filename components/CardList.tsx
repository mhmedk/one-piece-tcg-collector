import { SearchFilter } from "@/components/SearchFilter";
import { VirtualCardGrid } from "@/components/VirtualCardGrid";
import { getCards, getSets, resolveSet } from "@/lib/data";

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
  const isAllCards = selectedSet === "all";

  const resolvedSet = isAllCards ? null : await resolveSet(selectedSet);
  const packId = resolvedSet?.id;
  const displayName = isAllCards ? "All Cards" : (resolvedSet?.label ?? resolvedSet?.name ?? selectedSet);

  const [cards, sets] = await Promise.all([
    getCards({ packId, searchQuery, typeFilter, colorFilter, rarityFilter }),
    getSets(),
  ]);

  // Sort by label prefix: OP → EB → PRB → ST/decks → everything else
  const LABEL_PREFIX_ORDER: Record<string, number> = {
    "OP": 0,
    "EB": 1,
    "PRB": 2,
    "ST": 3,
  };

  type SetInfo = { label: string | null; prefix: string | null };
  const getSetInfo = (card: (typeof cards)[number]): SetInfo =>
    (card.sets as unknown as SetInfo) ?? { label: null, prefix: null };

  const getLabelPrefix = (label: string | null): string => {
    if (!label) return "";
    return label.match(/^([A-Z]+)/)?.[1] ?? "";
  };

  // Sort cards — Special/TreasureRare always last, then apply user sort
  const sortedCards = [...cards].sort((a, b) => {
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
        const prefixA = getLabelPrefix(setA.label);
        const prefixB = getLabelPrefix(setB.label);
        const orderA = LABEL_PREFIX_ORDER[prefixA] ?? 99;
        const orderB = LABEL_PREFIX_ORDER[prefixB] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        // Within same prefix group, sort by full set label then card id
        const labelDiff = (setA.label ?? "").localeCompare(setB.label ?? "");
        if (labelDiff !== 0) return labelDiff;
        return a.id.localeCompare(b.id);
      }
    }
  });

  return (
    <section className="flex-1 py-6 px-4 lg:px-8">
      <div className="mb-6">
        <SearchFilter sets={sets} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {displayName}{" "}
          <span className="text-muted-foreground">({cards.length} cards)</span>
        </h2>
      </div>

      {sortedCards.length === 0 ? (
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
