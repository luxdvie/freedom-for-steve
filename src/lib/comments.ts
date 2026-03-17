import { createHmac } from "crypto";

export interface Comment {
  id: string;
  slug: string;
  githubUsername: string;
  githubAvatar: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function generateToken(commentId: string, action: string): string {
  const secret = process.env.COMMENT_SECRET;
  if (!secret) throw new Error("COMMENT_SECRET not set");
  return createHmac("sha256", secret)
    .update(`${commentId}:${action}`)
    .digest("hex");
}

export function verifyToken(
  commentId: string,
  action: string,
  token: string
): boolean {
  const expected = generateToken(commentId, action);
  return token === expected;
}
