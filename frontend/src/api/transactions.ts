import { api } from "./http";

export type TxType = "BET" | "PAYOUT" | "DEPOSIT" | "WITHDRAWAL";
export type Game = "slots" | "roulette" | "blackjack"; // uskladi sa backendom

export type Tx = {
  id: string;
  type: TxType;
  amountCents: string;
  balanceAfterCents: string;
  game?: Game;
  createdAt: string;
};

export type TxPage = { page: number; limit: number; total: number; items: Tx[] };

export async function listTransactions(params: {
  page?: number; limit?: number;
  type?: TxType; game?: Game;
  from?: string; to?: string;
}): Promise<TxPage> {
  const { data } = await api.get("/transactions", { params }); // uskladi ako je /me/transactions
  return data;
}
