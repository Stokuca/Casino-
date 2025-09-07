import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { listTransactions, type Tx, type TxType, type Game } from "../../api/transactions";

const TYPES: (TxType | "")[] = ["", "BET", "PAYOUT", "DEPOSIT", "WITHDRAWAL"];
const GAMES: (Game | "")[] = ["", "slots", "roulette", "blackjack"];

export default function PlayerTransactions() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState<"" | TxType>("");
  const [game, setGame] = useState<"" | Game>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const data = await listTransactions({
          page, limit,
          type: type || undefined,
          game: game || undefined,
          from: from || undefined,
          to: to || undefined,
        });
        setRows(data.items);
        setTotal(data.total);
      } catch (e: any) {
        setErr(e?.response?.data?.message ?? "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, limit, type, game, from, to]);

  const resetFilters = () => { setType(""); setGame(""); setFrom(""); setTo(""); setPage(1); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 grid gap-3 md:grid-cols-5">
        <select className="border rounded px-3 py-2" value={type} onChange={e=>{setType(e.target.value as any); setPage(1);}}>
          {TYPES.map(t => <option key={t || "all"} value={t}>{t || "All types"}</option>)}
        </select>
        <select className="border rounded px-3 py-2" value={game} onChange={e=>{setGame(e.target.value as any); setPage(1);}}>
          {GAMES.map(g => <option key={g || "all"} value={g}>{g || "All games"}</option>)}
        </select>
        <input type="date" className="border rounded px-3 py-2" value={from} onChange={e=>{setFrom(e.target.value); setPage(1);}} />
        <input type="date" className="border rounded px-3 py-2" value={to} onChange={e=>{setTo(e.target.value); setPage(1);}} />
        <button onClick={resetFilters} className="rounded bg-gray-900 text-white px-3 py-2">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Game</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-right px-4 py-2">Balance After</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            ) : err ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-red-600">{err}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No data</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{dayjs(r.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.game ?? "-"}</td>
                <td className="px-4 py-2 text-right">
                  {(Number(r.amountCents)/100).toLocaleString(undefined,{style:"currency",currency:"USD"})}
                </td>
                <td className="px-4 py-2 text-right">
                  {(Number(r.balanceAfterCents)/100).toLocaleString(undefined,{style:"currency",currency:"USD"})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Page {page} / {pages}</span>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 rounded border disabled:opacity-50">Prev</button>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 rounded border disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
