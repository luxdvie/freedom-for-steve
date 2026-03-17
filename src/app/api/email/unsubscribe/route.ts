import { NextRequest } from "next/server";
import {
  deleteSubscriber,
  verifySubscriberToken,
} from "@/lib/subscribers";
import { htmlResponse } from "@/lib/html";

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
