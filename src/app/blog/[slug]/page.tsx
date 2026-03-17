import type { Metadata } from "next";
import { list } from "@vercel/blob";
import Link from "next/link";
import { notFound } from "next/navigation";
import Comments from "@/app/comments";

interface Post {
  title: string;
  content: string;
  slug: string;
  createdAt: string;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const { blobs } = await list({ prefix: `posts/${slug}.json` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { next: { revalidate: 60 } });
    return res.json() as Promise<Post>;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.content.slice(0, 160),
  };
}

export const revalidate = 60;

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/blog"
        className="mb-8 inline-block font-mono text-sm text-zinc-500 hover:text-green-400"
      >
        &larr; back to blog
      </Link>
      <time className="block font-mono text-xs text-zinc-500">
        {new Date(post.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <h1 className="mt-2 mb-8 text-4xl font-bold text-white">{post.title}</h1>
      <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>
      <Comments />
    </div>
  );
}
