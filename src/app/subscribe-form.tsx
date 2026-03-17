"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again later.");
    }
  }

  return (
    <div className="mt-12 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <p className="mb-1 font-mono text-sm text-green-400">
        {">"} subscribe to steve&apos;s posts
      </p>
      <p className="mb-4 text-sm text-zinc-500">
        No spam. Unsubscribe anytime.
      </p>

      {status === "success" ? (
        <p className="font-mono text-sm text-green-400">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-green-400/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded bg-green-400 px-4 py-2 font-mono text-sm font-bold text-black transition-colors hover:bg-green-300 disabled:opacity-50"
          >
            {status === "loading" ? "..." : "subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p className="mt-2 font-mono text-sm text-red-400">{message}</p>
      )}

      <p className="mt-3 text-xs text-zinc-600">
        By subscribing you agree to our{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-green-400">
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
