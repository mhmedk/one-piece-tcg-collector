export default function Loading() {
  return (
    <main className="flex">
      <aside className="w-64 shrink-0 border-r border-gray-200 p-4">
        <h2 className="mb-4 text-lg font-semibold">Filter by Set</h2>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded bg-muted" />
          ))}
        </div>
      </aside>

      <section className="container-main flex-1 py-8">
        <h1 className="page-title text-center">One Piece TCG Collector</h1>
        <div className="mt-12 space-y-6">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="sets-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[5/7] animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
