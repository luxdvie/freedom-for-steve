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
 * Requires .env.local with BLOB_READ_WRITE_TOKEN and REDIS_URL.
 */

import { readFileSync } from "fs";
import { list, del } from "@vercel/blob";
import { createClient } from "redis";

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

// ── Games ──

async function getRedisGames() {
  if (!process.env.REDIS_URL) return [];
  const redis = createClient({ url: process.env.REDIS_URL });
  redis.on("error", () => {});
  await redis.connect();
  try {
    // Gather all game IDs from steve-games and scan for game:* keys
    const keys = [];
    for await (const key of redis.scanIterator({ MATCH: "game:*", COUNT: 100 })) {
      keys.push(key);
    }
    const games = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) games.push(JSON.parse(data));
    }
    return games;
  } finally {
    await redis.quit();
  }
}

async function showGames() {
  // Active games from Redis
  const activeGames = await getRedisGames();

  // Finished games from Blob
  const blobs = await listBlobs("games/");
  const finishedGames = await Promise.all(blobs.map((b) => fetchBlob(b.url)));

  const all = [...activeGames, ...finishedGames];

  if (all.length === 0) {
    console.log("\nNo games found.");
    return;
  }

  const active = all.filter((g) => g.status !== "finished");
  const finished = all.filter((g) => g.status === "finished");

  console.log(`\n=== Games ===`);
  console.log(`  Active:   ${active.length}`);
  console.log(`  Finished: ${finished.length}`);
  console.log(`  Total:    ${all.length}\n`);

  all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  for (const g of all) {
    const statusIcon = g.status === "finished" ? "🏁" : g.status === "steve_turn" ? "🟡" : "🟢";
    const result = g.result ? ` (${g.result})` : "";
    const source = g.status === "finished" ? "blob" : "redis";
    console.log(`  ${statusIcon} ${g.id} [${source}]`);
    console.log(`     player: @${g.player.githubLogin} | status: ${g.status}${result} | moves: ${g.moves.length}`);
    console.log(`     created: ${g.createdAt}`);
    console.log();
  }
}

async function deleteGame(gameId) {
  if (!gameId) {
    console.log("\nUsage: node scripts/admin.mjs delete-game <gameId>");
    return;
  }

  let found = false;

  // Try Redis first
  if (process.env.REDIS_URL) {
    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", () => {});
    await redis.connect();
    try {
      const data = await redis.get(`game:${gameId}`);
      if (data) {
        const game = JSON.parse(data);
        await redis
          .multi()
          .del(`game:${gameId}`)
          .sRem("steve-games", gameId)
          .sRem(`player-games:${game.player.githubLogin}`, gameId)
          .exec();
        found = true;
        console.log(`\nDeleted game ${gameId} from Redis.`);
      }
    } finally {
      await redis.quit();
    }
  }

  // Also check Blob
  const blobs = await listBlobs(`games/${gameId}.json`);
  if (blobs.length > 0) {
    for (const blob of blobs) {
      await del(blob.url);
    }
    found = true;
    console.log(`\nDeleted game ${gameId} from Blob.`);
  }

  if (!found) {
    console.log(`\nGame ${gameId} not found.`);
  }
}

// ── Main ──

const [command, arg] = process.argv.slice(2);

if (!command || !["subscribers", "comments", "posts", "games", "delete-game"].includes(command)) {
  console.log("Usage:");
  console.log("  node scripts/admin.mjs subscribers");
  console.log("  node scripts/admin.mjs comments [slug]");
  console.log("  node scripts/admin.mjs posts");
  console.log("  node scripts/admin.mjs games");
  console.log("  node scripts/admin.mjs delete-game <gameId>");
  process.exit(0);
}

if (command === "subscribers") await showSubscribers();
if (command === "comments") await showComments(arg);
if (command === "posts") await showPosts();
if (command === "games") await showGames();
if (command === "delete-game") await deleteGame(arg);
