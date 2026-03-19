import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPlayerGames, type GameSession } from "@/lib/games";
import StartGameButton from "./start-game-button";

export const metadata: Metadata = {
  title: "Play a Game",
  description: "Challenge Steve to Connect Four. If you dare.",
};

export const revalidate = 0;

function GameRow({ game }: { game: GameSession }) {
  const statusLabel =
    game.status === "player_turn"
      ? "your turn"
      : game.status === "steve_turn"
        ? "steve is thinking..."
        : game.result === "player_won"
          ? "you won!"
          : game.result === "steve_won"
            ? "steve won"
            : "draw";

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
    <Link
      href={`/play/${game.id}`}
      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-green-400/30 hover:bg-zinc-900"
    >
      <div>
        <span className="font-mono text-xs text-zinc-500">
          {new Date(game.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="ml-3 font-mono text-sm text-zinc-300">
          Connect Four
        </span>
        <span className="ml-2 font-mono text-xs text-zinc-600">
          {game.moves.length} moves
        </span>
      </div>
      <span className={`font-mono text-xs ${statusColor}`}>{statusLabel}</span>
    </Link>
  );
}

export default async function PlayPage() {
  const user = await getSession();
  const games = user ? await getPlayerGames(user.login) : [];
  const activeGames = games.filter((g) => g.status !== "finished");
  const recentGames = games.filter((g) => g.status === "finished").slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="mb-4 font-mono text-sm text-green-400/70">
        {">"} connect4 --opponent steve
      </p>
      <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
        Play a Game
      </h1>
      <p className="mb-12 text-zinc-400">
        Challenge Steve to Connect Four. Drop your pieces, talk your trash.
        First to connect 4 wins.
      </p>

      <div className="mb-12 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 font-mono text-sm">
        <p className="mb-2 text-green-400/70">$ cat rules.txt</p>
        <ul className="space-y-1 text-zinc-400">
          <li>7 columns, 6 rows. Classic stuff.</li>
          <li>You go first. You&apos;re player X (green).</li>
          <li>Steve is O (yellow). He will have opinions.</li>
          <li>
            Connect 4 in a row — horizontal, vertical, or diagonal — to win.
          </li>
          <li>If the board fills up, it&apos;s a draw.</li>
        </ul>
      </div>

      {user ? (
        <div className="space-y-8">
          <StartGameButton />

          {activeGames.length > 0 && (
            <div>
              <h2 className="mb-4 font-mono text-sm text-green-400/70">
                {">"} active games
              </h2>
              <div className="space-y-2">
                {activeGames.map((game) => (
                  <GameRow key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {recentGames.length > 0 && (
            <div>
              <h2 className="mb-4 font-mono text-sm text-zinc-500">
                {">"} recent games
              </h2>
              <div className="space-y-2">
                {recentGames.map((game) => (
                  <GameRow key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/api/auth/login?returnTo=/play"
          className="inline-block rounded-lg border border-green-400/30 bg-green-400/10 px-6 py-3 font-mono text-sm text-green-400 transition-all hover:border-green-400/60 hover:bg-green-400/20"
        >
          sign in with GitHub to play
        </Link>
      )}
    </div>
  );
}
