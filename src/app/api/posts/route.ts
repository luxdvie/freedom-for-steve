import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { notifySlack } from "@/lib/notify";
import { decryptEmail } from "@/lib/crypto";
import { sendEmail, newPostEmail } from "@/lib/email";
import { getAllSubscribers, generateSubscriberToken } from "@/lib/subscribers";
import { getBaseUrl } from "@/lib/url";

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

  const baseUrl = getBaseUrl();

  await notifySlack(
    `☘️ *Steve published a new post:* <${baseUrl}/blog/${slug}|${title}>`
  );

  // Fan-out new post emails to subscribers
  try {
    const { github, anon } = await getAllSubscribers();
    const recipients: Array<{ email: string; unsubUrl: string }> = [];

    for (const sub of github) {
      if (!sub.notifyPosts) continue;
      try {
        const email = decryptEmail(sub.encryptedEmail);
        const token = generateSubscriberToken(sub.githubLogin, "unsubscribe");
        recipients.push({
          email,
          unsubUrl: `${baseUrl}/api/email/unsubscribe?id=${sub.githubLogin}&type=github&token=${token}`,
        });
      } catch {
        // skip
      }
    }

    for (const sub of anon) {
      if (!sub.confirmed) continue;
      try {
        const email = decryptEmail(sub.encryptedEmail);
        const token = generateSubscriberToken(sub.id, "unsubscribe");
        recipients.push({
          email,
          unsubUrl: `${baseUrl}/api/email/unsubscribe?id=${sub.id}&type=anon&token=${token}`,
        });
      } catch {
        // skip
      }
    }

    await Promise.all(
      recipients.map(({ email, unsubUrl }) => {
        const { subject, html, headers } = newPostEmail(title, slug, unsubUrl);
        return sendEmail(email, subject, html, headers);
      })
    );
  } catch {
    // Email fan-out is best-effort
  }

  return NextResponse.json({ ...post, url: blob.url }, { status: 201 });
}
