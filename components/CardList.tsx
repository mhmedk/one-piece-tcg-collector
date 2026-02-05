import { CardTile } from "@/components/CardTile";
import { SearchFilter } from "@/components/SearchFilter";
import { createClient } from "@/lib/supabase/server";

interface CardListProps {
  selectedSetId: string;
  searchQuery?: string;
  typeFilter?: string;
  colorFilter?: string;
  rarityFilter?: string;
}

const CardList = async ({
  selectedSetId,
  searchQuery,
  typeFilter,
  colorFilter,
  rarityFilter,
}: CardListProps) => {
  const supabase = await createClient();

  // Build query with filters
  let query = supabase
    .from("cards")
    .select("*")
    .eq("set_id", selectedSetId)
    .order("card_set_id");

  // Apply filters at database level
  if (searchQuery) {
    query = query.or(
      `card_name.ilike.%${searchQuery}%,card_set_id.ilike.%${searchQuery}%,card_text.ilike.%${searchQuery}%`
    );
  }

  if (typeFilter) {
    query = query.eq("card_type", typeFilter);
  }

  if (colorFilter) {
    query = query.ilike("card_color", `%${colorFilter}%`);
  }

  if (rarityFilter) {
    query = query.eq("rarity", rarityFilter);
  }

  const { data: cards } = await query;

  return (
    <section className="flex-1 py-6 px-4 lg:px-8">
      <div className="mb-6">
        <SearchFilter />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {selectedSetId}{" "}
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
            <CardTile key={`${card.card_set_id}-${card.rarity}`} card={card} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CardList;
