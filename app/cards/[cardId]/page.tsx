import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCard } from "@/lib/data";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CardIdDisplay } from "@/components/CardIdDisplay";
import { AddToCollectionButton } from "./AddToCollectionButton";
import { BackButton } from "./BackButton";

interface PageProps {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { cardId } = await params;
  const card = await getCard(cardId);

  if (!card) {
    return { title: "Card Not Found" };
  }

  const description = `${card.rarity} ${card.category} — ${card.colors.join(" / ")}`;

  return {
    title: card.name,
    description,
    openGraph: {
      title: card.name,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: card.name,
      description,
    },
  };
}

const rarityColors: Record<string, string> = {
  Common: "bg-gray-500",
  Uncommon: "bg-green-600",
  Rare: "bg-blue-600",
  SuperRare: "bg-purple-600",
  SecretRare: "bg-yellow-500 text-black",
  Leader: "bg-orange-500",
  Special: "bg-pink-500",
  Promo: "bg-cyan-500",
};

export default async function CardDetailPage({ params, searchParams }: PageProps) {
  const { cardId } = await params;
  const { from } = await searchParams;
  const card = await getCard(cardId);

  if (!card) {
    notFound();
  }

  const set = card.sets as unknown as { id: string; label: string | null; name: string } | null;
  const setParam = set?.label ?? set?.id;
  const setDisplayName = set?.label ?? set?.name;

  return (
    <main className="container-main py-8">
      {setParam && setDisplayName && (
        <BackButton setParam={setParam} setDisplayName={setDisplayName} from={from} />
      )}

      <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
        {/* Card Image */}
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-xl shadow-2xl">
            <Image
              src={card.img_url}
              alt={card.name}
              width={600}
              height={838}
              priority
              className="h-full w-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{card.name}</h1>
              <Badge className={rarityColors[card.rarity] || "bg-gray-500"}>
                {card.rarity}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1"><CardIdDisplay id={card.id} /></p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Card Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{card.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium">{card.colors.join(" / ")}</p>
                </div>
                {card.cost !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium">{card.cost}</p>
                  </div>
                )}
                {card.power !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="font-medium">{card.power}</p>
                  </div>
                )}
                {card.life !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Life</p>
                    <p className="font-medium">{card.life}</p>
                  </div>
                )}
                {card.counter !== null && card.counter > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Counter</p>
                    <p className="font-medium">+{card.counter}</p>
                  </div>
                )}
                {card.attributes.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Attributes</p>
                    <p className="font-medium">{card.attributes.join(" / ")}</p>
                  </div>
                )}
                {card.types.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Types</p>
                    <p className="font-medium">{card.types.join(" / ")}</p>
                  </div>
                )}
              </div>

              {card.effect && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Effect</p>
                    <p
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: card.effect.replace(/<br\s*\/?>/gi, "<br />"),
                      }}
                    />
                  </div>
                </>
              )}

              {card.trigger_text && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Trigger</p>
                    <p
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: card.trigger_text.replace(/<br\s*\/?>/gi, "<br />"),
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <AddToCollectionButton
            cardId={card.id}
            cardName={card.name}
          />
        </div>
      </div>
    </main>
  );
}
