"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface AddToCollectionButtonProps {
  cardId: string;
  cardName: string;
}

export function AddToCollectionButton({ cardId, cardName }: AddToCollectionButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      toast.info("Please sign in to add cards to your collection");
      router.push(`/login?redirect=/cards/${cardId}`);
      return;
    }

    // Will be implemented in Phase 4 with collection API
    toast.info(`Adding ${cardName} to collection...`);
    router.push(`/collection?add=${cardId}`);
  };

  return (
    <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
      <Plus className="mr-2 h-5 w-5" />
      Add to Collection
    </Button>
  );
}
