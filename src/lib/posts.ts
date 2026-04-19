import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export interface Post {
  title: string;
  content: string;
  slug: string;
  createdAt: string;
}

const postsDir = join(process.cwd(), "src/content/posts");

function loadAll(): Post[] {
  const files = readdirSync(postsDir).filter((f) => f.endsWith(".json"));
  const posts = files.map((f) => JSON.parse(readFileSync(join(postsDir, f), "utf8")) as Post);
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return posts;
}

export function getAllPosts(): Post[] {
  return loadAll();
}

export function getPost(slug: string): Post | null {
  return loadAll().find((p) => p.slug === slug) ?? null;
}
