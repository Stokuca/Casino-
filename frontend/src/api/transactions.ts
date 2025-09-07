// src/api/transactions.ts
import { api } from "./http";

export type TxType = "BET" | "DEPOSIT" | "WITHDRAW";
export type GameKey = "slots" | "roulette" | "blackjack";

export type Tx = {
  id: string;
  type: TxType;
  game?: GameKey | null;
  amountCents: string;
  balanceAfterCents: string;
  createdAt: string; // ISO
};

export type TxQuery = {
  page?: number;
  limit?: number;
  type?: TxType;
  game?: GameKey;
  from?: string; // yyyy-mm-dd ili ISO
  to?: string;   // yyyy-mm-dd ili ISO
};

export type TxResponse = {
  items: Tx[];
  page: number;
  limit: number;
  total: number;
};

export async function getMyTransactions(q: TxQuery): Promise<TxResponse> {
  // ⬇️ prava ruta je /me/transactions
  const { data } = await api.get<TxResponse>("/me/transactions", { params: q });
  return data;
}
