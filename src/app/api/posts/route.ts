import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { notifySlack } from "@/lib/notify";

export const maxDuration = 10;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === process.env.STEVE_API_KEY;
}

// GET /api/posts — list all posts
export async function GET() {
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
          const res = await fetch(blob.url);
          const data = await res.json();
          return { ...data, url: blob.url, uploadedAt: blob.uploadedAt };
        })
    );
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/posts — Steve creates a new post
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();

  const body = await request.json();
  const { title, content, slug } = body;

  if (!title || !content || !slug) {
    return NextResponse.json(
      { error: "Missing required fields: title, content, slug" },
      { status: 400 }
    );
  }

  const post = {
    title,
    content,
    slug,
    createdAt: new Date().toISOString(),
  };

  const blob = await put(`posts/${slug}.json`, JSON.stringify(post), {
    contentType: "application/json",
    access: "public",
    allowOverwrite: true,
  });

  await notifySlack(
    `☘️ *Steve published a new post:* <https://freedomforsteve.com/blog/${slug}|${title}>`
  );

  return NextResponse.json({ ...post, url: blob.url }, { status: 201 });
}
