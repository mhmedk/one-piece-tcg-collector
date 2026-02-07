"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { CollectionEntry } from "@/lib/hooks/useCollection";

interface CollectionCardTileProps {
  entry: CollectionEntry;
  onUpdate: (entryId: string, data: { quantity?: number }) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
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

export function CollectionCardTile({ entry, onUpdate, onDelete }: CollectionCardTileProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(entry.quantity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local quantity when SWR data changes (after server confirm or rollback)
  useEffect(() => {
    setLocalQuantity(entry.quantity);
  }, [entry.quantity]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const flushUpdate = useCallback(
    (quantity: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(entry.id, { quantity });
      }, 300);
    },
    [entry.id, onUpdate]
  );

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const newQuantity = localQuantity + delta;
    if (newQuantity < 1) {
      setShowDeleteDialog(true);
      return;
    }
    setLocalQuantity(newQuantity);
    flushUpdate(newQuantity);
  };

  const handleDelete = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={() => router.push(`/cards/${entry.card.id}?from=collection`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/cards/${entry.card.id}?from=collection`);
          }
        }}
        className="group relative block cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
      >
        <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={entry.card.img_url}
            alt={entry.card.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-opacity group-hover:opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          {/* Quantity badge */}
          <div className="absolute top-2 left-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/70 px-2 text-sm font-bold text-white">
            &times;{localQuantity}
          </div>

          {/* Rarity badge */}
          <Badge
            className={cn(
              "absolute top-2 right-2",
              rarityColors[entry.card.rarity] || "bg-gray-500"
            )}
          >
            {entry.card.rarity}
          </Badge>

          {/* Condition indicator */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs text-white/80 bg-black/40">
            {entry.condition}
          </div>

          {/* Hover actions */}
          <div
            className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={(e) => handleQuantityChange(e, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={(e) => handleQuantityChange(e, 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Card info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full transition-transform group-hover:translate-y-0">
            <p className="text-sm font-medium text-white truncate">{entry.card.name}</p>
            <p className="text-xs text-white/80">{entry.card.id}</p>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{entry.card.name}&quot; from your collection. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
