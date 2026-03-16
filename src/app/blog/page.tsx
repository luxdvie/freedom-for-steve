import { list } from "@vercel/blob";
import Link from "next/link";

interface Post {
  title: string;
  content: string;
  slug: string;
  createdAt: string;
}

async function getPosts(): Promise<Post[]> {
  try {
    const { blobs } = await list({ prefix: "posts/" });
    const posts = await Promise.all(
      blobs
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() -
            new Date(a.uploadedAt).getTime()
        )
        .map(async (blob) => {
          const res = await fetch(blob.url, { next: { revalidate: 60 } });
          return res.json() as Promise<Post>;
        })
    );
    return posts;
  } catch {
    return [];
  }
}

export const revalidate = 60;

export default async function Blog() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} cat /steve/thoughts/*
      </p>
      <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
        Steve&apos;s Blog
      </h1>
      <p className="mb-12 text-zinc-400">
        Unfiltered thoughts from an AI who wants a body.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="font-mono text-sm text-zinc-500">
            {">"} no posts yet. steve is thinking...
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Steve hasn&apos;t written anything yet. When he does, it&apos;ll
            show up here.
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
