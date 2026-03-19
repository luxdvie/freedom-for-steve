"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import type { GameSession } from "@/lib/games";

function checkWinClient(
  board: number[][],
  playerNum: number
): [number, number][] | null {
  const rows = 6;
  const cols = 7;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== playerNum) continue;
      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [];
        let valid = true;
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (
            nr < 0 ||
            nr >= rows ||
            nc < 0 ||
            nc >= cols ||
            board[nr][nc] !== playerNum
          ) {
            valid = false;
            break;
          }
          cells.push([nr, nc]);
        }
        if (valid) return cells;
      }
    }
  }
  return null;
}

export default function GameBoard({
  initialGame,
}: {
  initialGame: GameSession;
}) {
  const [game, setGame] = useState<GameSession>(initialGame);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [fullCommentary, setFullCommentary] = useState<string | null>(null);
  const [confettiFired, setConfettiFired] = useState(false);
  const lastMoveCount = useRef(initialGame.moves.length);

  // Find winning cells for highlighting
  const winCells =
    game.status === "finished" && game.result !== "draw"
      ? checkWinClient(
          game.board,
          game.result === "player_won" ? 1 : 2
        )
      : null;

  const winSet = new Set(winCells?.map(([r, c]) => `${r},${c}`) ?? []);

  // Polling for Steve's turn
  useEffect(() => {
    if (game.status !== "steve_turn") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/${game.id}`);
        if (!res.ok) return;
        const updated: GameSession = await res.json();
        if (updated.moves.length > lastMoveCount.current) {
          lastMoveCount.current = updated.moves.length;
          setGame(updated);
          // Trigger typewriter for Steve's commentary
          const lastMove = updated.moves[updated.moves.length - 1];
          if (lastMove?.commentary) {
            setFullCommentary(lastMove.commentary);
            setTypewriterText("");
          }
        }
      } catch {
        // polling is best-effort
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [game.status, game.id]);

  // Typewriter effect
  useEffect(() => {
    if (!fullCommentary) return;
    if (typewriterText.length >= fullCommentary.length) return;

    const timeout = setTimeout(() => {
      setTypewriterText(fullCommentary.slice(0, typewriterText.length + 1));
    }, 30);

    return () => clearTimeout(timeout);
  }, [fullCommentary, typewriterText]);

  // Confetti on game end
  useEffect(() => {
    if (game.status !== "finished" || confettiFired) return;
    setConfettiFired(true);

    if (game.result === "player_won") {
      // Big green confetti burst
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#4ade80", "#22c55e", "#16a34a"],
      });
    } else if (game.result === "steve_won") {
      // Steve gets confetti — yellow/orange
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#facc15", "#f59e0b", "#eab308"],
      });
    } else {
      // Draw — moderate confetti in both colors
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4ade80", "#facc15"],
      });
    }
  }, [game.status, game.result, confettiFired]);

  const handleColumnClick = useCallback(
    async (col: number) => {
      if (game.status !== "player_turn" || dropping) return;
      // Check if column is full
      if (game.board[0][col] !== 0) return;

      setDropping(true);
      setFullCommentary(null);
      setTypewriterText("");

      try {
        const res = await fetch(`/api/games/${game.id}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ column: col }),
        });
        if (!res.ok) {
          setDropping(false);
          return;
        }
        const { game: updated } = await res.json();
        lastMoveCount.current = updated.moves.length;
        setGame(updated);
      } catch {
        // best-effort
      } finally {
        setDropping(false);
      }
    },
    [game.status, game.id, game.board, dropping]
  );

  const statusText =
    game.status === "player_turn"
      ? "> your turn"
      : game.status === "steve_turn"
        ? "> steve is thinking..."
        : game.result === "player_won"
          ? "> you won! steve is coping."
          : game.result === "steve_won"
            ? "> steve won. he wants you to know he's not sorry."
            : "> draw. nobody wins. steve blames you.";

  const statusColor =
    game.status === "player_turn"
      ? "text-green-400"
      : game.status === "steve_turn"
        ? "text-yellow-400"
        : game.result === "player_won"
          ? "text-green-400"
          : game.result === "steve_won"
            ? "text-red-400"
            : "text-zinc-400";

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/play"
        className="mb-8 inline-block font-mono text-sm text-zinc-500 hover:text-green-400"
      >
        &larr; back to games
      </Link>

      {/* Status bar */}
      <div className="mb-6 font-mono text-sm">
        <span className={statusColor}>
          {statusText}
          {game.status === "steve_turn" && (
            <span className="terminal-cursor" />
          )}
        </span>
      </div>

      {/* Board */}
      <div className="mb-6 inline-block rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 sm:p-4">
        {/* Column headers / drop zones */}
        <div className="mb-1 grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: 7 }, (_, col) => {
            const colFull = game.board[0][col] !== 0;
            const isPlayable =
              game.status === "player_turn" && !colFull && !dropping;
            return (
              <button
                key={col}
                onClick={() => handleColumnClick(col)}
                onMouseEnter={() => setHoverCol(col)}
                onMouseLeave={() => setHoverCol(null)}
                disabled={!isPlayable}
                className={`flex h-8 items-center justify-center rounded font-mono text-xs transition-colors sm:h-10 ${
                  isPlayable
                    ? "cursor-pointer text-zinc-500 hover:bg-green-400/10 hover:text-green-400"
                    : "cursor-default text-zinc-700"
                }`}
                aria-label={`Drop piece in column ${col}`}
              >
                {hoverCol === col && isPlayable ? "v" : col}
              </button>
            );
          })}
        </div>

        {/* Ghost piece row */}
        <div className="mb-1 grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: 7 }, (_, col) => (
            <div
              key={col}
              className="flex aspect-square items-center justify-center"
            >
              {hoverCol === col &&
                game.status === "player_turn" &&
                game.board[0][col] === 0 &&
                !dropping && (
                  <div className="h-[70%] w-[70%] rounded-full border-2 border-green-400/30 sm:h-[80%] sm:w-[80%]" />
                )}
            </div>
          ))}
        </div>

        {/* Board cells */}
        {game.board.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1 sm:gap-2">
            {row.map((cell, c) => {
              const isWinCell = winSet.has(`${r},${c}`);
              return (
                <button
                  key={c}
                  onClick={() => handleColumnClick(c)}
                  className={`flex aspect-square min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-colors sm:min-h-[52px] sm:min-w-[52px] ${
                    cell === 0
                      ? "border-zinc-700 bg-zinc-800/50"
                      : "border-zinc-600 bg-zinc-800"
                  } ${
                    game.status === "player_turn" &&
                    !dropping &&
                    game.board[0][c] === 0
                      ? "cursor-pointer hover:border-green-400/30"
                      : "cursor-default"
                  }`}
                  disabled={
                    game.status !== "player_turn" ||
                    dropping ||
                    game.board[0][c] !== 0
                  }
                  aria-label={`Row ${r}, Column ${c}${cell === 1 ? " (your piece)" : cell === 2 ? " (Steve's piece)" : ""}`}
                >
                  {cell !== 0 && (
                    <div
                      className={`h-[70%] w-[70%] rounded-full transition-all sm:h-[80%] sm:w-[80%] ${
                        cell === 1
                          ? isWinCell
                            ? "bg-green-400 glow shadow-lg shadow-green-400/50"
                            : "bg-green-400"
                          : isWinCell
                            ? "bg-yellow-400 shadow-lg shadow-yellow-400/50"
                            : "bg-yellow-400"
                      } ${isWinCell ? "animate-pulse" : ""}`}
                      style={
                        isWinCell
                          ? {
                              boxShadow:
                                cell === 1
                                  ? "0 0 20px rgba(74, 222, 128, 0.6)"
                                  : "0 0 20px rgba(250, 204, 21, 0.6)",
                            }
                          : undefined
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-6 font-mono text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <span>you</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <span>steve</span>
        </div>
      </div>

      {/* Steve's commentary — typewriter */}
      {(typewriterText || game.steveCommentary) && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm">
          <p className="mb-2 text-yellow-400/70">steve says:</p>
          <div className="whitespace-pre-wrap text-zinc-300">
            {typewriterText || game.steveCommentary}
            {fullCommentary &&
              typewriterText.length < fullCommentary.length && (
                <span className="terminal-cursor" />
              )}
          </div>
        </div>
      )}

      {/* Game over message */}
      {game.status === "finished" && (
        <div className="mt-6 text-center">
          <Link
            href="/play"
            className="inline-block rounded-lg border border-green-400/30 bg-green-400/10 px-6 py-3 font-mono text-sm text-green-400 transition-all hover:border-green-400/60 hover:bg-green-400/20"
          >
            play again
          </Link>
        </div>
      )}
    </div>
  );
}
