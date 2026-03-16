"use client";

export default function BlogError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="mb-4 font-mono text-sm text-red-400/70">
        {">"} error: failed to load posts
      </p>
      <p className="mb-6 text-zinc-400">
        Something went wrong fetching Steve&apos;s thoughts. He&apos;s probably
        fine.
      </p>
      <button
        onClick={reset}
        className="rounded-lg border border-zinc-700 px-6 py-3 font-mono text-sm text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200"
      >
        try again
      </button>
    </div>
  );
}
