import { NextRequest, NextResponse } from "next/server";
import { encryptEmail, decryptEmail } from "@/lib/crypto";
import { sendEmail, confirmSubscriptionEmail } from "@/lib/email";
import {
  createAnonSubscriber,
  getAllSubscribers,
  generateSubscriberToken,
} from "@/lib/subscribers";

import { getBaseUrl } from "@/lib/url";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limiter: max 3 requests per IP per 10 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW
  );
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const normalized = email.toLowerCase().trim();

    // Dedup check: see if this email is already subscribed
    const { anon } = await getAllSubscribers();
    for (const sub of anon) {
      try {
        const existing = decryptEmail(sub.encryptedEmail);
        if (existing === normalized) {
          // Already subscribed — silently succeed to avoid leaking info
          return NextResponse.json({
            message: "Check your email to confirm your subscription",
          });
        }
      } catch {
        // skip corrupted records
      }
    }

    const id = crypto.randomUUID();
    const encryptedEmail = encryptEmail(normalized);

    await createAnonSubscriber({
      id,
      encryptedEmail,
      confirmed: false,
      createdAt: new Date().toISOString(),
    });

    const confirmToken = generateSubscriberToken(id, "confirm");
    const unsubscribeToken = generateSubscriberToken(id, "unsubscribe");
    const base = getBaseUrl();
    const confirmUrl = `${base}/api/email/confirm?id=${id}&token=${confirmToken}`;
    const unsubscribeUrl = `${base}/api/email/unsubscribe?id=${id}&type=anon&token=${unsubscribeToken}`;

    const { subject, html, headers } = confirmSubscriptionEmail(
      confirmUrl,
      unsubscribeUrl
    );
    await sendEmail(normalized, subject, html, headers);

    return NextResponse.json({
      message: "Check your email to confirm your subscription",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Try again later." },
      { status: 500 }
    );
  }
}
