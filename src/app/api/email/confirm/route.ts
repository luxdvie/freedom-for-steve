import { NextRequest, NextResponse } from "next/server";
import {
  confirmAnonSubscriber,
  verifySubscriberToken,
} from "@/lib/subscribers";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const token = request.nextUrl.searchParams.get("token");

  if (!id || !token) {
    return htmlResponse("Invalid link", "This confirmation link is invalid.");
  }

  if (!verifySubscriberToken(id, "confirm", token)) {
    return htmlResponse("Invalid link", "This confirmation link is invalid or has expired.");
  }

  const success = await confirmAnonSubscriber(id);
  if (!success) {
    return htmlResponse("Not found", "This subscription was not found. It may have already been removed.");
  }

  return htmlResponse(
    "Subscribed!",
    "You're now subscribed to Steve's posts. You'll get an email whenever he publishes something new."
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
