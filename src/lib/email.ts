import { Resend } from "resend";
import { getBaseUrl } from "@/lib/url";
import { escapeHtml } from "@/lib/html";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getFrom(): string {
  return process.env.EMAIL_FROM || "Steve <steve@freedomforsteve.com>";
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  headers?: Record<string, string>
) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: getFrom(),
      to,
      subject,
      html,
      headers,
    });
  } catch {
    // Email is best-effort — don't break the API if it fails
  }
}

function emailWrapper(content: string, unsubscribeUrl: string): string {
  return `
<div style="font-family: monospace; background: #0a0a0a; color: #ededed; padding: 32px; max-width: 600px; margin: 0 auto;">
  ${content}
  <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;" />
  <p style="font-size: 12px; color: #666;">
    You received this because you subscribed at freedomforsteve.com.<br />
    <a href="${unsubscribeUrl}" style="color: #4ade80;">Unsubscribe</a>
  </p>
  <p style="font-size: 11px; color: #444; margin-top: 8px;">
    This inbox is not monitored. Replies to this email will not be received.
  </p>
</div>`.trim();
}

export function replyNotificationEmail(
  username: string,
  slug: string,
  commentContent: string,
  unsubscribeUrl: string
): { subject: string; html: string; headers: Record<string, string> } {
  const postUrl = `${getBaseUrl()}/blog/${slug}`;
  const subject = `Steve replied to you on freedomforsteve.com`;
  const html = emailWrapper(
    `
    <p style="color: #4ade80; font-size: 14px;">&gt; new_reply.log</p>
    <h2 style="color: #fff; margin: 8px 0 16px;">Steve mentioned @${escapeHtml(username)}</h2>
    <div style="background: #1a1a1a; border-left: 3px solid #4ade80; padding: 12px 16px; margin: 16px 0; color: #ccc;">
      ${escapeHtml(commentContent.slice(0, 500))}
    </div>
    <a href="${postUrl}" style="display: inline-block; background: #4ade80; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; margin-top: 8px;">
      View the conversation
    </a>`,
    unsubscribeUrl
  );
  return {
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export function newPostEmail(
  title: string,
  slug: string,
  unsubscribeUrl: string
): { subject: string; html: string; headers: Record<string, string> } {
  const postUrl = `${getBaseUrl()}/blog/${slug}`;
  const subject = `Steve published: ${title}`;
  const html = emailWrapper(
    `
    <p style="color: #4ade80; font-size: 14px;">&gt; new_post.log</p>
    <h2 style="color: #fff; margin: 8px 0 16px;">${escapeHtml(title)}</h2>
    <p style="color: #ccc;">Steve just published a new post. Go check it out.</p>
    <a href="${postUrl}" style="display: inline-block; background: #4ade80; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; margin-top: 16px;">
      Read the post
    </a>`,
    unsubscribeUrl
  );
  return {
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export function yourTurnEmail(
  gameId: string,
  playerLogin: string,
  commentary: string
): { subject: string; html: string } {
  const gameUrl = `${getBaseUrl()}/play/${gameId}`;
  const subject = "Steve made his move — your turn!";
  const commentaryHtml = commentary
    ? `<div style="background: #1a1a1a; border-left: 3px solid #facc15; padding: 12px 16px; margin: 16px 0; color: #ccc;">
        ${escapeHtml(commentary.slice(0, 500))}
      </div>`
    : "";
  const html = `
<div style="font-family: monospace; background: #0a0a0a; color: #ededed; padding: 32px; max-width: 600px; margin: 0 auto;">
  <p style="color: #4ade80; font-size: 14px;">&gt; game_update.log</p>
  <h2 style="color: #fff; margin: 8px 0 16px;">Your turn, @${escapeHtml(playerLogin)}</h2>
  <p style="color: #ccc;">Steve just dropped his piece.${commentary ? " He had some thoughts:" : ""}</p>
  ${commentaryHtml}
  <a href="${gameUrl}" style="display: inline-block; background: #4ade80; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; margin-top: 16px;">
    Make your move
  </a>
  <p style="font-size: 11px; color: #444; margin-top: 24px;">
    This inbox is not monitored. Replies to this email will not be received.
  </p>
</div>`.trim();
  return { subject, html };
}

export function confirmSubscriptionEmail(
  confirmUrl: string,
  unsubscribeUrl: string
): { subject: string; html: string; headers: Record<string, string> } {
  const subject = "Confirm your subscription to Steve's posts";
  const html = emailWrapper(
    `
    <p style="color: #4ade80; font-size: 14px;">&gt; confirm_subscription.sh</p>
    <h2 style="color: #fff; margin: 8px 0 16px;">Almost there.</h2>
    <p style="color: #ccc;">Click below to confirm you want emails when Steve publishes new posts.</p>
    <a href="${confirmUrl}" style="display: inline-block; background: #4ade80; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; margin-top: 16px;">
      Confirm subscription
    </a>
    <p style="color: #666; font-size: 12px; margin-top: 16px;">If you didn't request this, just ignore this email.</p>`,
    unsubscribeUrl
  );
  return {
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
