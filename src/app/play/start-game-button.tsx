"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartGameButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/games", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start game");
      const { gameId } = await res.json();
      router.push(`/play/${gameId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="rounded-lg border border-green-400/30 bg-green-400/10 px-6 py-3 font-mono text-sm text-green-400 transition-all hover:border-green-400/60 hover:bg-green-400/20 disabled:opacity-50"
    >
      {loading ? "starting..." : "start new game"}
    </button>
  );
}
