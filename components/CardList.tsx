import { CardTile } from "@/components/CardTile";
import { SearchFilter } from "@/components/SearchFilter";
import { CardType } from "@/types/types";

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
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_OPTCG_API_URL}/sets/${selectedSetId}`,
    { next: { revalidate: 3600 } }, // Cache for 1 hour
  );

  let cards: CardType[] = await response.json();

  // Apply filters
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    cards = cards.filter(
      (card) =>
        card.card_name.toLowerCase().includes(query) ||
        card.card_set_id.toLowerCase().includes(query) ||
        card.card_text?.toLowerCase().includes(query),
    );
  }

  if (typeFilter) {
    cards = cards.filter((card) => card.card_type === typeFilter);
  }

  if (colorFilter) {
    cards = cards.filter((card) => card.card_color.includes(colorFilter));
  }

  if (rarityFilter) {
    cards = cards.filter((card) => card.rarity === rarityFilter);
  }

  return (
    <section className="flex-1 py-6 px-4 lg:px-8">
      <div className="mb-6">
        <SearchFilter />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {selectedSetId}{" "}
          <span className="text-muted-foreground">({cards.length} cards)</span>
        </h2>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No cards found matching your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards.map((card: CardType) => (
            <CardTile key={`${card.card_set_id}-${card.rarity}`} card={card} />
          ))}
        </div>
      )}
    </section>
  );
};

export default CardList;
