"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface CollectionEntryCardProps {
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

export function CollectionEntryCard({ entry, onUpdate, onDelete }: CollectionEntryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = entry.quantity + delta;
    if (newQuantity < 1) {
      setShowDeleteDialog(true);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdate(entry.id, { quantity: newQuantity });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formattedDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedPrice = entry.purchase_price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(entry.purchase_price)
    : null;

  return (
    <>
      <div className="group flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
        {/* Card Image */}
        <Link href={`/cards/${entry.card.id}`} className="shrink-0">
          <div className="relative h-20 w-14 overflow-hidden rounded-md bg-muted">
            <Image
              src={entry.card.img_url}
              alt={entry.card.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        </Link>

        {/* Name + ID + Rarity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/cards/${entry.card.id}`}
              className="truncate font-medium hover:underline"
            >
              {entry.card.name}
            </Link>
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 text-xs",
                rarityColors[entry.card.rarity] || "bg-gray-500"
              )}
            >
              {entry.card.rarity}
            </Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <span>{entry.card.id}</span>
            <span>{entry.condition}</span>
            {formattedPrice && <span>{formattedPrice}</span>}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>
          {entry.notes && (
            <p className="mt-1 truncate text-xs text-muted-foreground italic">
              {entry.notes}
            </p>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(-1)}
            disabled={isUpdating}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">
            {entry.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleQuantityChange(1)}
            disabled={isUpdating}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
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
