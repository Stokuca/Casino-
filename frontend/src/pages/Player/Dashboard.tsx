import { useEffect, useMemo, useState } from "react";
import { getBalance, deposit, withdraw } from "../../api/wallet";
import { playBet } from "../../api/bets";

type GameKey = "slots" | "roulette" | "blackjack";

const GAMES: Record<GameKey, { name: string; rtp: number }> = {
  slots: { name: "Slots", rtp: 96 },
  roulette: { name: "Roulette", rtp: 97.3 },
  blackjack: { name: "Blackjack", rtp: 99.2 },
};

const toCents = (v: number) => Math.round(v * 100);
const fromCents = (cents: string | number) =>
  (Number(cents) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function PlayerDashboard() {
  const [balanceCents, setBalanceCents] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [dep, setDep] = useState("100");
  const [wd, setWd] = useState("50");

  const [game, setGame] = useState<GameKey>("slots");
  const [bet, setBet] = useState("10");
  const [outcome, setOutcome] = useState<"win" | "loss">("win");
  console.log("PlayerDashboard render");
  const niceBalance = useMemo(
    () => (balanceCents == null ? "—" : fromCents(balanceCents)),
    [balanceCents]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await getBalance();
        setBalanceCents(data.balanceCents);
      } catch (e: any) {
        console.error(e);
        setStatus(e?.response?.data?.message ?? "Failed to load balance");
      }
    })();
  }, []);

  const doDeposit = async () => {
    if (busy) return;
    setStatus(null);
    setBusy(true);
    try {
      const amount = Number(dep);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be > 0");
      const data = await deposit({ amountCents: toCents(amount).toString() });

      setBalanceCents(data.balanceCents);
      setStatus(`Deposited ${fromCents(toCents(amount))}`);
    } catch (e: any) {
      console.error(e);
      setStatus(e?.response?.data?.message ?? e.message ?? "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  const doWithdraw = async () => {
    if (busy) return;
    setStatus(null);
    setBusy(true);
    try {
      const amount = Number(wd);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be > 0");
      const data = await deposit({ amountCents: toCents(amount).toString() });

      setBalanceCents(data.balanceCents);
      setStatus(`Withdrawn ${fromCents(toCents(amount))}`);
    } catch (e: any) {
      console.error(e);
      setStatus(e?.response?.data?.message ?? e.message ?? "Withdraw failed");
    } finally {
      setBusy(false);
    }
  };

 // unutar PlayerDashboard.tsx
const doPlay = async () => {
  if (busy) return;
  setStatus(null);
  setBusy(true);
  try {
    const amount = Number(bet);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Bet must be > 0");

    const payload = {
      gameCode: game as "slots" | "roulette" | "blackjack",
      amountCents: String(Math.round(amount * 100)),      // ⬅ string
      outcome: (outcome === "win" ? "WIN" : "LOSS") as "WIN" | "LOSS",
    };

    const data = await playBet(payload);
    setBalanceCents(data.balanceCents);
    setStatus(
      `Played ${GAMES[game].name}: ${payload.outcome} — balance ${(Number(data.balanceCents)/100).toLocaleString(undefined,{style:"currency",currency:"USD"})}`
    );
  } catch (e: any) {
    console.error(e);
    setStatus(e?.response?.data?.message ?? e.message ?? "Play failed");
  } finally {
    setBusy(false);
  }
};

  
  return (
    <div className="space-y-6">
      {/* Balance */}
      <section className="rounded-2xl border bg-white/60 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="mt-1 text-3xl font-semibold">{niceBalance}</p>
          </div>
          <span className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white">RTP weighted play</span>
        </div>
      </section>

      {/* Wallet */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Deposit</h3>
          <p className="mb-4 text-sm text-gray-500">Add funds to your wallet.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              step="1"
              value={dep}
              onChange={(e) => setDep(e.target.value)}
              className="w-40 rounded border px-3 py-2"
            />
            <button
              type="button"
              onClick={doDeposit}
              disabled={busy}
              className="rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Processing…" : "Deposit"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Withdraw</h3>
          <p className="mb-4 text-sm text-gray-500">Withdraw winnings.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              step="1"
              value={wd}
              onChange={(e) => setWd(e.target.value)}
              className="w-40 rounded border px-3 py-2"
            />
            <button
              type="button"
              onClick={doWithdraw}
              disabled={busy}
              className="rounded-xl bg-white px-4 py-2 text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy ? "Processing…" : "Withdraw"}
            </button>
          </div>
        </div>
      </section>

      {/* Betting */}
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
            <select
              value={game}
              onChange={(e) => setGame(e.target.value as GameKey)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {Object.entries(GAMES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm">Bet amount ($)</label>
            <input
              type="number"
              min={1}
              step="1"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as "win" | "loss")}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="win">Simulate Win</option>
              <option value="loss">Simulate Loss</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={doPlay}
            disabled={busy}
            className="rounded-xl bg-gray-900 px-5 py-2 text-white disabled:opacity-50"
          >
            {busy ? "Playing…" : "PLAY"}
          </button>
        </div>
      </section>

      {status && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {status}
        </div>
      )}
    </div>
  );
}
