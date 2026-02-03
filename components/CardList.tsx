import { CardType } from "@/types/types";
import Image from "next/image";

const CardList = async ({ selectedSetId }: { selectedSetId: string }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_OP_API_URL}/sets/${selectedSetId}`,
  );

  const cards: CardType[] = await response.json();

  console.log("Cards fetched for set", selectedSetId, cards[0].card_name);

  return (
    <section className="container-main flex-1 py-8">
      <h1 className="page-title text-center">One Piece TCG Collector</h1>

      <div className="mt-12 space-y-6">
        <h2 className="text-xl font-semibold">Set Selected: {selectedSetId}</h2>

        <ul className="sets-grid">
          {cards.map((card: CardType) => (
            <li key={`${card.card_set_id}-${card.rarity}`}>
              {/* <Link href={"/"}> */}
              <Image
                src={card.card_image}
                alt={card.card_image_id}
                width={300}
                height={420}
              />
              {/* </Link> */}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default CardList;
