import { useState } from "react";
import type { GameKey, Outcome } from "../../hooks/usePlayerWallet";

const GAMES: Record<GameKey, { name: string; rtp: number }> = {
  slots: { name: "Slots", rtp: 96 },
  roulette: { name: "Roulette", rtp: 97.3 },
  blackjack: { name: "Blackjack", rtp: 99.2 },
};

export default function BettingSimulator({
  busy,
  onPlay,
}: {
  busy: boolean;
  onPlay: (game: GameKey, amountUsd: number, outcome: Outcome) => void;
}) {
  const [game, setGame] = useState<GameKey>("slots");
  const [bet, setBet] = useState("10");
  const [outcome, setOutcome] = useState<"win" | "loss">("win");

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Betting Simulator</h3>
        <div className="text-sm text-gray-500">
          RTP for <span className="font-medium">{GAMES[game].name}</span>: {GAMES[game].rtp}%
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm">Game</label>
          <select value={game} onChange={(e) => setGame(e.target.value as GameKey)} className="mt-1 w-full rounded border px-3 py-2">
            {Object.entries(GAMES).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Bet amount ($)</label>
          <input type="number" min={1} step="1" value={bet} onChange={(e) => setBet(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm">Outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value as "win" | "loss")} className="mt-1 w-full rounded border px-3 py-2">
            <option value="win">Simulate Win</option>
            <option value="loss">Simulate Loss</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => onPlay(game, Number(bet), outcome === "win" ? "WIN" : "LOSS")}
          disabled={busy}
          className="rounded-xl bg-gray-900 px-5 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Playing…" : "PLAY"}
        </button>
      </div>
    </section>
  );
}
