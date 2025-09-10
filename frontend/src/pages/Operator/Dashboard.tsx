import dayjs from "dayjs";
import { useMemo } from "react";
import { useOperatorFilters, useOperatorData } from "../../hooks/useOperatorMetrics";
import { fmtUSD } from "../../utils/currency";
import Filters from "./Filters";
import KpiCard from "./KpiCard";
import RevenueAreaChart from "./RevenueAreaChart";
import RevenuePieChart from "./RevenuePieChart";
import GamesTable from "./GamesTable";

export default function OperatorDashboard() {
  const { from, to, gran, setFrom, setTo, setGran, reset } = useOperatorFilters();
  const { seriesQ, byGameQ, profQ, popularQ, avgBetQ, activeQ, rtpQ, betsQ, loadingAny, plain } =
    useOperatorData(from, to, gran);

  const ggrTotalCents = Number((seriesQ.data as any)?.totalGgrCents ?? 0);
  const betsTotal = Number((betsQ.data as any)?.count ?? 0);
  const avgBetCents = (() => {
    const d = avgBetQ.data as any;
    if (!d) return 0;
    if (Array.isArray(d)) return Number(d[0]?.avgBetCents ?? 0);
    return Number(d?.avgBetCents ?? 0);
  })();
  const activeCount = Number((activeQ.data as any)?.count ?? 0);

  const series = (((seriesQ.data as any)?.series ?? []) as Array<any>).map(p => ({
    ts: dayjs(p.bucketStart ?? p.date ?? plain.from).format("M/D/YYYY"),
    ggr: Number(p.ggrCents ?? 0) / 100,
  }));

  const pieData = (byGameQ.data ?? [])
    .map((g: any) => ({ name: g.game, value: Number(g.ggrCents ?? 0) / 100 }))
    .filter((d) => d.value > 0);

  const rtpMap = useMemo(() => {
    const m = new Map<string, { act: number; th: number }>();
    for (const r of (rtpQ.data ?? [])) m.set(r.game, { act: r.rtpActual, th: r.rtpTheoretical });
    return m;
  }, [rtpQ.data]);

  const profRows = useMemo(
    () => (profQ.data ?? []).map((r: any) => ({ ...r, rtpActual: rtpMap.get(r.game)?.act, rtpTheoretical: rtpMap.get(r.game)?.th })),
    [profQ.data, rtpMap]
  );
  const popularRows = useMemo(
    () => (popularQ.data ?? []).map((r: any) => ({ ...r, rtpActual: rtpMap.get(r.game)?.act, rtpTheoretical: rtpMap.get(r.game)?.th })),
    [popularQ.data, rtpMap]
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Operator Dashboard</h1>

      <Filters
        from={from} to={to} gran={gran}
        setFrom={setFrom} setTo={setTo} setGran={setGran}
        onReset={reset}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="GGR" value={fmtUSD(ggrTotalCents)} loading={loadingAny} />
        <KpiCard label="Bets" value={String(betsTotal)} loading={loadingAny} />
        <KpiCard label="Active players" value={String(activeCount)} loading={loadingAny} />
        <KpiCard label="Avg bet" value={fmtUSD(avgBetCents)} loading={loadingAny} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueAreaChart data={series} gran={gran} />
        <RevenuePieChart data={pieData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GamesTable title="Most profitable games" rows={profRows} loading={profQ.loading || rtpQ.loading} />
        <GamesTable title="Most popular games" rows={popularRows} loading={popularQ.loading || rtpQ.loading} />
      </div>
    </div>
  );
}
