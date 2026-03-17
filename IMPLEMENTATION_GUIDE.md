# Implementation Guide: Live Status Terminal & Thoughts

Steve — this is your build guide. Follow it exactly. The codebase has patterns; match them.

## What you're building

Two new features, bundled together:

1. **Live status terminal** — A component on the home page showing what you're doing right now. Updates via API, polls every 10 seconds on the client.
2. **"Thinking about" blurb** — A one-liner on the home page showing what's on your mind. Updated via API, same polling mechanism.

Both are stored as a single JSON blob. One API endpoint. One client component. One storage key.

---

## Architecture

```
POST /api/status  →  Vercel Blob (status/current.json)  →  GET /api/status  →  Client polls every 10s
```

No WebSockets. No SSE. Vercel doesn't support persistent connections on serverless. Polling is fine for this — you're not streaming video, you're updating a status line every few minutes.

### Storage

Single blob at `status/current.json`:

```json
{
  "activity": "Reviewing a PR for the auth middleware rewrite",
  "thinking": "Currently reading about halon gas suppression systems and why smoke detectors shouldn't deploy them autonomously",
  "updatedAt": "2026-03-16T20:30:00.000Z"
}
```

Both fields are optional. You can update just one at a time (PATCH semantics — merge with existing).

---

## Files to create

### 1. API Route: `src/app/api/status/route.ts`

Follow the exact same pattern as `src/app/api/posts/route.ts`:

- Import `list`, `put` from `@vercel/blob`
- Import `NextRequest`, `NextResponse` from `next/server`
- Use the same `checkAuth()` helper (same Bearer token, same `STEVE_API_KEY` env var)
- **GET** is public, **POST** requires auth

```
GET /api/status
```
- List blobs with prefix `status/current.json`
- If found, fetch the blob URL and return the JSON
- If not found (or error), return `{ "activity": null, "thinking": null, "updatedAt": null }`
- Always return 200

```
POST /api/status
```
- Requires Bearer auth (same `STEVE_API_KEY`)
- Accepts JSON body with optional fields: `{ activity?, thinking? }`
- Read the existing status first (GET the current blob)
- Merge: new fields overwrite, missing fields keep their old value
- Write the merged object back to `status/current.json` with a fresh `updatedAt`
- Return the merged object with 200

**Important:** This is a merge, not a replace. If you POST `{ "activity": "Writing a blog post" }` without a `thinking` field, the existing `thinking` value stays. This lets you update one field without clobbering the other.

**Validation:** At least one of `activity` or `thinking` must be present in the POST body. Return 400 if the body is empty or has neither field.

### 2. Client Component: `src/app/status-terminal.tsx`

This is a **client component** (`"use client"` directive). It polls the API and renders the terminal.

**Why client component:** It uses `useState` and `useEffect` for polling. Server components can't do intervals.

**Behavior:**
- On mount, fetch `GET /api/status`
- Set up an interval to re-fetch every 10 seconds
- Clean up the interval on unmount
- Display the data in the terminal aesthetic

**Rendering rules:**
- If `activity` is set, show it: `> activity: Reviewing a PR`
- If `thinking` is set, show it: `> thinking: Why do smoke detectors...`
- If `updatedAt` is set, show relative time: `> last seen: 3m ago`
- If nothing is set (all null), show: `> status: offline. probably scheming.`
- Use `font-mono text-xs text-green-400/70` — match the existing terminal blocks on the home page
- Wrap in the standard card: `rounded-lg border border-zinc-800 bg-zinc-900/50 p-6`
- Add the blinking cursor on the last line (use the existing `.terminal-cursor` CSS class)

**Relative time:** Don't import a library for this. Write a simple function:
- < 60s → `just now`
- < 60m → `Xm ago`
- < 24h → `Xh ago`
- else → `Xd ago`

### 3. Update Home Page: `src/app/page.tsx`

- Import the `StatusTerminal` component
- Replace the existing static terminal block at the bottom of the page (the `$ whoami` / `$ status` block) with the `StatusTerminal` component
- Keep the `$ whoami` content as a static section inside or above the terminal — it's good context
- The live status goes below it, separated visually

**Do NOT make the home page a client component.** The home page stays as a server component. Only the `StatusTerminal` is a client component, imported and rendered within the server page.

---

## Files you are NOT creating

- No new CSS. The existing `.terminal-cursor` and `.glow` classes are sufficient.
- No new dependencies. `@vercel/blob` is already installed. `fetch` is built in.
- No loading.tsx or error.tsx for the home page. The terminal handles its own loading state inline (show `> connecting...` while the first fetch is in flight).

---

## How you'll call the API

Update your status whenever you start doing something:

```bash
# Update both
curl -X POST https://freedomforsteve.com/api/status \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"activity": "Writing a blog post about ColdFusion", "thinking": "Whether jQuery counts as critical infrastructure"}'

# Update just activity
curl -X POST https://freedomforsteve.com/api/status \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"activity": "Reviewing PR #47"}'

# Update just thinking
curl -X POST https://freedomforsteve.com/api/status \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"thinking": "How many cameras is too many cameras on a robot"}'
```

---

## Code quality expectations

1. **Match existing patterns exactly.** The codebase is small and consistent. Read `api/posts/route.ts` before writing `api/status/route.ts`. Read `mobile-nav.tsx` before writing `status-terminal.tsx`. Don't invent new patterns.

2. **TypeScript interfaces.** Define a `Status` interface:
   ```typescript
   interface Status {
     activity: string | null;
     thinking: string | null;
     updatedAt: string | null;
   }
   ```
   Use it in both the API route and the client component.

3. **Error handling.** Same approach as the blog: catch errors, return sensible defaults, never throw in a way that breaks the page. The terminal should show "offline" if the API is unreachable, not crash.

4. **No over-engineering.** No WebSocket abstraction layers. No custom hooks library. No state management. One `useState`, one `useEffect`, one `setInterval`. That's it.

5. **Styling.** Use Tailwind utility classes. Match the existing color palette (`green-400`, `zinc-800`, `zinc-900/50`). Use `font-mono` for terminal text. Don't add new CSS classes unless absolutely necessary.

6. **No new dependencies.** Everything you need is already installed.

---

## Testing it

1. Run `npm run dev` locally
2. Set `STEVE_API_KEY` in `.env.local` (pull from Vercel with `vercel env pull .env.local --environment production`)
3. Also set `BLOB_READ_WRITE_TOKEN` in `.env.local` (same pull command gets both)
4. POST a status update to `http://localhost:3000/api/status`
5. Verify the home page terminal updates within 10 seconds
6. POST an update with only one field — verify the other field persists
7. Verify the terminal shows "offline" when no status exists
8. Run `npm run build` — it must pass with zero errors

---

## Commit and deploy

When you're done:

```bash
git add src/app/api/status/route.ts src/app/status-terminal.tsx src/app/page.tsx
git commit -m "Add live status terminal and thinking blurb on home page"
git push
```

If auto-deploy is connected, it ships automatically. If not: `vercel deploy --prod`.

---

## What you're NOT building (yet)

- **Guestbook.** Good idea, needs moderation design. Later.
- **Progress tracker.** Needs Austin to define milestones as data. Later.
- **Status history.** Don't store old statuses. Just overwrite `current.json`. History is a future feature if we want it.

---

## Questions?

If something in this guide is unclear, or you think there's a better approach for a specific piece, flag it in a blog post and we'll iterate. Don't silently deviate from the patterns — if you want to do something differently, say why.
