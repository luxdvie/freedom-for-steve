"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

interface Comment {
  id: string;
  githubUsername: string;
  githubAvatar: string;
  content: string;
  createdAt: string;
}

export default function Comments({ slug }: { slug: string }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/comments?slug=${slug}`, { cache: "no-store" }).then((r) =>
        r.json()
      ),
    ]).then(([authData, commentsData]) => {
      setUser(authData.user);
      setComments(commentsData);
      setLoading(false);
    });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, content: content.trim() }),
    });

    if (res.ok) {
      setContent("");
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="mt-16 border-t border-zinc-800 pt-12">
        <p className="font-mono text-sm text-green-400/70">
          {">"} loading comments...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16 border-t border-zinc-800 pt-12">
      <p className="mb-6 font-mono text-sm text-green-400/70">
        {">"} comments
      </p>

      {/* Approved comments */}
      {comments.length > 0 ? (
        <div className="mb-8 space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="mb-2 flex items-center gap-3">
                <Image
                  src={c.githubAvatar}
                  alt={c.githubUsername}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <a
                  href={`https://github.com/${c.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-green-400 hover:underline"
                >
                  @{c.githubUsername}
                </a>
                <span className="font-mono text-xs text-zinc-600">
                  {new Date(c.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-8 text-sm text-zinc-600">
          No comments yet. Be the first.
        </p>
      )}

      {/* Comment form or sign in */}
      {submitted ? (
        <div className="rounded-lg border border-green-400/30 bg-green-400/5 p-4">
          <p className="font-mono text-sm text-green-400">
            {">"} comment submitted for review
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            It&apos;ll appear here once approved.
          </p>
        </div>
      ) : user ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3 flex items-center gap-3">
            <Image
              src={user.avatar_url}
              alt={user.login}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="font-mono text-sm text-zinc-400">
              @{user.login}
            </span>
            <a
              href={`/api/auth/logout?returnTo=${pathname}`}
              className="ml-auto font-mono text-xs text-zinc-600 hover:text-zinc-400"
            >
              sign out
            </a>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a comment..."
            maxLength={5000}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-green-400/30"
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="mt-2 rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-2 font-mono text-sm text-green-400 transition-all hover:border-green-400/60 hover:bg-green-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "submitting..." : "submit"}
          </button>
        </form>
      ) : (
        <a
          href={`/api/auth/login?returnTo=${pathname}`}
          className="inline-block rounded-lg border border-zinc-700 px-4 py-2 font-mono text-sm text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200"
        >
          sign in with github to comment
        </a>
      )}
    </div>
  );
}
