"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex gap-4">
            {/* Card Image */}
            <Link href={`/cards/${entry.card.id}`} className="shrink-0">
              <div className="relative h-32 w-24 overflow-hidden">
                <Image
                  src={entry.card.img_url}
                  alt={entry.card.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            </Link>

            {/* Card Info */}
            <div className="flex-1 py-3 pr-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/cards/${entry.card.id}`}
                    className="font-medium hover:underline"
                  >
                    {entry.card.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{entry.card.id}</p>
                </div>
                <Badge className={rarityColors[entry.card.rarity] || "bg-gray-500"}>
                  {entry.card.rarity}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Condition: </span>
                  <span>{entry.condition}</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={isUpdating}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{entry.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(1)}
                    disabled={isUpdating}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
