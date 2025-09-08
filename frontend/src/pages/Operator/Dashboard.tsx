import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  revenue,
  revenueByGame,
  mostProfitable,
  mostPopular,
  avgBet,
  activePlayers,
  type Granularity,
} from "../../api/operator";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const fmtUSD = (cents?: string | number | null) =>
  (Number(cents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

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
  // date-input drži 'YYYY-MM-DD'
  const [from, setFrom] = useState(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [gran, setGran] = useState<Granularity>("day");

  // ⇣ Backend traži ISO8601 → pretvaramo u ISO kada šaljemo
  const paramsIso = useMemo(() => ({
    from: dayjs(from).startOf("day").toISOString(),
    to: dayjs(to).endOf("day").toISOString(),
  }), [from, to]);

  // active-players prima windowDays (broj dana)
  const windowDays = useMemo(
    () => Math.max(1, dayjs(to).diff(dayjs(from), "day") + 1),
    [from, to]
  );

  const seriesQ = useAbortable(
    (signal) => revenue({ ...paramsIso, granularity: gran }, signal),
    [gran, paramsIso.from, paramsIso.to]
  );
  const byGameQ = useAbortable(
    (signal) => revenueByGame(paramsIso, signal),
    [paramsIso.from, paramsIso.to]
  );
  const profQ = useAbortable(
    (signal) => mostProfitable(paramsIso, signal),
    [paramsIso.from, paramsIso.to]
  );
  const popularQ = useAbortable(
    (signal) => mostPopular(paramsIso, signal),
    [paramsIso.from, paramsIso.to]
  );
  const avgBetQ = useAbortable(
    (signal) => avgBet(paramsIso, signal),
    [paramsIso.from, paramsIso.to]
  );
  const activeQ = useAbortable(
    (signal) => activePlayers(windowDays, signal),
    [windowDays]
  );

  const ggrTotalCents = (seriesQ.data ?? []).reduce((acc: number, p: any) => acc + Number(p.ggrCents ?? 0), 0);
  const betsTotal = (byGameQ.data ?? []).reduce((acc: number, g: any) => acc + Number(g.bets ?? 0), 0);

  const avgBetCents = (() => {
    const d = avgBetQ.data as any;
    if (!d) return 0;
    if (Array.isArray(d)) return Number(d[0]?.avgBetCents ?? 0);
    return Number(d?.avgBetCents ?? 0);
  })();

  const activeCount = Number((activeQ.data as any)?.count ?? 0);

  const series = (seriesQ.data ?? []).map((p: any) => ({
    ts: new Date(p.date ?? p.ts ?? paramsIso.from).toLocaleDateString(),
    ggr: Number(p.ggrCents ?? 0) / 100,
  }));
  const pieData = (byGameQ.data ?? []).map((g: any) => ({
    name: g.game,
    value: Number(g.ggrCents ?? 0) / 100,
  }));

  const reset = () => {
    setFrom(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
    setTo(dayjs().format("YYYY-MM-DD"));
    setGran("day");
  };

  const loadingAny =
    seriesQ.loading || byGameQ.loading || profQ.loading || popularQ.loading || avgBetQ.loading || activeQ.loading;

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

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="GGR" value={fmtUSD(ggrTotalCents)} loading={loadingAny} />
        <KpiCard label="Bets" value={betsTotal.toString()} loading={loadingAny} />
        <KpiCard label="Active players" value={activeCount.toString()} loading={loadingAny} />
        <KpiCard label="Avg bet" value={fmtUSD(avgBetCents)} loading={loadingAny} />
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
                {pieData.map((d, i) => <Cell key={`${d.name}-${i}`} />)}
                <Legend />
                <Tooltip formatter={(v: number) => fmtUSD(v * 100)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GamesTable title="Most profitable games" rows={profQ.data ?? []} loading={profQ.loading} />
        <GamesTable title="Most popular games" rows={popularQ.data ?? []} loading={popularQ.loading} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-semibold">{loading ? "…" : value}</div>
    </div>
  );
}

function GamesTable({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: Array<{ game: string; ggrCents?: string; bets?: number; rtpActual?: number; rtpTheoretical?: number }>;
  loading: boolean;
}) {
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
          {!loading && rows.map((g, i) => (
            <tr key={`${g.game}-${i}`} className="border-t">
              <td className="px-3 py-2">{g.game}</td>
              <td className="px-3 py-2 text-right">{fmtUSD(g.ggrCents)}</td>
              <td className="px-3 py-2 text-right">{g.bets ?? "-"}</td>
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
