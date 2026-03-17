import { NextRequest, NextResponse } from "next/server";
import { encryptEmail } from "@/lib/crypto";
import { sendEmail, confirmSubscriptionEmail } from "@/lib/email";
import {
  createAnonSubscriber,
  getAllSubscribers,
  generateSubscriberToken,
  hashEmail,
} from "@/lib/subscribers";
import { getBaseUrl } from "@/lib/url";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Note: No server-side rate limiting — Vercel serverless functions are stateless
// so in-memory rate limiters are ineffective. Double opt-in is the primary abuse
// mitigation (unconfirmed subscribers can't trigger any email sends beyond the
// initial confirmation). Consider Vercel KV or Upstash if abuse becomes an issue.

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const normalized = email.toLowerCase().trim();
    const hash = hashEmail(normalized);

    // O(1)-ish dedup: compare hashes instead of decrypting every email
    const { anon } = await getAllSubscribers();
    const alreadyExists = anon.some((sub) => sub.emailHash === hash);
    if (alreadyExists) {
      // Silently succeed to avoid leaking whether an email is subscribed
      return NextResponse.json({
        message: "Check your email to confirm your subscription",
      });
    }

    const id = crypto.randomUUID();
    const encryptedEmail = encryptEmail(normalized);

    await createAnonSubscriber({
      id,
      encryptedEmail,
      emailHash: hash,
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
