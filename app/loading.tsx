export default function Loading() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden md:block w-64 shrink-0 border-r p-4">
        <h2 className="mb-4 text-lg font-semibold">Filter by Set</h2>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded bg-muted" />
          ))}
        </div>
      </aside>

      <section className="flex-1 py-6 px-4 lg:px-8">
        <div className="mb-6 space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-[140px] animate-pulse rounded bg-muted" />
            <div className="h-10 w-[140px] animate-pulse rounded bg-muted" />
            <div className="h-10 w-[140px] animate-pulse rounded bg-muted" />
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
