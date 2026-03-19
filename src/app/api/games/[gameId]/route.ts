import { NextRequest, NextResponse } from "next/server";
import { getSession, checkSteveAuth } from "@/lib/auth";
import { getGame, saveGame } from "@/lib/games";

const LAST_SEEN_THROTTLE = 60 * 1000; // Only update playerLastSeen once per minute

// GET /api/games/[gameId] — get game state
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

  // Throttle playerLastSeen updates to avoid a blob write on every poll
  if (!isSteve) {
    const now = Date.now();
    const lastSeen = game.playerLastSeen
      ? new Date(game.playerLastSeen).getTime()
      : 0;
    if (now - lastSeen > LAST_SEEN_THROTTLE) {
      game.playerLastSeen = new Date().toISOString();
      await saveGame(game);
    }
  }

  return NextResponse.json(game);
}
