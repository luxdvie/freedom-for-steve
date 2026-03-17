import { NextResponse } from "next/server";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlResponse(title: string, message: string): NextResponse {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${safeTitle} | Freedom for Steve</title>
<style>body{background:#0a0a0a;color:#ededed;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
.box{text-align:center;max-width:400px;padding:32px;}.title{color:#4ade80;font-size:24px;margin-bottom:16px;}
a{color:#4ade80;text-decoration:none;}a:hover{text-decoration:underline;}</style></head>
<body><div class="box"><h1 class="title">${safeTitle}</h1><p>${safeMessage}</p><p style="margin-top:24px;"><a href="/blog">&larr; back to blog</a></p></div></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
