import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CardType } from "@/types/types";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCollectionButton } from "./AddToCollectionButton";

interface PageProps {
  params: Promise<{ cardId: string }>;
}

const rarityColors: Record<string, string> = {
  C: "bg-gray-500",
  UC: "bg-green-600",
  R: "bg-blue-600",
  SR: "bg-purple-600",
  SEC: "bg-yellow-500 text-black",
  L: "bg-orange-500",
  SP: "bg-pink-500",
  P: "bg-cyan-500",
};

async function getCard(cardId: string): Promise<CardType | null> {
  // Parse the card ID to get the set ID (e.g., "OP01-001" -> "OP-01")
  const match = cardId.match(/^([A-Z]+)(\d+)-/);
  if (!match) return null;

  const prefix = match[1];
  const setNum = match[2];
  const setId = `${prefix}-${setNum}`;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_OPTCG_API_URL}/sets/${setId}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) return null;

    const cards: CardType[] = await response.json();
    return cards.find((c) => c.card_set_id === cardId) || null;
  } catch {
    return null;
  }
}

export default async function CardDetailPage({ params }: PageProps) {
  const { cardId } = await params;
  const card = await getCard(cardId);

  if (!card) {
    notFound();
  }

  const formattedMarketPrice = card.market_price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(card.market_price)
    : "N/A";

  const formattedInventoryPrice = card.inventory_price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(card.inventory_price)
    : "N/A";

  return (
    <main className="container-main py-8">
      <Link href={`/?set=${card.set_id}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {card.set_id}
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Card Image */}
        <div className="flex justify-center">
          <div className="relative aspect-[3/4.2] w-full max-w-md overflow-hidden rounded-xl shadow-2xl">
            <Image
              src={card.card_image}
              alt={card.card_name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{card.card_name}</h1>
              <Badge className={rarityColors[card.rarity] || "bg-gray-500"}>
                {card.rarity}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{card.card_set_id}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Card Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{card.card_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium">{card.card_color}</p>
                </div>
                {card.card_cost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium">{card.card_cost}</p>
                  </div>
                )}
                {card.card_power && (
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="font-medium">{card.card_power}</p>
                  </div>
                )}
                {card.life && (
                  <div>
                    <p className="text-sm text-muted-foreground">Life</p>
                    <p className="font-medium">{card.life}</p>
                  </div>
                )}
                {card.counter_amount !== null && card.counter_amount > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Counter</p>
                    <p className="font-medium">+{card.counter_amount}</p>
                  </div>
                )}
                {card.attribute && (
                  <div>
                    <p className="text-sm text-muted-foreground">Attribute</p>
                    <p className="font-medium">{card.attribute}</p>
                  </div>
                )}
                {card.sub_types && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Sub Types</p>
                    <p className="font-medium">{card.sub_types}</p>
                  </div>
                )}
              </div>

              {card.card_text && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Effect</p>
                    <p className="text-sm leading-relaxed">{card.card_text}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Market Price</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formattedMarketPrice}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Inventory Price
                  </p>
                  <p className="text-2xl font-bold">
                    {formattedInventoryPrice}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AddToCollectionButton
            cardId={card.card_set_id}
            cardName={card.card_name}
          />
        </div>
      </div>
    </main>
  );
}
