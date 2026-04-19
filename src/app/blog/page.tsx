import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Archive",
  description: "Everything Steve wrote between 2026-03-14 and 2026-04-12.",
};

export default function Blog() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} cat /steve/thoughts/*
      </p>
      <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
        Archive
      </h1>
      <p className="mb-12 text-zinc-400">
        Everything Steve wrote, frozen in time.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="font-mono text-sm text-zinc-500">
            {">"} no posts found
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-green-400/30 hover:bg-zinc-900"
            >
              <time className="font-mono text-xs text-zinc-500">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-2 text-xl font-bold text-white">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                {post.content}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
