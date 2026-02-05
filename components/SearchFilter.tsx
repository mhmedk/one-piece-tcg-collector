"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SetOption {
  set_id: string;
  set_name: string;
}

interface SearchFilterProps {
  sets?: SetOption[];
  types?: string[];
  colors?: string[];
  rarities?: string[];
}

const SET_CATEGORIES = [
  { prefix: "OP-", label: "Booster Packs" },
  { prefix: "EB-", label: "Extra Boosters" },
  { prefix: "ST-", label: "Starter Decks" },
  { prefix: "PROMO", label: "Promotional" },
] as const;

function getCategoryForSet(setId: string) {
  return SET_CATEGORIES.find((c) => setId.startsWith(c.prefix))?.prefix ?? SET_CATEGORIES[0].prefix;
}

function getSetsForCategory(sets: SetOption[], prefix: string) {
  return sets.filter((s) => s.set_id.startsWith(prefix));
}

export function SearchFilter({
  sets = [],
  types = ["Leader", "Character", "Event", "Stage", "DON!!"],
  colors = ["Red", "Blue", "Green", "Purple", "Black", "Yellow"],
  rarities = ["C", "UC", "R", "SR", "SEC", "L", "SP", "P"],
}: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const currentSetId = searchParams.get("set") || "OP-01";
  const [activeCategory, setActiveCategory] = useState(getCategoryForSet(currentSetId));

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      return newParams.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(`/?${createQueryString({ q: search || null })}`);
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      router.push(`/?${createQueryString({ [key]: value === "all" ? null : value })}`);
    });
  };

  const handleCategoryChange = (prefix: string) => {
    setActiveCategory(prefix);
    const firstSet = getSetsForCategory(sets, prefix)[0];
    if (firstSet) {
      handleFilterChange("set", firstSet.set_id);
    }
  };

  const clearFilters = () => {
    setSearch("");
    const set = searchParams.get("set");
    startTransition(() => {
      router.push(set ? `/?set=${set}` : "/");
    });
  };

  const hasFilters = searchParams.has("q") || searchParams.has("type") ||
                     searchParams.has("color") || searchParams.has("rarity");

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Select
          value={activeCategory}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {SET_CATEGORIES.filter((c) => getSetsForCategory(sets, c.prefix).length > 0).map((c) => (
              <SelectItem key={c.prefix} value={c.prefix}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentSetId}
          onValueChange={(value) => handleFilterChange("set", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Set" />
          </SelectTrigger>
          <SelectContent>
            {getSetsForCategory(sets, activeCategory).map((set) => (
              <SelectItem key={set.set_id} value={set.set_id}>
                {set.set_id} - {set.set_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("type") || "all"}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Card Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("color") || "all"}
          onValueChange={(value) => handleFilterChange("color", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {colors.map((color) => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("rarity") || "all"}
          onValueChange={(value) => handleFilterChange("rarity", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            {rarities.map((rarity) => (
              <SelectItem key={rarity} value={rarity}>
                {rarity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
            <span className="sr-only">Clear filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}
