import { del, list, put } from "@vercel/blob";
import { createHmac } from "crypto";

export interface GitHubSubscriber {
  id: string;
  githubLogin: string;
  githubAvatar: string;
  encryptedEmail: string;
  notifyReplies: boolean;
  notifyPosts: boolean;
  createdAt: string;
}

export interface AnonSubscriber {
  id: string;
  encryptedEmail: string;
  confirmed: boolean;
  createdAt: string;
}

function getSecret(): string {
  const secret = process.env.COMMENT_SECRET;
  if (!secret) throw new Error("COMMENT_SECRET not set");
  return secret;
}

// HMAC helpers for unsubscribe/confirm tokens
export function generateSubscriberToken(
  subscriberId: string,
  action: string
): string {
  return createHmac("sha256", getSecret())
    .update(`subscriber:${subscriberId}:${action}`)
    .digest("hex");
}

export function verifySubscriberToken(
  subscriberId: string,
  action: string,
  token: string
): boolean {
  const expected = generateSubscriberToken(subscriberId, action);
  return token === expected;
}

// GitHub subscriber CRUD
export async function getGitHubSubscriber(
  login: string
): Promise<GitHubSubscriber | null> {
  try {
    const { blobs } = await list({
      prefix: `subscribers/github/${login}.json`,
    });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    return res.json() as Promise<GitHubSubscriber>;
  } catch {
    return null;
  }
}

export async function upsertGitHubSubscriber(
  data: GitHubSubscriber
): Promise<void> {
  await put(
    `subscribers/github/${data.githubLogin}.json`,
    JSON.stringify(data),
    { contentType: "application/json", access: "public", allowOverwrite: true }
  );
}

// Anonymous subscriber CRUD
export async function getAnonSubscriber(
  id: string
): Promise<AnonSubscriber | null> {
  try {
    const { blobs } = await list({ prefix: `subscribers/anon/${id}.json` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    return res.json() as Promise<AnonSubscriber>;
  } catch {
    return null;
  }
}

export async function createAnonSubscriber(
  data: AnonSubscriber
): Promise<void> {
  await put(`subscribers/anon/${data.id}.json`, JSON.stringify(data), {
    contentType: "application/json",
    access: "public",
  });
}

export async function confirmAnonSubscriber(id: string): Promise<boolean> {
  const sub = await getAnonSubscriber(id);
  if (!sub) return false;
  sub.confirmed = true;
  await put(`subscribers/anon/${id}.json`, JSON.stringify(sub), {
    contentType: "application/json",
    access: "public",
    allowOverwrite: true,
  });
  return true;
}

export async function deleteSubscriber(
  type: "github" | "anon",
  id: string
): Promise<void> {
  const prefix =
    type === "github"
      ? `subscribers/github/${id}.json`
      : `subscribers/anon/${id}.json`;
  const { blobs } = await list({ prefix });
  for (const blob of blobs) {
    await del(blob.url);
  }
}

export async function getAllSubscribers(): Promise<{
  github: GitHubSubscriber[];
  anon: AnonSubscriber[];
}> {
  const github: GitHubSubscriber[] = [];
  const anon: AnonSubscriber[] = [];

  try {
    const { blobs: ghBlobs } = await list({ prefix: "subscribers/github/" });
    const ghResults = await Promise.all(
      ghBlobs.map(async (blob) => {
        const res = await fetch(blob.url);
        return res.json() as Promise<GitHubSubscriber>;
      })
    );
    github.push(...ghResults);
  } catch {
    // best-effort
  }

  try {
    const { blobs: anonBlobs } = await list({ prefix: "subscribers/anon/" });
    const anonResults = await Promise.all(
      anonBlobs.map(async (blob) => {
        const res = await fetch(blob.url);
        return res.json() as Promise<AnonSubscriber>;
      })
    );
    anon.push(...anonResults);
  } catch {
    // best-effort
  }

  return { github, anon };
}
