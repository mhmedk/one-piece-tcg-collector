import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-main flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-oswald text-xl font-bold tracking-tight">
            One Piece TCG Collector
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              Browse
            </Button>
          </Link>
          <Link href="/collection">
            <Button variant="ghost" size="sm">
              Collection
            </Button>
          </Link>
          <UserNav />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
