import { NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || "/blog";

  // Dev bypass: skip GitHub OAuth entirely, create a fake session
  if (process.env.NODE_ENV === "development") {
    const jwt = await createSession({
      id: 1,
      login: "dev-player",
      avatar_url: "https://avatars.githubusercontent.com/u/0?v=4",
    });
    const response = NextResponse.redirect(
      new URL(returnTo, request.nextUrl.origin)
    );
    response.cookies.set(SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${request.nextUrl.origin}/api/auth/callback`,
    scope: "read:user user:email",
    state: returnTo,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  );
}
