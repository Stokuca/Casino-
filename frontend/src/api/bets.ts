import { api } from "./http";

export type GameCode = "slots" | "roulette" | "blackjack";
export type Outcome = "WIN" | "LOSS";

const usdToCentsStr = (x: number | string) =>
  String(Math.max(0, Math.floor((Number(x) || 0) * 100)));

export type PlayBody = {
  gameCode: GameCode;
  amountCents: string;  
  outcome?: Outcome;
};

export async function playBetRaw(body: PlayBody, signal?: AbortSignal) {
  const { data } = await api.post("/bets/play", body, { signal });
  return data;
}

export async function placeBet(
  gameCode: GameCode,
  betUsd: number | string,
  outcome?: Outcome,
  signal?: AbortSignal
) {
  const payload: PlayBody = {
    gameCode,
    amountCents: usdToCentsStr(betUsd),
    ...(outcome ? { outcome } : {}),
  };
  const { data } = await api.post("/bets/play", payload, { signal });
  return {
    balanceCents: Number(data?.balanceCents ?? 0),
    betCents: Number(data?.betCents ?? payload.amountCents ?? 0),
    payoutCents: Number(data?.payoutCents ?? 0),
    ...data,
  };
}

export { placeBet as playBet };
