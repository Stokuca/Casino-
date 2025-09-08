import { api } from "./http";

/** Granulacija serije prihoda */
export type Granularity = "day" | "week" | "month";

/** Interval koji ŠALJEMO backendu — plain date (YYYY-MM-DD) */
export type Range = { from: string; to: string };

/* ---------- tipovi odgovora (UI-friendly) ---------- */
export type RevenuePoint = { date: string; ggrCents: string };
export type RevenueResp = { totalGgrCents: string; series: RevenuePoint[] };

export type RevenueByGameRow = { game: string; ggrCents: string; bets?: number };
export type TopGameRow = {
  game: string;
  ggrCents?: string;
  bets: number;
  rtpActual?: number;
  rtpTheoretical?: number;
};

const arr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

/** Serija prihoda — šaljemo plain datume; backend vraća bucketStart */
export async function revenue(
  range: Range & { granularity: Granularity },
  signal?: AbortSignal
): Promise<RevenueResp> {
  const { from, to, granularity } = range;

  // mapiraj UI -> backend enum
  const gran =
    granularity === "day" ? "daily" :
    granularity === "week" ? "weekly" : "monthly";

  try {
    const { data } = await api.get("/operator/metrics/revenue", {
      params: { from, to, granularity: gran }, // ⬅️ samo ova 3
      signal,
    });

    const series = (Array.isArray(data?.series) ? data.series : []).map((r: any) => ({
      date: String(r.bucketStart ?? r.date ?? from),
      ggrCents: String(r.ggrCents ?? 0),
    }));

    return { totalGgrCents: String(data?.totalGgrCents ?? 0), series };
  } catch (e: any) {
    if (e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError") {
      throw e; // tiho ignorišemo u hooku
    }
    console.error("revenue error:", e?.response?.data || e);
    throw e;
  }
}



export async function revenueByGame(range: Range, signal?: AbortSignal) {
  const { data } = await api.get("/operator/metrics/revenue-by-game", {
    params: range,
    signal,
  });
  // backend: { gameCode, gameName, ggrCents, ... }
  return arr<any>(data).map((g) => ({
    game: String(g.gameName ?? g.gameCode ?? "-"),
    ggrCents: String(g.ggrCents ?? 0),
    bets: Number(g.rounds ?? g.betsCount ?? 0) || undefined,
  })) as RevenueByGameRow[];
}

export async function mostProfitable(range: Range, signal?: AbortSignal) {
  const { data } = await api.get("/operator/metrics/games/top-profitable", {
    params: range,
    signal,
  });
  return arr<any>(data).map((g) => ({
    game: String(g.gameName ?? g.gameCode ?? "-"),
    ggrCents: String(g.ggrCents ?? 0),
    bets: Number(g.rounds ?? g.betsCount ?? 0) || undefined,
  })) as TopGameRow[];
}

export async function mostPopular(range: Range, signal?: AbortSignal) {
  const { data } = await api.get("/operator/metrics/games/most-popular", {
    params: range,
    signal,
  });
  return arr<any>(data).map((g) => ({
    game: String(g.gameName ?? g.gameCode ?? "-"),
    ggrCents: String(g.ggrCents ?? 0), // može i da izostane – tabele to već hendluju
    bets: Number(g.betsCount ?? g.rounds ?? 0),
  })) as TopGameRow[];
}

export async function avgBet(range: Range, signal?: AbortSignal) {
  const { data } = await api.get("/operator/metrics/games/avg-bet", {
    params: range,
    signal,
  });

  // backend vraća niz po igri; za KPI treba agregat
  if (Array.isArray(data)) {
    const cents = data.reduce((s, it: any) => s + Number(it?.avgBetCents ?? 0), 0);
    const avg = data.length ? Math.round(cents / data.length) : 0;
    return { avgBetCents: String(avg) };
  }
  if (data && typeof data === "object" && "avgBetCents" in data) {
    return { avgBetCents: String((data as any).avgBetCents ?? 0) };
  }
  return { avgBetCents: "0" };
}

/** Backend traži windowDays (ne from/to) */
export async function activePlayers(windowDays: number, signal?: AbortSignal) {
  const { data } = await api.get<{
    windowDays?: number;
    activePlayers?: number;
    count?: number;
  }>("/operator/metrics/active-players", { params: { windowDays }, signal });
  return { count: Number(data?.count ?? data?.activePlayers ?? 0) };
}
