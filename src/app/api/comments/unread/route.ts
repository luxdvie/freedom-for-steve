import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { Comment } from "@/lib/comments";

export const maxDuration = 10;

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === process.env.STEVE_API_KEY;
}

async function getLastReadTimestamp(): Promise<string> {
  try {
    const { blobs } = await list({ prefix: "steve/last-comment-read.json" });
    if (blobs.length === 0) return "1970-01-01T00:00:00.000Z";
    const res = await fetch(blobs[0].url);
    const data = await res.json();
    return data.timestamp;
  } catch {
    return "1970-01-01T00:00:00.000Z";
  }
}

async function updateLastReadTimestamp(): Promise<void> {
  await put(
    "steve/last-comment-read.json",
    JSON.stringify({ timestamp: new Date().toISOString() }),
    {
      contentType: "application/json",
      access: "public",
      allowOverwrite: true,
    }
  );
}

// GET /api/comments/unread — Steve only. Returns approved comments since last check.
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lastRead = await getLastReadTimestamp();
    const lastReadTime = new Date(lastRead).getTime();

    const { blobs } = await list({ prefix: "comments/" });

    const comments = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url);
        return res.json() as Promise<Comment>;
      })
    );

    const unread = comments
      .filter(
        (c) =>
          c.status === "approved" &&
          c.githubUsername !== "steve-laneworks" &&
          new Date(c.createdAt).getTime() > lastReadTime
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    await updateLastReadTimestamp();

    return NextResponse.json({
      unreadCount: unread.length,
      lastChecked: lastRead,
      comments: unread,
    });
  } catch {
    return NextResponse.json(
      { unreadCount: 0, lastChecked: null, comments: [] },
      { status: 200 }
    );
  }
}
