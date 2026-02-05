"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CardTileProps {
  card: Card;
  showPrice?: boolean;
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

export function CardTile({ card, showPrice = true }: CardTileProps) {
  const formattedPrice = card.market_price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(card.market_price)
    : null;

  return (
    <Link
      href={`/cards/${card.card_set_id}`}
      className="group relative block overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={card.card_image}
          alt={card.card_name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-opacity group-hover:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Rarity badge */}
        <Badge
          className={cn(
            "absolute top-2 right-2",
            rarityColors[card.rarity] || "bg-gray-500"
          )}
        >
          {card.rarity}
        </Badge>

        {/* Card info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full transition-transform group-hover:translate-y-0">
          <p className="text-sm font-medium text-white truncate">{card.card_name}</p>
          <p className="text-xs text-white/80">{card.card_set_id}</p>
          {showPrice && formattedPrice && (
            <p className="text-sm font-semibold text-green-400 mt-1">{formattedPrice}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
