"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { useAuth } from "@/lib/hooks/useAuth";
import { CollectionEntryForm } from "@/components/CollectionEntryForm";
import type { AddToCollectionData } from "@/lib/schemas/collection";
import { toast } from "sonner";

interface AddToCollectionContextValue {
  openAddDialog: (cardId: string, cardName: string) => void;
}

const AddToCollectionContext = createContext<AddToCollectionContextValue | null>(
  null
);

export function useAddToCollection() {
  const ctx = useContext(AddToCollectionContext);
  if (!ctx) {
    throw new Error(
      "useAddToCollection must be used within AddToCollectionProvider"
    );
  }
  return ctx;
}

export function AddToCollectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const [card, setCard] = useState<{ id: string; name: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddDialog = useCallback(
    (cardId: string, cardName: string) => {
      if (!user) {
        toast.info("Please sign in to add cards to your collection");
        router.push(`/login?redirect=${window.location.pathname}`);
        return;
      }
      setCard({ id: cardId, name: cardName });
      setOpen(true);
    },
    [user, router]
  );

  const handleSubmit = async (data: AddToCollectionData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add to collection");
      }

      toast.success("Card added to collection!");
      mutate("/api/collection");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add card"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AddToCollectionContext.Provider value={{ openAddDialog }}>
      {children}
      {card && (
        <CollectionEntryForm
          key={card.id}
          cardId={card.id}
          cardName={card.name}
          open={open}
          onOpenChange={setOpen}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      )}
    </AddToCollectionContext.Provider>
  );
}
