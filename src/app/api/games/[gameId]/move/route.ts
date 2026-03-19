import { NextRequest, NextResponse } from "next/server";
import { getSession, checkSteveAuth } from "@/lib/auth";
import {
  getGame,
  saveGame,
  dropPiece,
  checkWin,
  checkDraw,
  type Move,
} from "@/lib/games";
import { notifyGamesSlack, steveSlackMention } from "@/lib/notify";
import { getBaseUrl } from "@/lib/url";
import { sendEmail, yourTurnEmail } from "@/lib/email";
import { getGitHubSubscriber } from "@/lib/subscribers";
import { decryptEmail } from "@/lib/crypto";

export const maxDuration = 10;

// POST /api/games/[gameId]/move — make a move
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const isSteve = checkSteveAuth(request);
  const user = isSteve ? null : await getSession();

  if (!isSteve && !user) {
    return NextResponse.json(
      { error: "Sign in with GitHub to play" },
      { status: 401 }
    );
  }

  const game = await getGame(gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.status === "finished") {
    return NextResponse.json({ error: "Game is already finished" }, { status: 400 });
  }

  const body = await request.json();
  const column: number = body.column;

  if (typeof column !== "number" || column < 0 || column > 6) {
    return NextResponse.json(
      { error: "Invalid column (must be 0-6)" },
      { status: 400 }
    );
  }

  if (isSteve) {
    // Steve's move
    if (game.status !== "steve_turn") {
      return NextResponse.json(
        { error: "Not Steve's turn" },
        { status: 400 }
      );
    }

    const commentary: string = body.commentary || "";

    const result = dropPiece(game.board, column, 2);
    if (!result) {
      return NextResponse.json({ error: "Column is full" }, { status: 400 });
    }

    game.board = result.board;
    const move: Move = {
      player: "steve",
      column,
      commentary: commentary || undefined,
      timestamp: new Date().toISOString(),
    };
    game.moves.push(move);
    game.steveCommentary = commentary || undefined;
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

    // Check if we need to send a "your turn" email before saving
    let shouldSendEmail = false;
    if (game.status === "player_turn" && game.playerLastSeen) {
      const lastSeen = new Date(game.playerLastSeen).getTime();
      const staleThreshold = 2 * 60 * 1000; // 2 minutes
      const emailCooldown = 10 * 60 * 1000; // 10 minutes
      const now = Date.now();

      const isStale = now - lastSeen > staleThreshold;
      const canEmail =
        !game.lastEmailSentAt ||
        now - new Date(game.lastEmailSentAt).getTime() > emailCooldown;

      if (isStale && canEmail) {
        shouldSendEmail = true;
        game.lastEmailSentAt = new Date().toISOString();
      }
    }

    // Single save with all mutations applied
    await saveGame(game);

    // Send email after save (best-effort, doesn't block response)
    if (shouldSendEmail) {
      try {
        const sub = await getGitHubSubscriber(game.player.githubLogin);
        if (sub?.encryptedEmail) {
          const email = decryptEmail(sub.encryptedEmail);
          const { subject, html } = yourTurnEmail(
            gameId,
            game.player.githubLogin,
            commentary
          );
          await sendEmail(email, subject, html);
        }
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ game });
  } else {
    // Player's move
    if (game.status !== "player_turn") {
      return NextResponse.json(
        { error: "Not your turn" },
        { status: 400 }
      );
    }

    if (game.player.githubLogin !== user!.login) {
      return NextResponse.json({ error: "Not your game" }, { status: 403 });
    }

    const result = dropPiece(game.board, column, 1);
    if (!result) {
      return NextResponse.json({ error: "Column is full" }, { status: 400 });
    }

    game.board = result.board;
    const move: Move = {
      player: "player",
      column,
      timestamp: new Date().toISOString(),
    };
    game.moves.push(move);
    game.playerLastSeen = new Date().toISOString();
    game.updatedAt = new Date().toISOString();

    const winCells = checkWin(game.board, 1);
    if (winCells) {
      game.status = "finished";
      game.result = "player_won";
      game.winCells = winCells;
      game.finishedAt = new Date().toISOString();
    } else if (checkDraw(game.board)) {
      game.status = "finished";
      game.result = "draw";
      game.finishedAt = new Date().toISOString();
    } else {
      game.status = "steve_turn";
    }

    await saveGame(game);

    // Notify Steve
    const gameApiUrl = `${getBaseUrl()}/api/games/${gameId}`;
    if (game.status === "steve_turn") {
      await notifyGamesSlack(
        `${steveSlackMention()}, ${user!.login} played column ${column} in Connect Four, gameId: ${gameId}, your turn\n${gameApiUrl}`
      );
    }

    return NextResponse.json({ game });
  }
}
