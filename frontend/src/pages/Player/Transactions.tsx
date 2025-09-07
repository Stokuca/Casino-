import { useEffect, useState } from "react";
import { getMyTransactions, type Tx, type TxType, type GameKey } from "../../api/transactions";

const fmtMoney = (c: string) =>
  (Number(c) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
const fmtDate = (iso: string) => new Date(iso).toLocaleString();

export default function PlayerTransactions() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [type, setType] = useState<TxType | undefined>(undefined);
  const [game, setGame] = useState<GameKey | undefined>(undefined);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await getMyTransactions({ page, limit, type, game, from, to });
      setRows(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e.message ?? "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, limit, type, game, from, to]);

  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>

      {/* tabela */}
      <div className="rounded-2xl border bg-white p-0 overflow-hidden">
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
            {rows.map((r) => (
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

      {/* paginator */}
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
