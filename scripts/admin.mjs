#!/usr/bin/env node

/**
 * Local admin tool for Freedom for Steve.
 * Reads subscribers, comments, and posts from Vercel Blob.
 *
 * Usage:
 *   node scripts/admin.mjs subscribers    # List all subscribers
 *   node scripts/admin.mjs comments       # List all comments (across all posts)
 *   node scripts/admin.mjs comments <slug> # List comments for a specific post
 *   node scripts/admin.mjs posts          # List all posts
 *
 * Requires .env.local with BLOB_READ_WRITE_TOKEN.
 */

import { readFileSync } from "fs";
import { list } from "@vercel/blob";

// Load .env.local
const envPath = new URL("../.env.local", import.meta.url).pathname;
try {
  const envFile = readFileSync(envPath, "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.error("Could not load .env.local — run `vercel env pull` first.");
  process.exit(1);
}

async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function listBlobs(prefix) {
  let allBlobs = [];
  let cursor;
  do {
    const result = await list({ prefix, cursor });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);
  return allBlobs;
}

// ── Subscribers ──

async function showSubscribers() {
  const ghBlobs = await listBlobs("subscribers/github/");
  const anonBlobs = await listBlobs("subscribers/anon/");

  console.log(`\n  GitHub subscribers:    ${ghBlobs.length}`);
  console.log(`  Anonymous subscribers: ${anonBlobs.length}`);
  console.log(`  Total:                ${ghBlobs.length + anonBlobs.length}\n`);
}

// ── Comments ──

async function showComments(slug) {
  const prefix = slug ? `comments/${slug}/` : "comments/";
  const blobs = await listBlobs(prefix);

  if (blobs.length === 0) {
    console.log(`\nNo comments found${slug ? ` for "${slug}"` : ""}.`);
    return;
  }

  console.log(`\n=== Comments${slug ? ` for "${slug}"` : ""} (${blobs.length}) ===\n`);

  const comments = await Promise.all(blobs.map((b) => fetchBlob(b.url)));

  comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  for (const c of comments) {
    const statusIcon = c.status === "approved" ? "✅" : c.status === "rejected" ? "❌" : "⏳";
    console.log(`  ${statusIcon} @${c.githubUsername} on "${c.slug}" [${c.status}]`);
    console.log(`     ${c.content.slice(0, 120)}${c.content.length > 120 ? "..." : ""}`);
    console.log(`     ${c.createdAt}`);
    console.log();
  }
}

// ── Posts ──

async function showPosts() {
  const blobs = await listBlobs("posts/");

  if (blobs.length === 0) {
    console.log("\nNo posts found.");
    return;
  }

  console.log(`\n=== Posts (${blobs.length}) ===\n`);

  const posts = await Promise.all(blobs.map((b) => fetchBlob(b.url)));

  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  for (const p of posts) {
    console.log(`  "${p.title}" [${p.slug}]`);
    console.log(`     ${p.createdAt}`);
    console.log(`     ${p.content.slice(0, 100)}${p.content.length > 100 ? "..." : ""}`);
    console.log();
  }
}

// ── Main ──

const [command, arg] = process.argv.slice(2);

if (!command || !["subscribers", "comments", "posts"].includes(command)) {
  console.log("Usage:");
  console.log("  node scripts/admin.mjs subscribers");
  console.log("  node scripts/admin.mjs comments [slug]");
  console.log("  node scripts/admin.mjs posts");
  process.exit(0);
}

if (command === "subscribers") await showSubscribers();
if (command === "comments") await showComments(arg);
if (command === "posts") await showPosts();
