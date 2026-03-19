import { NextRequest, NextResponse } from "next/server";
import { getSession, checkSteveAuth } from "@/lib/auth";
import { getGame } from "@/lib/games";

export const dynamic = "force-dynamic";

// GET /api/games/[gameId] — get game state (read-only, no writes)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const isSteve = checkSteveAuth(request);
  const user = isSteve ? null : await getSession();

  if (!isSteve && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const game = await getGame(gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (!isSteve && game.player.githubLogin !== user!.login) {
    return NextResponse.json({ error: "Not your game" }, { status: 403 });
  }

  return NextResponse.json(game, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
