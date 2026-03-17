import { NextRequest, NextResponse } from "next/server";
import { createSession, GitHubUser, SESSION_COOKIE } from "@/lib/auth";
import { encryptEmail } from "@/lib/crypto";
import { getGitHubSubscriber, upsertGitHubSubscriber } from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnTo = request.nextUrl.searchParams.get("state") || "/blog";

  if (!code) {
    return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
  }

  // Exchange code for access token
  const tokenRes = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
  }

  // Fetch GitHub user profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const user: GitHubUser = await userRes.json();
  if (!user.login) {
    return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
  }

  // Fetch user's primary verified email and create subscriber record
  try {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails: Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }> = await emailsRes.json();
    const primaryEmail = emails.find((e) => e.primary && e.verified);

    if (primaryEmail) {
      const existing = await getGitHubSubscriber(user.login);
      if (existing) {
        // Update avatar but preserve preferences
        await upsertGitHubSubscriber({
          ...existing,
          githubAvatar: user.avatar_url,
          encryptedEmail: encryptEmail(primaryEmail.email),
        });
      } else {
        await upsertGitHubSubscriber({
          id: crypto.randomUUID(),
          githubLogin: user.login,
          githubAvatar: user.avatar_url,
          encryptedEmail: encryptEmail(primaryEmail.email),
          notifyReplies: true,
          notifyPosts: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Subscriber creation is best-effort — don't block login
  }

  const jwt = await createSession(user);

  const response = NextResponse.redirect(
    new URL(returnTo, request.nextUrl.origin)
  );
  response.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
