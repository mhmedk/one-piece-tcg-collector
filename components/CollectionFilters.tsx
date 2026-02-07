"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conditionOptions } from "@/lib/schemas/collection";
import { cn } from "@/lib/utils";

export type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "quantity-desc" | "rarity";
export type ViewMode = "grid" | "list";

const rarityOptions = [
  "Common",
  "Uncommon",
  "Rare",
  "SuperRare",
  "SecretRare",
  "Leader",
  "Special",
  "Promo",
] as const;

const sortLabels: Record<SortOption, string> = {
  newest: "Date Added (Newest)",
  oldest: "Date Added (Oldest)",
  "name-asc": "Name A-Z",
  "name-desc": "Name Z-A",
  "quantity-desc": "Quantity (High-Low)",
  rarity: "Rarity",
};

interface CollectionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  conditionFilter: string | null;
  onConditionChange: (condition: string | null) => void;
  rarityFilter: string | null;
  onRarityChange: (rarity: string | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function CollectionFilters({
  searchQuery,
  onSearchChange,
  conditionFilter,
  onConditionChange,
  rarityFilter,
  onRarityChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: CollectionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Condition Filter */}
      <Select
        value={conditionFilter ?? "all"}
        onValueChange={(v) => onConditionChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Condition" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Conditions</SelectItem>
          {conditionOptions.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Rarity Filter */}
      <Select
        value={rarityFilter ?? "all"}
        onValueChange={(v) => onRarityChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Rarity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Rarities</SelectItem>
          {rarityOptions.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        value={sortBy}
        onValueChange={(v) => onSortChange(v as SortOption)}
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sortLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-r-none",
            viewMode === "grid" && "bg-muted"
          )}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-l-none",
            viewMode === "list" && "bg-muted"
          )}
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
