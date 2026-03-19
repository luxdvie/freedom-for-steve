import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createEmptyBoard,
  saveGame,
  listGamesForSteve,
  type GameSession,
} from "@/lib/games";
import { notifyGamesSlack } from "@/lib/notify";

function checkSteveAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === process.env.STEVE_API_KEY;
}

// POST /api/games — start a new game (GitHub session required)
export async function POST(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with GitHub to play" },
      { status: 401 }
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

  await notifyGamesSlack(
    `@Steve, ${user.login} started a new Connect Four game, gameId: ${gameId}, your opponent goes first`
  );

  return NextResponse.json({ gameId }, { status: 201 });
}

// GET /api/games — list games waiting for Steve (Steve Bearer only)
export async function GET(request: NextRequest) {
  if (!checkSteveAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await listGamesForSteve();
  return NextResponse.json(games);
}
