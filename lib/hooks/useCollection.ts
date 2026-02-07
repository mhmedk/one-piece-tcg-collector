"use client";

import useSWR from "swr";
import type { AddToCollectionData, UpdateCollectionEntryData } from "@/lib/schemas/collection";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch");
  }
  return res.json();
};

export interface CollectionEntry {
  id: string;
  card_id: string;
  quantity: number;
  condition: string;
  purchase_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  card: {
    id: string;
    name: string;
    img_url: string;
    rarity: string;
    pack_id: string;
    colors: string[];
    category: string;
  };
}

export function useCollection() {
  const { data, error, isLoading, mutate } = useSWR<{ entries: CollectionEntry[] }>(
    "/api/collection",
    fetcher
  );

  const addEntry = async (newData: AddToCollectionData) => {
    const res = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to add to collection");
    }

    await mutate();
    return res.json();
  };

  const updateEntry = async (entryId: string, updateData: UpdateCollectionEntryData) => {
    // Optimistic update for quantity changes
    const optimisticData = data
      ? {
          entries: data.entries.map((e) =>
            e.id === entryId ? { ...e, ...updateData } : e
          ),
        }
      : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/collection/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update entry");
        }

        return res.json();
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  const deleteEntry = async (entryId: string) => {
    // Optimistic delete
    const optimisticData = data
      ? { entries: data.entries.filter((e) => e.id !== entryId) }
      : undefined;

    await mutate(
      async () => {
        const res = await fetch(`/api/collection/${entryId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to delete entry");
        }

        return res.json();
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: true,
      }
    );
  };

  // Calculate collection stats
  const stats = data?.entries
    ? {
        totalCards: data.entries.reduce((sum, e) => sum + e.quantity, 0),
        uniqueCards: data.entries.length,
        totalSpent: data.entries.reduce(
          (sum, e) => sum + (e.purchase_price || 0) * e.quantity,
          0
        ),
      }
    : null;

  return {
    entries: data?.entries || [],
    stats,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: mutate,
  };
}
