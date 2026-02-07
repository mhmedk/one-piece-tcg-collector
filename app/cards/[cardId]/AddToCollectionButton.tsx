"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAddToCollection } from "@/components/AddToCollectionProvider";

interface AddToCollectionButtonProps {
  cardId: string;
  cardName: string;
}

export function AddToCollectionButton({ cardId, cardName }: AddToCollectionButtonProps) {
  const { loading } = useAuth();
  const { openAddDialog } = useAddToCollection();

  return (
    <Button size="lg" className="w-full" onClick={() => openAddDialog(cardId, cardName)} disabled={loading}>
      <Plus className="mr-2 h-5 w-5" />
      Add to Collection
    </Button>
  );
}
