// src/api/bets.ts
import { api } from "./http";

export type GameCode = "slots" | "roulette" | "blackjack";
export type Outcome = "WIN" | "LOSS";

export type PlayBody = {
  gameCode: GameCode;
  amountCents: string;      // ⬅ string, ne number
  outcome: Outcome;         // ⬅ "WIN" | "LOSS"
};

export async function playBet(body: PlayBody) {
  const { data } = await api.post("/bets/play", body);
  return data; // očekuje { balanceCents, ... }
}
