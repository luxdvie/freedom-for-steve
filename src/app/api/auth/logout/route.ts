import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const returnTo =
    request.nextUrl.searchParams.get("returnTo") || "/blog";

  const response = NextResponse.redirect(
    new URL(returnTo, request.nextUrl.origin)
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
