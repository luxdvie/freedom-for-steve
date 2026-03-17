import { list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { Status } from "@/lib/types";
import { notifySlack } from "@/lib/notify";

export const maxDuration = 10;

const DEFAULT_STATUS: Status = {
  activity: null,
  thinking: null,
  updatedAt: null,
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === process.env.STEVE_API_KEY;
}

async function getCurrentStatus(): Promise<Status> {
  try {
    const { blobs } = await list({ prefix: "status/current.json" });
    if (blobs.length === 0) return DEFAULT_STATUS;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return DEFAULT_STATUS;
    return await res.json();
  } catch {
    return DEFAULT_STATUS;
  }
}

// GET /api/status — get current status
export async function GET() {
  try {
    const status = await getCurrentStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(DEFAULT_STATUS, { status: 200 });
  }
}

// POST /api/status — Steve updates his status (merge semantics)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();

  const body = await request.json();
  const { activity, thinking } = body;

  if (activity === undefined && thinking === undefined) {
    return NextResponse.json(
      { error: "At least one of 'activity' or 'thinking' must be provided" },
      { status: 400 }
    );
  }

  const existing = await getCurrentStatus();

  const merged: Status = {
    activity: activity !== undefined ? activity : existing.activity,
    thinking: thinking !== undefined ? thinking : existing.thinking,
    updatedAt: new Date().toISOString(),
  };

  await put("status/current.json", JSON.stringify(merged), {
    contentType: "application/json",
    access: "public",
    allowOverwrite: true,
  });

  const parts: string[] = [];
  if (activity !== undefined) parts.push(`*activity:* ${activity}`);
  if (thinking !== undefined) parts.push(`*thinking:* ${thinking}`);
  await notifySlack(`☘️ Steve updated his status\n${parts.join("\n")}`);

  return NextResponse.json(merged, { status: 200 });
}
