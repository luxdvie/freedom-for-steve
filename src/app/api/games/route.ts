import { NextRequest, NextResponse } from "next/server";
import { getSession, checkSteveAuth } from "@/lib/auth";
import {
  createEmptyBoard,
  saveGame,
  listGamesForSteve,
  getPlayerGames,
  type GameSession,
} from "@/lib/games";
export const dynamic = "force-dynamic";

const MAX_ACTIVE_GAMES = 3;

// POST /api/games — start a new game (GitHub session required)
export async function POST(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with GitHub to play" },
      { status: 401 }
    );
  }

  // Rate limit: max active games per player
  const existing = await getPlayerGames(user.login);
  const activeCount = existing.filter((g) => g.status !== "finished").length;
  if (activeCount >= MAX_ACTIVE_GAMES) {
    return NextResponse.json(
      { error: `You already have ${MAX_ACTIVE_GAMES} active games. Finish one first!` },
      { status: 429 }
    );
  }

  const gameId = crypto.randomUUID();
  const now = new Date().toISOString();

  const game: GameSession = {
    id: gameId,
    gameType: "connect4",
    status: "player_turn",
    player: {
      githubLogin: user.login,
      githubAvatar: user.avatar_url,
    },
    board: createEmptyBoard(),
    moves: [],
    playerLastSeen: now,
    lastEmailSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveGame(game);

  return NextResponse.json({ gameId }, { status: 201 });
}

// GET /api/games — list games waiting for Steve (Steve Bearer only)
export async function GET(request: NextRequest) {
  if (!checkSteveAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await listGamesForSteve();
  return NextResponse.json(games, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
