import { api } from "./http";

export type PlayBody = {
  game: "slots" | "roulette" | "blackjack";
  amountCents: number;
  outcome: "win" | "loss";        // ← prema Swaggeru: simulate Win/Loss
};

export type PlayResult = {
  balanceCents: string;
  // opcionalno: tx, ggrDeltaCents, itd. – dodaj ako backend vraća
};

export async function playBet(body: PlayBody): Promise<PlayResult> {
  const { data } = await api.post<PlayResult>("/bets/play", body);
  return data;
}
