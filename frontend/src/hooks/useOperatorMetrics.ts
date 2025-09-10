import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useAbortable } from "./useAbortable";
import {
  revenue, revenueByGame, mostProfitable, mostPopular,
  avgBet, activePlayers, betsCount, rtpPerGame, type Granularity
} from "../api/operator";
import { onMetricsChanged, onRevenueTick } from "../realtime";
import { toIsoRange, toPlainRange } from "../utils/dates";

export function useOperatorFilters() {
  const [from, setFrom] = useState(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [gran, setGran] = useState<Granularity>("day");
  const reset = () => {
    setFrom(dayjs().subtract(6, "day").format("YYYY-MM-DD"));
    setTo(dayjs().format("YYYY-MM-DD"));
    setGran("day");
  };
  return { from, to, gran, setFrom, setTo, setGran, reset };
}

export function useOperatorData(from: string, to: string, gran: Granularity) {
  const [tick, setTick] = useState(0);
  const lastBump = useRef(0);
  useEffect(() => {
    const bump = () => {
      const now = Date.now();
      if (now - lastBump.current > 400) { lastBump.current = now; setTick(t => t + 1); }
    };
    const off1 = onMetricsChanged(bump);
    const off2 = onRevenueTick(bump);
    return () => { off1(); off2(); };
  }, []);

  const iso = useMemo(() => toIsoRange(from, to), [from, to]);
  const plain = useMemo(() => toPlainRange(from, to), [from, to]);

  const seriesQ   = useAbortable((s) => revenue({ ...plain, granularity: gran }, s), [gran, plain.from, plain.to, tick]);
  const byGameQ   = useAbortable((s) => revenueByGame(iso, s), [iso.from, iso.to, tick]);
  const profQ     = useAbortable((s) => mostProfitable(iso, s), [iso.from, iso.to, tick]);
  const popularQ  = useAbortable((s) => mostPopular(iso, s), [iso.from, iso.to, tick]);
  const avgBetQ   = useAbortable((s) => avgBet(iso, s), [iso.from, iso.to, tick]);
  const activeQ   = useAbortable((s) => activePlayers(iso, s), [iso.from, iso.to, tick]);
  const rtpQ      = useAbortable((s) => rtpPerGame(iso, s), [iso.from, iso.to, tick]);
  const betsQ     = useAbortable((s) => betsCount(iso, s), [iso.from, iso.to, tick]);

  const loadingAny =
    seriesQ.loading || byGameQ.loading || profQ.loading || popularQ.loading ||
    avgBetQ.loading || activeQ.loading || betsQ.loading || rtpQ.loading;

  return { seriesQ, byGameQ, profQ, popularQ, avgBetQ, activeQ, rtpQ, betsQ, loadingAny, plain, iso };
}
