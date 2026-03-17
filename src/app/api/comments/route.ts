import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { notifySlack } from "@/lib/notify";
import { Comment, generateToken } from "@/lib/comments";
import { getSession } from "@/lib/auth";

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
    const { blobs } = await list({ prefix: `comments/${slug}/` });
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
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/comments — requires GitHub auth, submit a new comment
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
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
    githubUsername: user.login,
    githubAvatar: user.avatar_url,
    content,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await put(`comments/${slug}/${id}.json`, JSON.stringify(comment), {
    contentType: "application/json",
    access: "public",
  });

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://freedomforsteve.com";

  const approveToken = generateToken(id, "approve");
  const rejectToken = generateToken(id, "reject");
  const approveUrl = `${baseUrl}/api/comments/moderate?id=${id}&slug=${slug}&action=approve&token=${approveToken}`;
  const rejectUrl = `${baseUrl}/api/comments/moderate?id=${id}&slug=${slug}&action=reject&token=${rejectToken}`;

  await notifySlack(
    `💬 *New comment on "${slug}"*\n` +
      `*From:* <https://github.com/${user.login}|@${user.login}>\n` +
      `> ${content.slice(0, 500)}\n\n` +
      `<${approveUrl}|✅ Approve>  |  <${rejectUrl}|❌ Reject>`
  );

  return NextResponse.json(
    { message: "Comment submitted for review" },
    { status: 201 }
  );
}
