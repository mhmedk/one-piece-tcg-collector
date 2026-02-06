import { CardTile } from "@/components/CardTile";
import { SearchFilter } from "@/components/SearchFilter";
import { createClient } from "@/lib/supabase/server";

interface CardListProps {
  selectedSetLabel: string;
  searchQuery?: string;
  typeFilter?: string;
  colorFilter?: string;
  rarityFilter?: string;
}

const CardList = async ({
  selectedSetLabel,
  searchQuery,
  typeFilter,
  colorFilter,
  rarityFilter,
}: CardListProps) => {
  const supabase = await createClient();

  // Resolve set label to pack_id
  const { data: selectedSet } = await supabase
    .from("sets")
    .select("id, label")
    .eq("label", selectedSetLabel)
    .single();

  const packId = selectedSet?.id;

  // Build query with filters
  let query = supabase
    .from("cards")
    .select("*")
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

  return (
    <section className="flex-1 py-6 px-4 lg:px-8">
      <div className="mb-6">
        <SearchFilter sets={sets ?? []} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {selectedSetLabel}{" "}
          <span className="text-muted-foreground">({cards?.length ?? 0} cards)</span>
        </h2>
      </div>

      {!cards || cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No cards found matching your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards?.map((card) => (
            <CardTile key={`${card.id}-${card.rarity}`} card={card} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CardList;
