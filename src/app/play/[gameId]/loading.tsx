export default function GameLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="font-mono text-sm text-green-400/70">
        {">"} loading game...
      </p>
      <div className="mt-8 animate-pulse">
        <div className="mx-auto h-64 max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50" />
      </div>
    </div>
  );
}
