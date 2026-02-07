"use client";

import useSWR from "swr";
import {
  getCollectionEntries,
  addToCollection,
  updateCollectionEntry,
  deleteCollectionEntry,
} from "@/lib/actions/collection";
import type { AddToCollectionData, UpdateCollectionEntryData } from "@/lib/schemas/collection";

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

const COLLECTION_KEY = "collection";

export function useCollection() {
  const { data, error, isLoading, mutate } = useSWR<{ entries: CollectionEntry[] }>(
    COLLECTION_KEY,
    async () => {
      const result = await getCollectionEntries();
      if (result.error) throw new Error(result.error);
      return { entries: result.entries as CollectionEntry[] };
    },
    { revalidateOnFocus: false }
  );

  const addEntry = async (newData: AddToCollectionData) => {
    const result = await addToCollection(newData);
    if (result.error) throw new Error(result.error);
    await mutate();
    return result;
  };

  const updateEntry = async (entryId: string, updateData: UpdateCollectionEntryData) => {
    const optimisticData = data
      ? {
          entries: data.entries.map((e) =>
            e.id === entryId ? { ...e, ...updateData } : e
          ),
        }
      : undefined;

    await mutate(
      async () => {
        const result = await updateCollectionEntry(entryId, updateData);
        if (result.error) throw new Error(result.error);
        return optimisticData;
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  const deleteEntry = async (entryId: string) => {
    const optimisticData = data
      ? { entries: data.entries.filter((e) => e.id !== entryId) }
      : undefined;

    await mutate(
      async () => {
        const result = await deleteCollectionEntry(entryId);
        if (result.error) throw new Error(result.error);
        return optimisticData;
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
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
