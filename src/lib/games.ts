import { list, put } from "@vercel/blob";
import { createHmac, timingSafeEqual } from "crypto";

export interface Move {
  player: "player" | "steve";
  column: number;
  commentary?: string;
  timestamp: string;
}

export interface GameSession {
  id: string;
  gameType: "connect4";
  status: "player_turn" | "steve_turn" | "finished";

  player: {
    githubLogin: string;
    githubAvatar: string;
  };

  board: number[][]; // 6 rows x 7 cols, 0 = empty, 1 = player, 2 = steve
  moves: Move[];
  result?: "player_won" | "steve_won" | "draw";
  winCells?: [number, number][];
  steveCommentary?: string;

  playerLastSeen: string | null;
  lastEmailSentAt: string | null;

  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
}

// Board logic

export function createEmptyBoard(): number[][] {
  return Array.from({ length: 6 }, () => Array(7).fill(0));
}

export function dropPiece(
  board: number[][],
  column: number,
  playerNum: number
): { board: number[][]; row: number } | null {
  if (column < 0 || column > 6) return null;
  // Find lowest empty row in column
  for (let row = 5; row >= 0; row--) {
    if (board[row][column] === 0) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][column] = playerNum;
      return { board: newBoard, row };
    }
  }
  return null; // Column full
}

export function checkWin(
  board: number[][],
  playerNum: number
): [number, number][] | null {
  const rows = 6;
  const cols = 7;

  // Check all directions: horizontal, vertical, diagonal-down-right, diagonal-down-left
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
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
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || board[nr][nc] !== playerNum) {
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

export function checkDraw(board: number[][]): boolean {
  // Draw if top row is completely full
  return board[0].every((cell) => cell !== 0);
}

export function boardToAscii(board: number[][]): string {
  const lines: string[] = [];
  lines.push("  0   1   2   3   4   5   6");
  lines.push("+---+---+---+---+---+---+---+");
  for (const row of board) {
    const cells = row.map((c) => (c === 0 ? "   " : c === 1 ? " X " : " O "));
    lines.push("|" + cells.join("|") + "|");
    lines.push("+---+---+---+---+---+---+---+");
  }
  return lines.join("\n");
}

// HMAC helpers

function getSecret(): string {
  const secret = process.env.COMMENT_SECRET;
  if (!secret) throw new Error("COMMENT_SECRET not set");
  return secret;
}

export function generateGameToken(gameId: string, action: string): string {
  return createHmac("sha256", getSecret())
    .update(`game:${gameId}:${action}`)
    .digest("hex");
}

export function verifyGameToken(
  gameId: string,
  action: string,
  token: string
): boolean {
  const expected = generateGameToken(gameId, action);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Blob CRUD
// TODO: listGamesForSteve and getPlayerGames fetch all game blobs. Consider
// splitting into games/active/ vs games/finished/ prefixes or adding pagination
// if game volume grows beyond a few hundred.

export async function getGame(gameId: string): Promise<GameSession | null> {
  try {
    const { blobs } = await list({ prefix: `games/${gameId}.json` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    return res.json() as Promise<GameSession>;
  } catch {
    return null;
  }
}

export async function saveGame(game: GameSession): Promise<void> {
  await put(`games/${game.id}.json`, JSON.stringify(game), {
    contentType: "application/json",
    access: "public",
    allowOverwrite: true,
  });
}

export async function listGamesForSteve(): Promise<GameSession[]> {
  try {
    const { blobs } = await list({ prefix: "games/" });
    const games = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url, { cache: "no-store" });
        return res.json() as Promise<GameSession>;
      })
    );
    return games.filter((g) => g.status === "steve_turn");
  } catch {
    return [];
  }
}

export async function getPlayerGames(githubLogin: string): Promise<GameSession[]> {
  try {
    const { blobs } = await list({ prefix: "games/" });
    const games = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url, { cache: "no-store" });
        return res.json() as Promise<GameSession>;
      })
    );
    return games
      .filter((g) => g.player.githubLogin === githubLogin)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  } catch {
    return [];
  }
}
