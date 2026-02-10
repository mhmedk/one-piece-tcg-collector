"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  { key: "all", prefixes: [], label: "All Cards" },
  { key: "booster", prefixes: ["BOOSTER PACK", "EXTRA BOOSTER", "PREMIUM BOOSTER"], label: "Sets & Expansions" },
  { key: "deck", prefixes: ["STARTER DECK", "STARTER DECK EX", "ULTRA DECK"], label: "Decks" },
  { key: "promo", prefixes: [null], id: "569901", label: "Promo" },
  { key: "special", prefixes: [null], id: "569801", label: "Special" },
];

// Display order and labels for sub-groups within categories
const PREFIX_GROUPS: Record<string, { label: string; prefixes: string[] }[]> = {
  booster: [
    { label: "Booster Packs", prefixes: ["BOOSTER PACK"] },
    { label: "Extra Boosters", prefixes: ["EXTRA BOOSTER"] },
    { label: "Premium Boosters", prefixes: ["PREMIUM BOOSTER"] },
  ],
};

function getSetValue(set: SetOption): string {
  return set.label ?? set.id;
}

function getSetsForCategory(sets: SetOption[], category: SetCategory): SetOption[] {
  if (category.key === "all") return sets;
  if (category.id) {
    return sets.filter((s) => s.id === category.id);
  }
  return sets.filter((s) => category.prefixes.includes(s.prefix) && s.label !== null);
}

const CATEGORY_ALL_VALUES: Record<string, string> = {
  booster: "all-booster",
  deck: "all-deck",
};

function getCategoryForSet(sets: SetOption[], setParam: string): string {
  if (setParam === "all") return "all";
  // Check category-level "all" values (e.g., all-booster, all-deck)
  for (const [key, value] of Object.entries(CATEGORY_ALL_VALUES)) {
    if (setParam === value) return key;
  }
  const set = sets.find((s) => s.label === setParam || s.id === setParam);
  if (set) {
    for (const cat of SET_CATEGORIES) {
      if (cat.key === "all") continue;
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
  const [, startTransition] = useTransition();

  const currentSetParam = searchParams.get("set") || "all";
  const activeCategoryKey = useMemo(
    () => getCategoryForSet(sets, currentSetParam),
    [sets, currentSetParam]
  );

  const activeCategory = SET_CATEGORIES.find((c) => c.key === activeCategoryKey) ?? SET_CATEGORIES[0];
  const categorySets = getSetsForCategory(sets, activeCategory);
  const isSingleSetCategory = activeCategory.key === "all" || !!activeCategory.id;

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

  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      // Keep "all" for set param (it's a real value), strip it for filters (means "no filter")
      const resolved = key === "set" ? value : (value === "all" ? null : value);
      router.push(`/?${createQueryString({ [key]: resolved })}`);
    });
  };

  const handleCategoryChange = (key: string) => {
    if (key === "all") {
      handleFilterChange("set", "all");
      return;
    }
    const cat = SET_CATEGORIES.find((c) => c.key === key);
    if (!cat) return;
    // Default to "All" for categories that support it
    const allValue = CATEGORY_ALL_VALUES[key];
    if (allValue) {
      handleFilterChange("set", allValue);
      return;
    }
    const catSets = getSetsForCategory(sets, cat);
    if (catSets[0]) {
      handleFilterChange("set", getSetValue(catSets[0]));
    }
  };

  const clearFilters = () => {
    const set = searchParams.get("set") || "all";
    startTransition(() => {
      router.push(`/?set=${set}`);
    });
  };

  const hasFilters = searchParams.has("q") || searchParams.has("type") ||
                     searchParams.has("color") || searchParams.has("rarity") ||
                     (searchParams.has("sort") && searchParams.get("sort") !== "set");

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
          {SET_CATEGORIES.filter((c) => c.key === "all" || getSetsForCategory(sets, c).length > 0).map((c) => (
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
            {CATEGORY_ALL_VALUES[activeCategoryKey] && (
              <SelectItem value={CATEGORY_ALL_VALUES[activeCategoryKey]}>
                All {activeCategory.label}
              </SelectItem>
            )}
            {PREFIX_GROUPS[activeCategoryKey]
              ? PREFIX_GROUPS[activeCategoryKey].map((group) => {
                  const groupSets = categorySets.filter((s) =>
                    group.prefixes.includes(s.prefix ?? "")
                  );
                  if (groupSets.length === 0) return null;
                  return (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {groupSets.map((set) => (
                        <SelectItem key={set.id} value={getSetValue(set)}>
                          {set.label} - {set.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })
              : categorySets.map((set) => (
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

      <Select
        value={searchParams.get("sort") || "set"}
        onValueChange={(value) => handleFilterChange("sort", value === "set" ? "set" : value)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="set">By Set</SelectItem>
          <SelectItem value="name">By Name</SelectItem>
          <SelectItem value="cost-asc">Cost (Low)</SelectItem>
          <SelectItem value="cost-desc">Cost (High)</SelectItem>
          <SelectItem value="power-desc">Power (High)</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
          <span className="sr-only">Clear filters</span>
        </Button>
      )}
    </div>
  );
}
