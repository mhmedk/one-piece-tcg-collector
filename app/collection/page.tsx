"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/lib/hooks/useCollection";
import { useAuth } from "@/lib/hooks/useAuth";
import { CollectionEntryCard } from "@/components/CollectionEntryCard";
import { CollectionEntryForm } from "@/components/CollectionEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Layers, DollarSign, TrendingUp, Package } from "lucide-react";

// Skeleton component for loading state
function CollectionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-0">
            <div className="flex gap-4">
              <Skeleton className="h-32 w-24" />
              <div className="flex-1 py-3 pr-3 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CollectionPage() {
  const searchParams = useSearchParams();
  const addCardId = searchParams.get("add");

  const { user, loading: authLoading } = useAuth();
  const { entries, stats, isLoading, addEntry, updateEntry, deleteEntry } = useCollection();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingCard, setAddingCard] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ?add=cardId query param
  useEffect(() => {
    if (addCardId && user) {
      // TODO: Fetch card name from API
      setAddingCard({ id: addCardId, name: addCardId });
      setShowAddDialog(true);
    }
  }, [addCardId, user]);

  const handleAddToCollection = async (data: Parameters<typeof addEntry>[0]) => {
    setIsSubmitting(true);
    try {
      await addEntry(data);
      toast.success("Card added to collection!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (entryId: string, data: { quantity?: number }) => {
    try {
      await updateEntry(entryId, data);
      toast.success("Collection updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      toast.success("Card removed from collection");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove");
    }
  };

  if (authLoading) {
    return (
      <main className="container-main py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <CollectionSkeleton />
      </main>
    );
  }

  const formattedTotalValue = stats
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(stats.totalValue)
    : "$0.00";

  const formattedTotalSpent = stats
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(stats.totalSpent)
    : "$0.00";

  return (
    <main className="container-main py-8">
      <h1 className="page-title mb-8">My Collection</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Cards</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uniqueCards || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formattedTotalValue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTotalSpent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Collection List */}
      {isLoading ? (
        <CollectionSkeleton />
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No cards in your collection</h3>
            <p className="text-muted-foreground">
              Start browsing cards and add them to your collection!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <CollectionEntryCard
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add to Collection Dialog */}
      {addingCard && (
        <CollectionEntryForm
          cardId={addingCard.id}
          cardName={addingCard.name}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleAddToCollection}
          isLoading={isSubmitting}
        />
      )}
    </main>
  );
}
