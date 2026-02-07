"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useCollection } from "@/lib/hooks/useCollection";
import { useAuth } from "@/lib/hooks/useAuth";
import { CollectionEntryCard } from "@/components/CollectionEntryCard";
import { CollectionCardTile } from "@/components/CollectionCardTile";
import {
  CollectionFilters,
  type SortOption,
  type ViewMode,
} from "@/components/CollectionFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Layers, DollarSign, Package, SearchX } from "lucide-react";

const RARITY_ORDER: Record<string, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  SuperRare: 3,
  SecretRare: 4,
  Leader: 5,
  Special: 6,
  Promo: 7,
};

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "grid";
  return (localStorage.getItem("collection-view-mode") as ViewMode) || "grid";
}

function CollectionSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4.2] rounded-lg" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border bg-card p-3">
          <Skeleton className="h-20 w-14 shrink-0 rounded-md" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-4 w-7 rounded" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
          <Skeleton className="h-7 w-7 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function CollectionPage() {
  const { loading: authLoading } = useAuth();
  const { entries, stats, isLoading, updateEntry, deleteEntry } = useCollection();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Load persisted view mode on mount
  useEffect(() => {
    setViewMode(getStoredViewMode());
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("collection-view-mode", mode);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter + sort pipeline
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.card.name.toLowerCase().includes(q) ||
          e.card.id.toLowerCase().includes(q)
      );
    }

    // Condition filter
    if (conditionFilter) {
      result = result.filter((e) => e.condition === conditionFilter);
    }

    // Rarity filter
    if (rarityFilter) {
      result = result.filter((e) => e.card.rarity === rarityFilter);
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "name-asc":
        sorted.sort((a, b) => a.card.name.localeCompare(b.card.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.card.name.localeCompare(a.card.name));
        break;
      case "quantity-desc":
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
      case "rarity":
        sorted.sort(
          (a, b) =>
            (RARITY_ORDER[b.card.rarity] ?? -1) - (RARITY_ORDER[a.card.rarity] ?? -1)
        );
        break;
    }

    return sorted;
  }, [entries, debouncedSearch, conditionFilter, rarityFilter, sortBy]);

  const isFiltered = debouncedSearch || conditionFilter || rarityFilter;

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
        <Skeleton className="h-10 w-48 mb-8 rounded" />
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Filter bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <Skeleton className="h-9 flex-1 min-w-[200px] rounded-md" />
          <Skeleton className="h-9 w-[160px] rounded-md" />
          <Skeleton className="h-9 w-[150px] rounded-md" />
          <Skeleton className="h-9 w-[190px] rounded-md" />
          <Skeleton className="h-9 w-[82px] rounded-md" />
        </div>
        <CollectionSkeleton viewMode="grid" />
      </main>
    );
  }

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
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
            {isFiltered && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing {filteredEntries.length} of {entries.length} entries
              </p>
            )}
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
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedTotalSpent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="mb-6">
        <CollectionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          conditionFilter={conditionFilter}
          onConditionChange={setConditionFilter}
          rarityFilter={rarityFilter}
          onRarityChange={setRarityFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      {/* Collection Content */}
      {isLoading ? (
        <CollectionSkeleton viewMode={viewMode} />
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
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching cards</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredEntries.map((entry) => (
            <CollectionCardTile
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <CollectionEntryCard
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
}
