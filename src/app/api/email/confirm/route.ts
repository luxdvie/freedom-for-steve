import { NextRequest } from "next/server";
import {
  confirmAnonSubscriber,
  verifySubscriberToken,
} from "@/lib/subscribers";
import { htmlResponse } from "@/lib/html";

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
