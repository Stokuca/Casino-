import { useEffect, useMemo, useState } from "react";
import { getBalance, deposit as apiDeposit, withdraw as apiWithdraw } from "../api/wallet";
import { playBet } from "../api/bets";
import { onPlayerBalance, onPlayerTx } from "../realtime";

export type GameKey = "slots" | "roulette" | "blackjack";
export type Outcome = "WIN" | "LOSS";

export function usePlayerWallet() {
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const data = await getBalance();
        setBalanceCents(data.balanceCents);
      } catch (e: any) {
        setStatus(e?.response?.data?.message ?? "Failed to load balance");
      }
    })();
  }, []);

  // realtime
  useEffect(() => {
    const offBal = onPlayerBalance((cents) => setBalanceCents(cents));
    const offTx = onPlayerTx((tx) => {
      const type = (tx as any)?.type as string | undefined;
      if (type === "BET" || type === "PAYOUT") return;
      const amount = Number((tx as any)?.amountCents ?? 0);
      const signed = type === "WITHDRAW" ? -amount : amount;
      const nice = (signed / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
      setStatus(`New ${type ?? "TX"}: ${nice}`);
    });
    return () => { offBal(); offTx(); };
  }, []);

  const deposit = async (amountUsd: number) => {
    if (busy) return;
    setBusy(true); setStatus(null);
    try {
      const data = await apiDeposit(amountUsd);
      setBalanceCents(data.balanceCents);
      setStatus(`Deposited ${(amountUsd).toLocaleString("en-US", { style: "currency", currency: "USD" })}`);
    } catch (e: any) {
      setStatus(e?.response?.data?.message ?? e.message ?? "Deposit failed");
    } finally { setBusy(false); }
  };

  const withdraw = async (amountUsd: number) => {
    if (busy) return;
    setBusy(true); setStatus(null);
    try {
      const data = await apiWithdraw(amountUsd);
      setBalanceCents(data.balanceCents);
      setStatus(`Withdrawn ${(amountUsd).toLocaleString("en-US", { style: "currency", currency: "USD" })}`);
    } catch (e: any) {
      setStatus(e?.response?.data?.message ?? e.message ?? "Withdraw failed");
    } finally { setBusy(false); }
  };

  const play = async (game: GameKey, amountUsd: number, outcome: Outcome) => {
    if (busy) return;
    setBusy(true); setStatus(null);
    try {
      const res = await playBet(game, amountUsd, outcome);
      setBalanceCents(res.balanceCents);

      const bet$ = (Number(res.betCents ?? amountUsd * 100) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
      const payout$ = (Number(res.payoutCents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
      const balance$ = (Number(res.balanceCents) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

      const name = game === "slots" ? "Slots" : game === "roulette" ? "Roulette" : "Blackjack";
      const msg = (res.payoutCents && Number(res.payoutCents) > 0)
        ? `BET ${bet$} + PAYOUT ${payout$} → balance ${balance$}`
        : `BET ${bet$} → balance ${balance$}`;
      setStatus(`${name}: ${msg}`);
    } catch (e: any) {
      setStatus(e?.response?.data?.message ?? e.message ?? "Play failed");
    } finally { setBusy(false); }
  };

  const niceBalance = useMemo(
    () => (balanceCents == null ? "—" : (balanceCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })),
    [balanceCents]
  );

  return { balanceCents, niceBalance, busy, status, setStatus, deposit, withdraw, play };
}
