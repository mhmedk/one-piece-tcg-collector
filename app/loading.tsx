import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <section className="flex-1 py-6 px-4 lg:px-8">
        {/* Filter bar skeleton — category + set + type/color/rarity + sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:justify-center">
          <Skeleton className="h-9 w-[180px] rounded-md" />
          <Skeleton className="h-9 w-[200px] rounded-md" />
          <Skeleton className="h-9 w-[140px] rounded-md" />
          <Skeleton className="h-9 w-[140px] rounded-md" />
          <Skeleton className="h-9 w-[140px] rounded-md" />
          <Skeleton className="h-9 w-[140px] rounded-md" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-48 rounded" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }, (_, i) => (
            <Skeleton
              key={i}
              className="aspect-[3/4.2] rounded-lg"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
