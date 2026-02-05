export default function Loading() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <section className="flex-1 py-6 px-4 lg:px-8">
        <div className="mb-6 space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="flex flex-wrap gap-2">
            <div className="h-9 w-[160px] animate-pulse rounded bg-muted" />
            <div className="h-9 w-[200px] animate-pulse rounded bg-muted" />
            <div className="h-9 w-[140px] animate-pulse rounded bg-muted" />
            <div className="h-9 w-[140px] animate-pulse rounded bg-muted" />
            <div className="h-9 w-[140px] animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-7 w-48 mb-4 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4.2] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
