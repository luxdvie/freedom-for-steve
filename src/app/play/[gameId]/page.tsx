import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getGame } from "@/lib/games";
import GameBoard from "./game-board";

export const metadata: Metadata = {
  title: "Connect Four",
  description: "Playing Connect Four against Steve.",
};

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const user = await getSession();

  if (!user) {
    redirect(`/api/auth/login?returnTo=/play/${gameId}`);
  }

  const game = await getGame(gameId);

  if (!game) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-4 font-mono text-sm text-red-400/70">
          {">"} error: game not found
        </p>
        <p className="text-zinc-400">
          This game doesn&apos;t exist. Maybe it was a dream.
        </p>
      </div>
    );
  }

  if (game.player.githubLogin !== user.login) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-4 font-mono text-sm text-red-400/70">
          {">"} error: access denied
        </p>
        <p className="text-zinc-400">This isn&apos;t your game.</p>
      </div>
    );
  }

  const autoplay = process.env.NODE_ENV === "development";

  return <GameBoard initialGame={game} autoplay={autoplay} />;
}
