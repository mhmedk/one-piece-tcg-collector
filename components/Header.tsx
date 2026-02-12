import { Suspense } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = data?.role === "admin";
    }
  } catch {
    // Supabase not configured or query failed — leave isAdmin false
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container-main flex h-14 items-center gap-2">
        <Suspense>
          <MobileNav />
        </Suspense>

        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <span className="font-oswald text-xl tracking-tight">
            <span className="text-muted-foreground font-normal">MY OP</span>{" "}
            <span className="text-primary font-bold">BINDER</span>
          </span>
        </Link>

        <Suspense fallback={<div className="hidden sm:block flex-1 max-w-sm mx-auto h-9" />}>
          <HeaderSearch />
        </Suspense>

        <nav className="flex items-center gap-1 shrink-0">
          <Link href="/" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Browse
            </Button>
          </Link>
          <Link href="/collection" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Collection
            </Button>
          </Link>
          <UserNav isAdmin={isAdmin} />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
