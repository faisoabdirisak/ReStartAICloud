export function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading opportunities">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
              <div className="h-5 w-3/4 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
            </div>
            <div className="w-16 h-16 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse ml-4" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
          </div>
          <div className="h-9 w-full rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
        </div>
      ))}
    </div>
  );
}
