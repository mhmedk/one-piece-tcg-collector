"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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
  id: string;
  label: string | null;
  name: string;
  prefix: string | null;
}

interface SearchFilterProps {
  sets?: SetOption[];
  types?: string[];
  colors?: string[];
  rarities?: string[];
}

interface SetCategory {
  key: string;
  prefixes: (string | null)[];
  id?: string;
  label: string;
}

const SET_CATEGORIES: SetCategory[] = [
  { key: "booster", prefixes: ["BOOSTER PACK"], label: "Booster Packs" },
  { key: "starter", prefixes: ["STARTER DECK", "STARTER DECK EX", "ULTRA DECK"], label: "Starter Decks" },
  { key: "extra", prefixes: ["EXTRA BOOSTER"], label: "Extra Boosters" },
  { key: "premium", prefixes: ["PREMIUM BOOSTER"], label: "Premium Boosters" },
  { key: "promo", prefixes: [null], id: "569901", label: "Promotional" },
  { key: "other", prefixes: [null], id: "569801", label: "Other" },
];

function getSetValue(set: SetOption): string {
  return set.label ?? set.id;
}

function getSetsForCategory(sets: SetOption[], category: SetCategory): SetOption[] {
  if (category.id) {
    return sets.filter((s) => s.id === category.id);
  }
  return sets.filter((s) => category.prefixes.includes(s.prefix) && s.label !== null);
}

function getCategoryForSet(sets: SetOption[], setParam: string): string {
  const set = sets.find((s) => s.label === setParam || s.id === setParam);
  if (set) {
    for (const cat of SET_CATEGORIES) {
      if (cat.id && set.id === cat.id) return cat.key;
      if (!cat.id && cat.prefixes.includes(set.prefix) && set.label !== null) return cat.key;
    }
  }
  return SET_CATEGORIES[0].key;
}

export function SearchFilter({
  sets = [],
  types = ["Leader", "Character", "Event", "Stage", "DON!!"],
  colors = ["Red", "Blue", "Green", "Purple", "Black", "Yellow"],
  rarities = ["Common", "Uncommon", "Rare", "SuperRare", "SecretRare", "Leader", "Special"],
}: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const currentSetParam = searchParams.get("set") || "OP-01";
  const [activeCategoryKey, setActiveCategoryKey] = useState(
    getCategoryForSet(sets, currentSetParam)
  );

  const activeCategory = SET_CATEGORIES.find((c) => c.key === activeCategoryKey) ?? SET_CATEGORIES[0];
  const categorySets = getSetsForCategory(sets, activeCategory);
  const isSingleSetCategory = !!activeCategory.id;

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

  // Keep a stable ref to createQueryString so the effect only re-runs on `search`
  const createQueryStringRef = useRef(createQueryString);
  createQueryStringRef.current = createQueryString;

  // Debounced auto-search on typing
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(`/?${createQueryStringRef.current({ q: search || null })}`);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, router, startTransition]);

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      router.push(`/?${createQueryString({ [key]: value === "all" ? null : value })}`);
    });
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategoryKey(key);
    const cat = SET_CATEGORIES.find((c) => c.key === key);
    if (!cat) return;
    const firstSet = getSetsForCategory(sets, cat)[0];
    if (firstSet) {
      handleFilterChange("set", getSetValue(firstSet));
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <Select
        value={activeCategoryKey}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {SET_CATEGORIES.filter((c) => getSetsForCategory(sets, c).length > 0).map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isSingleSetCategory && (
        <Select
          value={currentSetParam}
          onValueChange={(value) => handleFilterChange("set", value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Set" />
          </SelectTrigger>
          <SelectContent>
            {categorySets.map((set) => (
              <SelectItem key={set.id} value={getSetValue(set)}>
                {set.label} - {set.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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

      {/* Search — pushed to the right on desktop */}
      <div className="relative sm:ml-auto min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or effect..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
