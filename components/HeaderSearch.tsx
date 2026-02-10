"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = pathname === "/" ? (searchParams.get("q") || "") : "";
  const [search, setSearch] = useState(currentQ);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with URL when navigating
  useEffect(() => {
    setSearch(pathname === "/" ? (searchParams.get("q") || "") : "");
  }, [pathname, searchParams]);

  // Auto-focus mobile input when opened
  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus();
  }, [mobileOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (pathname === "/") {
      // On homepage: preserve other filters, update q
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      router.push(`/?${params.toString()}`);
    } else {
      // On other pages: navigate to homepage with search
      router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop search */}
      <form onSubmit={handleSubmit} className="hidden sm:flex relative flex-1 max-w-sm mx-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </form>

      {/* Mobile search toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close search" : "Open search"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
      </Button>

      {/* Mobile expanded search row */}
      {mobileOpen && (
        <form
          onSubmit={handleSubmit}
          className="absolute left-0 top-full w-full border-b bg-background p-2 sm:hidden"
        >
          <div className="container-main relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
      )}
    </>
  );
}
