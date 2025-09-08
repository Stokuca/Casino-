import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  getKpi,
  getRevenueSeries,
  getRevenueByGame,
  getTopProfitable,
  getMostPopular,
  type Granularity,
  type RevenuePoint,
  type RevenueByGame,
  type TopGame,
} from "../../api/operator";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const fmtUSD = (cents: string | number) =>
  (Number(cents) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

function useAbortable<T>(fn: (signal: AbortSignal) => Promise<T>, deps: any[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setErr(null);
    fn(ctrl.signal)
      .then((d) => setData(d))
      .catch((e: any) => {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED" || e?.name === "AbortError") return;
        setErr(e?.response?.data?.message ?? e.message ?? "Failed");
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, err };
}

export default function OperatorDashboard() {
  // Filter bar (last 7 days by default)
  const [from, setFrom] = useState(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [gran, setGran] = useState<Granularity>("day");

  const params = useMemo(() => ({
    from: dayjs(from).startOf("day").toISOString(),
    to: dayjs(to).endOf("day").toISOString(),
  }), [from, to]);

  const kpiQ = useAbortable(
    async (signal) => getKpi({ ...params }),
    [params.from, params.to]
  );
  const seriesQ = useAbortable<RevenuePoint[]>(
    async (signal) => getRevenueSeries({ granularity: gran, ...params }),
    [gran, params.from, params.to]
  );
  const byGameQ = useAbortable<RevenueByGame[]>(
    async (signal) => getRevenueByGame({ ...params }),
    [params.from, params.to]
  );
  const topProfQ = useAbortable<TopGame[]>(
    async (signal) => getTopProfitable({ ...params }),
    [params.from, params.to]
  );
  const popularQ = useAbortable<TopGame[]>(
    async (signal) => getMostPopular({ ...params }),
    [params.from, params.to]
  );

  // Recharts expects numbers
  const series = (seriesQ.data ?? []).map(p => ({ ts: new Date(p.ts).toLocaleDateString(), ggr: Number(p.ggrCents) / 100 }));
  const pieData = (byGameQ.data ?? []).map(d => ({ name: d.game, value: Number(d.ggrCents) / 100 }));

  const reset = () => {
    setFrom(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
    setTo(dayjs().format("YYYY-MM-DD"));
    setGran("day");
  };

  const loadingAny = kpiQ.loading || seriesQ.loading || byGameQ.loading || topProfQ.loading || popularQ.loading;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Operator Dashboard</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="border rounded-lg p-2" value={gran} onChange={(e) => setGran(e.target.value as Granularity)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        <input type="date" className="border rounded-lg p-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="border rounded-lg p-2" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="border rounded-lg p-2 hover:bg-gray-50" onClick={reset}>Reset</button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-gray-500 text-sm">GGR</div>
          <div className="text-xl font-semibold">{kpiQ.data ? fmtUSD(kpiQ.data.ggrCents) : (loadingAny ? "…" : "-")}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-gray-500 text-sm">Bets</div>
          <div className="text-xl font-semibold">{kpiQ.data ? kpiQ.data.bets : (loadingAny ? "…" : "-")}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-gray-500 text-sm">Active players</div>
          <div className="text-xl font-semibold">{kpiQ.data ? kpiQ.data.activePlayers : (loadingAny ? "…" : "-")}</div>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-gray-500 text-sm">Avg bet</div>
          <div className="text-xl font-semibold">{kpiQ.data ? fmtUSD(kpiQ.data.avgBetCents) : (loadingAny ? "…" : "-")}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4 bg-white">
          <div className="mb-2 font-medium">Revenue by {gran}</div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <XAxis dataKey="ts" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => fmtUSD(v * 100)} />
                <Area type="monotone" dataKey="ggr" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border p-4 bg-white">
          <div className="mb-2 font-medium">Revenue by game</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label />
                {/* Recharts boje default — ne postavljamo custom da ostanemo u guideline-u */}
                {pieData.map((_, i) => <Cell key={i} />)}
                <Legend />
                <Tooltip formatter={(v: number) => fmtUSD(v * 100)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableGames title="Most profitable games" rows={topProfQ.data ?? []} loading={topProfQ.loading} />
        <TableGames title="Most popular games" rows={popularQ.data ?? []} loading={popularQ.loading} />
      </div>
    </div>
  );
}

function TableGames({ title, rows, loading }: { title: string; rows: TopGame[]; loading: boolean }) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="px-4 py-3 font-medium border-b">{title}</div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Game</th>
            <th className="px-3 py-2 text-right">GGR</th>
            <th className="px-3 py-2 text-right"># Bets</th>
            <th className="px-3 py-2 text-right">RTP (act/th)</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={4} className="px-3 py-6 text-center">Loading…</td></tr>}
          {!loading && rows.map((g) => (
            <tr key={g.game} className="border-t">
              <td className="px-3 py-2">{g.game}</td>
              <td className="px-3 py-2 text-right">{fmtUSD(g.ggrCents)}</td>
              <td className="px-3 py-2 text-right">{g.bets}</td>
              <td className="px-3 py-2 text-right">
                {g.rtpActual != null && g.rtpTheoretical != null
                  ? `${Math.round(g.rtpActual * 100)}% / ${Math.round(g.rtpTheoretical * 100)}%`
                  : "-"}
              </td>
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No data.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
