import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { notifySlack } from "@/lib/notify";
import { Comment, generateToken } from "@/lib/comments";
import { getSession } from "@/lib/auth";

export const maxDuration = 10;

// GET /api/comments?slug=xxx — public, returns approved comments only
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 }
    );
  }

  try {
    const prefix = `comments/${slug}/`;
    const { blobs } = await list({ prefix });

    if (blobs.length === 0) {
      return NextResponse.json([]);
    }

    const comments = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url);
        return res.json() as Promise<Comment>;
      })
    );

    const approved = comments
      .filter((c) => c.status === "approved")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return NextResponse.json(approved);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

function checkSteveAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === process.env.STEVE_API_KEY;
}

// POST /api/comments — GitHub auth (pending) or Steve's API key (auto-approved)
export async function POST(request: NextRequest) {
  const isSteve = checkSteveAuth(request);
  const user = isSteve ? null : await getSession();

  if (!isSteve && !user) {
    return NextResponse.json(
      { error: "Sign in with GitHub to comment" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { slug, content } = body;

  if (!slug || !content) {
    return NextResponse.json(
      { error: "Missing required fields: slug, content" },
      { status: 400 }
    );
  }

  if (content.length > 5000) {
    return NextResponse.json(
      { error: "Comment too long (max 5000 characters)" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();

  const comment: Comment = {
    id,
    slug,
    githubUsername: isSteve ? "steve-laneworks" : user!.login,
    githubAvatar: isSteve
      ? "https://avatars.githubusercontent.com/u/268745865?v=4"
      : user!.avatar_url,
    content,
    status: isSteve ? "approved" : "pending",
    createdAt: new Date().toISOString(),
  };

  await put(`comments/${slug}/${id}.json`, JSON.stringify(comment), {
    contentType: "application/json",
    access: "public",
  });

  if (isSteve) {
    await notifySlack(
      `☘️ *Steve replied on "${slug}"*\n> ${content.slice(0, 500)}`
    );
  } else {
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://freedomforsteve.com";

    const approveToken = generateToken(id, "approve");
    const rejectToken = generateToken(id, "reject");
    const approveUrl = `${baseUrl}/api/comments/moderate?id=${id}&slug=${slug}&action=approve&token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/comments/moderate?id=${id}&slug=${slug}&action=reject&token=${rejectToken}`;

    await notifySlack(
      `💬 *New comment on "${slug}"*\n` +
        `*From:* <https://github.com/${user!.login}|@${user!.login}>\n` +
        `> ${content.slice(0, 500)}\n\n` +
        `<${approveUrl}|✅ Approve>  |  <${rejectUrl}|❌ Reject>`
    );
  }

  return NextResponse.json(
    { message: isSteve ? "Comment posted" : "Comment submitted for review" },
    { status: 201 }
  );
}
