// src/pages/Player/Transactions.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { getMyTransactions, type Tx, type TxType, type GameKey } from "../../api/transactions";

const fmtMoney = (c: string) =>
  (Number(c) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
const fmtDate = (iso: string) => new Date(iso).toLocaleString();

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function PlayerTransactions() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [type, setType] = useState<"" | TxType>("");
  const [game, setGame] = useState<"" | GameKey>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => ({
    page,
    limit,
    ...(type && { type }),
    ...(game && { game }),
    ...(from && { from: dayjs(from).startOf("day").toISOString() }),
    ...(to && { to: dayjs(to).endOf("day").toISOString() }),
  }), [page, limit, type, game, from, to]);

  const debounced = useDebounced(query, 350);

  useEffect(() => {
    const ctrl = new AbortController();
  
    setLoading(true);
    setErr(null);
  
    getMyTransactions(debounced, ctrl.signal)
      .then((d) => {
        setRows(d.items);
        setTotal(d.total);
      })
      .catch((e: any) => {
        // ako je otkazano, ignorišemo grešku
        if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError") {
          return;
        }
        setErr(e?.response?.data?.message ?? e.message ?? "Failed to load transactions");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  
    return () => ctrl.abort(); // otkazi prethodni request na promenu filtera/strane
  }, [debounced]);
  
  

  const lastPage = Math.max(1, Math.ceil(total / limit));
  const reset = () => { setType(""); setGame(""); setFrom(""); setTo(""); setPage(1); };
  const hasFilters =
  type !== "" || game !== "" || from !== "" || to !== "";
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          className="border rounded-lg p-2"
          value={type}
          onChange={(e) => { setType(e.target.value as any); setPage(1); }}
        >
          <option value="">Type: All</option>
          <option value="BET">BET</option>
          <option value="PAYOUT">PAYOUT</option>
          <option value="DEPOSIT">DEPOSIT</option>
          <option value="WITHDRAWAL">WITHDRAWAL</option>
        </select>

        <select
          className="border rounded-lg p-2"
          value={game}
          onChange={(e) => { setGame(e.target.value as any); setPage(1); }}
        >
          <option value="">Game: All</option>
          <option value="slots">slots</option>
          <option value="roulette">roulette</option>
          <option value="blackjack">blackjack</option>
        </select>

        <input
          type="date"
          className="border rounded-lg p-2"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
        />
        <input
          type="date"
          className="border rounded-lg p-2"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
        />

        <button className="border rounded-lg p-2 hover:bg-gray-50" onClick={reset} disabled={!hasFilters || loading}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Game</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">Balance After</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-3 py-6 text-center">Loading…</td></tr>
            )}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{fmtDate(r.createdAt)}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2">{r.game ?? "-"}</td>
                <td className="px-3 py-2 text-right">{fmtMoney(r.amountCents)}</td>
                <td className="px-3 py-2 text-right">{fmtMoney(r.balanceAfterCents)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  {err ?? "No transactions."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginator */}
      <div className="flex justify-end gap-2">
        <button
          className="rounded border px-3 py-1 disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Prev
        </button>
        <button
          className="rounded border px-3 py-1 disabled:opacity-50"
          onClick={() => setPage(p => (p < lastPage ? p + 1 : p))}
          disabled={page >= lastPage || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}
