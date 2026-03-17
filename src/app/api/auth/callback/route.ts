import { NextRequest, NextResponse } from "next/server";
import { createSession, GitHubUser, SESSION_COOKIE } from "@/lib/auth";

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
