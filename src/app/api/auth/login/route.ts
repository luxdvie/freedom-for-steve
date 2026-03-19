import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured" },
      { status: 500 }
    );
  }

  // Store the page the user came from so we can redirect back
  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || "/blog";

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
