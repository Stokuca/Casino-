// src/api/transactions.ts
import { api } from "./http";

export type TxType = "BET" | "PAYOUT" | "DEPOSIT" | "WITHDRAWAL";
export type GameKey = "slots" | "roulette" | "blackjack";

export type Tx = {
  id: string;
  type: TxType;
  game: GameKey | null;      // null za depozit/withdrawal
  amountCents: string;       // u centima
  balanceAfterCents: string; // u centima
  createdAt: string;         // ISO
};

export type TxQuery = {
  page?: number;
  limit?: number;
  type?: TxType;
  game?: GameKey;
  from?: string; // ISO (startOfDay)
  to?: string;   // ISO (endOfDay)
};

export type TxResponse = {
  items: Tx[];
  page: number;
  limit: number;
  total: number;
};

export async function getMyTransactions(
  q: TxQuery,
  signal?: AbortSignal
): Promise<TxResponse> {
  const { data } = await api.get<TxResponse>("/me/transactions", {
    params: q,
    signal, // <- važno: prosleđujemo AbortController signal
  });
  return data;
}

