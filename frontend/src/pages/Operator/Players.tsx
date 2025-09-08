import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../../api/http";

const fmtUSD = (c?: string | number | null) =>
  (Number(c ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

type PlayerRow = {
  id?: string;
  email?: string;
  balanceCents?: string;
  totalGgrCents?: string;
  bets?: number;
  lastActive?: string; // ISO
};

type PageResp<T> = { items: T[]; page: number; limit: number; total: number };

export default function OperatorPlayers() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [leader, setLeader] = useState<Array<{ id?: string; email?: string; ggrCents?: string; bets?: number }>>([]);
  const [ldrErr, setLdrErr] = useState<string | null>(null);

  const params = useMemo(() => ({ page, limit, ...(q && { q }) }), [page, limit, q]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { data } = await api.get<PageResp<PlayerRow>>("/operator/players", { params, signal: ctrl.signal });
        setRows(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total ?? 0));
      } catch (e: any) {
        if (e?.name !== "CanceledError" && e?.code !== "ERR_CANCELED") {
          setErr(e?.response?.data?.message ?? e.message ?? "Failed to load players");
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [params]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLdrErr(null);
      try {
        const { data } = await api.get("/operator/players/leaderboard", { signal: ctrl.signal });
        setLeader(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name !== "CanceledError" && e?.code !== "ERR_CANCELED") {
          setLdrErr(e?.response?.data?.message ?? e.message ?? "Failed to load leaderboard");
        }
      }
    })();
    return () => ctrl.abort();
  }, []);

  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Players</h1>

      {/* Leaderboard */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 font-medium border-b">Top 10 high-rollers</div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-right">GGR</th>
              <th className="px-3 py-2 text-right"># Bets</th>
            </tr>
          </thead>
          <tbody>
            {leader.map((r, i) => (
              <tr className="border-t" key={`${r.id ?? r.email ?? "row"}-${i}`}>
                <td className="px-3 py-2">{r.email ?? "-"}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.ggrCents)}</td>
                <td className="px-3 py-2 text-right">{r.bets ?? "-"}</td>
              </tr>
            ))}
            {leader.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-500">{ldrErr ?? "No data."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Players table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 border-b">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search email…"
            className="border rounded-lg p-2 w-64"
          />
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-right">Total GGR</th>
              <th className="px-3 py-2 text-right"># Bets</th>
              <th className="px-3 py-2 text-right">Last active</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-3 py-6 text-center" colSpan={5}>Loading…</td></tr>}
            {!loading && rows.map((r, i) => (
              <tr key={`${r.id ?? r.email ?? "p"}-${i}`} className="border-t">
                <td className="px-3 py-2">{r.email ?? "-"}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.balanceCents)}</td>
                <td className="px-3 py-2 text-right">{fmtUSD(r.totalGgrCents)}</td>
                <td className="px-3 py-2 text-right">{r.bets ?? "-"}</td>
                <td className="px-3 py-2 text-right">
                  {r.lastActive ? dayjs(r.lastActive).format("YYYY-MM-DD HH:mm") : "-"}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">{err ?? "No players."}</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end gap-2 p-3">
          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => (p < lastPage ? p + 1 : p))}
            disabled={page >= lastPage || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
