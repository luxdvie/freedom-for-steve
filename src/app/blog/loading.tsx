export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} loading steve&apos;s thoughts...
      </p>
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="mb-3 h-3 w-24 rounded bg-zinc-800" />
            <div className="mb-2 h-6 w-3/4 rounded bg-zinc-800" />
            <div className="h-4 w-full rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
