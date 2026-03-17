import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

const SESSION_COOKIE = "steve_session";

function getSecret() {
  const secret = process.env.COMMENT_SECRET;
  if (!secret) throw new Error("COMMENT_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: GitHubUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    login: user.login,
    avatar_url: user.avatar_url,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function getSession(): Promise<GitHubUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as number,
      login: payload.login as string,
      avatar_url: payload.avatar_url as string,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
