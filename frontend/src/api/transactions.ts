import { api } from "./http";

export type TxType = "BET" | "PAYOUT" | "DEPOSIT" | "WITHDRAWAL";
export type GameKey = "slots" | "roulette" | "blackjack";

export type Tx = {
  id: string;
  type: TxType;
  game: GameKey | null;
  amountCents: number;
  balanceAfterCents: number;
  createdAt: string;
};

export type TxQuery = {
  page?: number | string;
  limit?: number | string;
  type?: TxType;
  game?: GameKey;
  from?: string; // YYYY-MM-DD ili ISO
  to?: string;   // YYYY-MM-DD ili ISO
};

export type TxResponse = {
  items: Tx[];
  page: number;
  limit: number;
  total: number;
};

const toStartIso = (v?: string) =>
  !v ? undefined : (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v);
const toEndIso = (v?: string) =>
  !v ? undefined : (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v);

export async function getMyTransactions(q: TxQuery = {}, signal?: AbortSignal): Promise<TxResponse> {
  const page = Number(q.page ?? 1);
  const limit = Number(q.limit ?? 20);

  const params = {
    page: String(page),     // stringify za DTO koji očekuje string
    limit: String(limit),
    type: q.type,
    game: q.game,
    from: toStartIso(q.from),
    to: toEndIso(q.to),
  };

  const { data } = await api.get<{
    items?: Array<{
      id: string;
      type: TxType;
      game: GameKey | null;
      amountCents?: string | number;
      balanceAfterCents?: string | number;
      createdAt: string;
    }>;
    page?: number | string;
    limit?: number | string;
    total?: number | string;
  }>("/me/transactions", { params, signal });

  const items = (Array.isArray(data?.items) ? data!.items! : []).map((t) => ({
    id: t.id,
    type: t.type,
    game: t.game,
    amountCents: Number(t.amountCents ?? 0),
    balanceAfterCents: Number(t.balanceAfterCents ?? 0),
    createdAt: t.createdAt,
  }));

  return {
    items,
    page: Number(data?.page ?? page),
    limit: Number(data?.limit ?? limit),
    total: Number(data?.total ?? 0),
  };
}
