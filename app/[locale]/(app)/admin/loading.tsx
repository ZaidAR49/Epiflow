export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-5 w-28 rounded-md bg-[var(--surface-2)]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--surface-2)]" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton (hidden on mobile, visible on desktop) */}
        <aside className="hidden lg:flex w-64 flex-col border-e border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 animate-pulse shrink-0">
          <div className="h-4 w-20 rounded bg-[var(--surface-2)] mb-4" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded-lg bg-[var(--surface-2)]/60" />
          ))}
        </aside>

        {/* Content Skeleton */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-md bg-[var(--surface-2)]" />
            <div className="h-4 w-72 rounded-md bg-[var(--surface-2)]/60" />
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between"
              >
                <div className="h-4 w-24 rounded bg-[var(--surface-2)]" />
                <div className="h-7 w-16 rounded bg-[var(--surface-2)]" />
              </div>
            ))}
          </div>

          {/* Large card table skeleton */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <div className="h-5 w-36 rounded bg-[var(--surface-2)]" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 w-full rounded-lg bg-[var(--surface-2)]/40" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
