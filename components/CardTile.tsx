"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CardTileProps {
  card: Card;
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

export function CardTile({ card }: CardTileProps) {
  return (
    <Link
      href={`/cards/${card.id}`}
      className="group relative block overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
    >
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={card.img_url}
          alt={card.name}
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
          <p className="text-sm font-medium text-white truncate">{card.name}</p>
          <p className="text-xs text-white/80">{card.id}</p>
        </div>
      </div>
    </Link>
  );
}
