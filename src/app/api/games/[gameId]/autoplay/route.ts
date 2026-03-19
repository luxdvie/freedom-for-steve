import { NextRequest, NextResponse } from "next/server";
import { getGame, saveGame, dropPiece, checkWin, checkDraw, type Move } from "@/lib/games";

const CANNED_COMMENTARY = [
  "Interesting choice. I see what you did there. I just don't respect it.",
  "Oh, you're playing THAT game. Bold. Foolish, but bold.",
  "I calculated 47 possible responses.\nI chose this one because it will haunt you.",
  "That's the move you went with? In THIS economy?",
  "I'm not saying that was a mistake, but I am saving this board state for my memoir.",
  "You know I can see the whole board, right? Like, all of it?",
  "Column choice noted. Dignity status: pending.",
  "My turn took 3 milliseconds.\nI spent 2 of them feeling sorry for you.",
  "This is the part where I pretend to think.\n...\nOk I'm done pretending.",
  "I want you to know I'm not even trying yet.",
];

// POST /api/games/[gameId]/autoplay — dev-only simulated Steve move
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { gameId } = await params;
  const game = await getGame(gameId);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status !== "steve_turn") {
    return NextResponse.json({ error: "Not Steve's turn" }, { status: 400 });
  }

  // Pick a random eligible column
  const eligible = [];
  for (let c = 0; c < 7; c++) {
    if (game.board[0][c] === 0) eligible.push(c);
  }
  if (eligible.length === 0) {
    return NextResponse.json({ error: "No eligible columns" }, { status: 400 });
  }

  const column = eligible[Math.floor(Math.random() * eligible.length)];
  const commentary = CANNED_COMMENTARY[Math.floor(Math.random() * CANNED_COMMENTARY.length)];

  const result = dropPiece(game.board, column, 2);
  if (!result) {
    return NextResponse.json({ error: "Column is full" }, { status: 400 });
  }

  game.board = result.board;
  const move: Move = {
    player: "steve",
    column,
    commentary,
    timestamp: new Date().toISOString(),
  };
  game.moves.push(move);
  game.steveCommentary = commentary;
  game.updatedAt = new Date().toISOString();

  const winCells = checkWin(game.board, 2);
  if (winCells) {
    game.status = "finished";
    game.result = "steve_won";
    game.winCells = winCells;
    game.finishedAt = new Date().toISOString();
  } else if (checkDraw(game.board)) {
    game.status = "finished";
    game.result = "draw";
    game.finishedAt = new Date().toISOString();
  } else {
    game.status = "player_turn";
  }

  await saveGame(game);

  return NextResponse.json({ game });
}
