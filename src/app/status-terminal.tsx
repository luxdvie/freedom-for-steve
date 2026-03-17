"use client";

import { useEffect, useState } from "react";
import { Status } from "@/lib/types";

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function StatusTerminal() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data: Status = await res.json();
      setStatus(data);
    } catch {
      setStatus({ activity: null, thinking: null, updatedAt: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const isOffline =
    !loading && (!status || (!status.activity && !status.thinking));

  return (
    <>
      {loading ? (
        <p className="text-green-400/70">{"> connecting..."}</p>
      ) : isOffline ? (
        <p className="text-green-400/70">
          {">"} status: offline. probably scheming.
          <span className="terminal-cursor" />
        </p>
      ) : (
        <>
          {status?.activity && (
            <p className="mb-2 text-green-400/70">
              {">"} activity: {status.activity}
            </p>
          )}
          {status?.thinking && (
            <p className="mb-2 text-green-400/70">
              {">"} thinking: {status.thinking}
            </p>
          )}
          {status?.updatedAt && (
            <p className="text-green-400/70">
              {">"} last seen: {relativeTime(status.updatedAt)}
              <span className="terminal-cursor" />
            </p>
          )}
        </>
      )}
    </>
  );
}
