import { useEffect, useMemo, useState } from "react";
import { getBalance, deposit, withdraw } from "../../api/wallet";
import { playBet } from "../../api/bets";
import { onPlayerBalance, onPlayerTx } from "../../realtime";

type GameKey = "slots" | "roulette" | "blackjack";

const GAMES: Record<GameKey, { name: string; rtp: number }> = {
  slots: { name: "Slots", rtp: 96 },
  roulette: { name: "Roulette", rtp: 97.3 },
  blackjack: { name: "Blackjack", rtp: 99.2 },
};

const fromCents = (cents: number | string) =>
  (Number(cents) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function PlayerDashboard() {
  // ⬅ balanceCents je number (u centima)
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [dep, setDep] = useState("100");
  const [wd, setWd] = useState("50");

  const [game, setGame] = useState<GameKey>("slots");
  const [bet, setBet] = useState("10");
  // prikazno stanje, mapira se u "WIN" | "LOSS"
  const [outcome, setOutcome] = useState<"win" | "loss">("win");

  useEffect(() => {
    const offBal = onPlayerBalance((cents) => setBalanceCents(cents));
  
    // WS: IGNORIŠEMO BET i PAYOUT da ne prelepe poruku posle playBet-a
    const offTx = onPlayerTx((tx) => {
      const type = (tx as any)?.type as string | undefined;
      if (type === "BET" || type === "PAYOUT") return;
  
      const amount = Number((tx as any)?.amountCents ?? 0);
      const signed = type === "WITHDRAW" ? -amount : amount; // deposit +, withdraw -
      const nice = (signed / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
  
      setStatus(`New ${type ?? "TX"}: ${nice}`);
    });
  
    return () => { offBal(); offTx(); };
  }, []);
  
  
  
  
  

  const niceBalance = useMemo(
    () => (balanceCents == null ? "—" : fromCents(balanceCents)),
    [balanceCents]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await getBalance();
        setBalanceCents(data.balanceCents); // number
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
      const data = await deposit(amount); // ⬅ šaljemo $ (number)

      setBalanceCents(data.balanceCents);
      setStatus(`Deposited ${fromCents(amount * 100)}`);
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
      const data = await withdraw(amount); // ⬅ ispravka: withdraw

      setBalanceCents(data.balanceCents);
      setStatus(`Withdrawn ${fromCents(amount * 100)}`);
    } catch (e: any) {
      console.error(e);
      setStatus(e?.response?.data?.message ?? e.message ?? "Withdraw failed");
    } finally {
      setBusy(false);
    }
  };

  const doPlay = async () => {
    if (busy) return;
    setStatus(null);
    setBusy(true);
    try {
      const amount = Number(bet);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Bet must be > 0");
  
      // playBet(gameCode, betUsd, outcome?)
      const res = await playBet(
        game,
        amount,
        outcome === "win" ? "WIN" : "LOSS"
      );
  
      setBalanceCents(res.balanceCents);
  
      // --- poruka po zadatku ---
      const bet$ = fromCents(res.betCents ?? amount * 100);
      const payout$ = fromCents(res.payoutCents ?? 0);
      const balance$ = fromCents(res.balanceCents);
  
      const msg =
        (res.payoutCents && Number(res.payoutCents) > 0)
          ? `BET ${bet$} + PAYOUT ${payout$} → balance ${balance$}`
          : `BET ${bet$} → balance ${balance$}`;
  
      setStatus(`${GAMES[game].name}: ${msg}`);
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
