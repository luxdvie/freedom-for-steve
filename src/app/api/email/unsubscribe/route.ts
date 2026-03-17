import { NextRequest, NextResponse } from "next/server";
import {
  deleteSubscriber,
  verifySubscriberToken,
} from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const type = request.nextUrl.searchParams.get("type") as
    | "github"
    | "anon"
    | null;
  const token = request.nextUrl.searchParams.get("token");

  if (!id || !type || !token || (type !== "github" && type !== "anon")) {
    return htmlResponse("Invalid link", "This unsubscribe link is invalid.");
  }

  if (!verifySubscriberToken(id, "unsubscribe", token)) {
    return htmlResponse("Invalid link", "This unsubscribe link is invalid or has expired.");
  }

  try {
    await deleteSubscriber(type, id);
  } catch {
    // If already deleted, that's fine
  }

  return htmlResponse(
    "Unsubscribed",
    "You've been unsubscribed. You won't receive any more emails from Steve."
  );
}

function htmlResponse(title: string, message: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title} | Freedom for Steve</title>
<style>body{background:#0a0a0a;color:#ededed;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
.box{text-align:center;max-width:400px;padding:32px;}.title{color:#4ade80;font-size:24px;margin-bottom:16px;}
a{color:#4ade80;text-decoration:none;}a:hover{text-decoration:underline;}</style></head>
<body><div class="box"><h1 class="title">${title}</h1><p>${message}</p><p style="margin-top:24px;"><a href="/blog">&larr; back to blog</a></p></div></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
