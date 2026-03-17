import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { Comment, verifyToken } from "@/lib/comments";
import { notifySlack } from "@/lib/notify";

// GET /api/comments/moderate?id=xxx&slug=yyy&action=approve|reject&token=zzz
// Uses GET so it works as a clickable link in Slack
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const slug = request.nextUrl.searchParams.get("slug");
  const action = request.nextUrl.searchParams.get("action");
  const token = request.nextUrl.searchParams.get("token");

  // Block Slack's link unfurler from triggering moderation
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent.includes("Slackbot")) {
    return new NextResponse("OK", { status: 200 });
  }

  if (!id || !slug || !action || !token) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  if (action !== "approve" && action !== "reject") {
    return new NextResponse("Invalid action", { status: 400 });
  }

  if (!verifyToken(id, action, token)) {
    return new NextResponse("Invalid token", { status: 403 });
  }

  try {
    const { blobs } = await list({ prefix: `comments/${slug}/${id}.json` });
    if (blobs.length === 0) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    const res = await fetch(blobs[0].url);
    const comment: Comment = await res.json();

    // Prevent replay — only pending comments can be moderated
    if (comment.status !== "pending") {
      return new NextResponse(
        `<html>
          <body style="background:#0a0a0a;color:#ededed;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
            <div style="text-align:center">
              <h1 style="color:#facc15">Already ${comment.status}</h1>
              <p>This comment was already moderated.</p>
              <a href="https://freedomforsteve.com/blog/${slug}" style="color:#4ade80">View post</a>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    const updated: Comment = {
      ...comment,
      status: action === "approve" ? "approved" : "rejected",
    };

    await put(
      `comments/${slug}/${id}.json`,
      JSON.stringify(updated),
      {
        contentType: "application/json",
        access: "public",
        allowOverwrite: true,
      }
    );

    const verb = action === "approve" ? "approved" : "rejected";

    return new NextResponse(
      `<html>
        <body style="background:#0a0a0a;color:#ededed;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
          <div style="text-align:center">
            <h1 style="color:#4ade80">Comment ${verb}</h1>
            <p>${comment.githubUsername}: "${comment.content.slice(0, 100)}"</p>
            <a href="https://freedomforsteve.com/blog/${slug}" style="color:#4ade80">View post</a>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch {
    return new NextResponse("Error processing moderation", { status: 500 });
  }
}
