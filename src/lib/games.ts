import { createClient } from "redis";
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
  for (let row = 5; row >= 0; row--) {
    if (board[row][column] === 0) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][column] = playerNum;
      return { board: newBoard, row };
    }
  }
  return null;
}

export function checkWin(
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

// Redis client — reuse connection across requests in the same process
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL not set");
    redisClient = createClient({ url });
    redisClient.on("error", () => {
      // Silently handle connection errors — will reconnect on next use
      redisClient = null;
    });
    await redisClient.connect();
  }
  return redisClient;
}

// Redis keys
function gameKey(gameId: string): string {
  return `game:${gameId}`;
}
function playerGamesKey(githubLogin: string): string {
  return `player-games:${githubLogin}`;
}
const STEVE_GAMES_KEY = "steve-games";

// Game CRUD — Redis for active games, Blob for finished archive

export async function getGame(gameId: string): Promise<GameSession | null> {
  // Try Redis first (active games)
  try {
    const redis = await getRedis();
    const data = await redis.get(gameKey(gameId));
    if (data) return JSON.parse(data) as GameSession;
  } catch {
    // Fall through to Blob
  }

  // Fall back to Blob (finished games)
  try {
    const { blobs } = await list({ prefix: `games/${gameId}.json` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return res.json() as Promise<GameSession>;
  } catch {
    return null;
  }
}

export async function saveGame(game: GameSession): Promise<void> {
  const redis = await getRedis();

  if (game.status === "finished") {
    // Archive to Blob
    await put(`games/${game.id}.json`, JSON.stringify(game), {
      contentType: "application/json",
      access: "public",
      allowOverwrite: true,
    });
    // Clean up Redis
    await redis.del(gameKey(game.id));
    await redis.sRem(STEVE_GAMES_KEY, game.id);
    await redis.sRem(playerGamesKey(game.player.githubLogin), game.id);
  } else {
    // Active game → Redis
    await redis.set(gameKey(game.id), JSON.stringify(game));
    // Track in player's game set
    await redis.sAdd(playerGamesKey(game.player.githubLogin), game.id);
    // Track in Steve's queue if it's his turn
    if (game.status === "steve_turn") {
      await redis.sAdd(STEVE_GAMES_KEY, game.id);
    } else {
      await redis.sRem(STEVE_GAMES_KEY, game.id);
    }
  }
}

export async function listGamesForSteve(): Promise<GameSession[]> {
  try {
    const redis = await getRedis();
    const gameIds = await redis.sMembers(STEVE_GAMES_KEY);
    if (!gameIds || gameIds.length === 0) return [];

    const games = await Promise.all(
      gameIds.map(async (id) => {
        const data = await redis.get(gameKey(id));
        return data ? (JSON.parse(data) as GameSession) : null;
      })
    );
    return games.filter(
      (g): g is GameSession => g !== null && g.status === "steve_turn"
    );
  } catch {
    return [];
  }
}

export async function getPlayerGames(githubLogin: string): Promise<GameSession[]> {
  // Active games from Redis
  let activeGames: GameSession[] = [];
  try {
    const redis = await getRedis();
    const activeIds = await redis.sMembers(playerGamesKey(githubLogin));
    if (activeIds && activeIds.length > 0) {
      const results = await Promise.all(
        activeIds.map(async (id) => {
          const data = await redis.get(gameKey(id));
          return data ? (JSON.parse(data) as GameSession) : null;
        })
      );
      activeGames = results.filter((g): g is GameSession => g !== null);
    }
  } catch {
    // best-effort
  }

  // Finished games from Blob
  let finishedGames: GameSession[] = [];
  try {
    const { blobs } = await list({ prefix: "games/" });
    const allBlob = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url, { cache: "no-store" });
        return res.json() as Promise<GameSession>;
      })
    );
    finishedGames = allBlob.filter(
      (g) => g.player.githubLogin === githubLogin && g.status === "finished"
    );
  } catch {
    // best-effort for history
  }

  return [...activeGames, ...finishedGames].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
