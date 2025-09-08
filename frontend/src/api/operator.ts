import { api } from "./http";

/** Granulacija serije prihoda */
export type Granularity = "day" | "week" | "month";

/** Interval koji ŠALJEMO backendu — ISO (frontend ga izračuna u pages) */
export type Range = { from: string; to: string };

/* ---------- tipovi odgovora ---------- */
export type RevenuePoint = { date?: string; ts?: string; ggrCents: string };
export type RevenueByGameRow = { game: string; ggrCents: string; bets?: number };
export type TopGameRow = {
  game: string;
  ggrCents?: string;
  bets: number;
  rtpActual?: number;
  rtpTheoretical?: number;
};

const arr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

/** Serija prihoda — šaljemo validan ISO, nema više 400 */
export async function revenue(
  range: Range & { granularity: Granularity },
  signal?: AbortSignal
): Promise<RevenuePoint[]> {
  const { data } = await api.get<RevenuePoint[]>("/operator/metrics/revenue", {
    params: range, // { from: ISO, to: ISO, granularity }
    signal,
  });
  return arr<RevenuePoint>(data);
}

export async function revenueByGame(range: Range, signal?: AbortSignal) {
  const { data } = await api.get<RevenueByGameRow[]>("/operator/metrics/revenue-by-game", {
    params: range,
    signal,
  });
  return arr<RevenueByGameRow>(data);
}

export async function mostProfitable(range: Range, signal?: AbortSignal) {
  const { data } = await api.get<TopGameRow[]>("/operator/metrics/games/top-profitable", {
    params: range,
    signal,
  });
  return arr<TopGameRow>(data);
}

export async function mostPopular(range: Range, signal?: AbortSignal) {
  const { data } = await api.get<TopGameRow[]>("/operator/metrics/games/most-popular", {
    params: range,
    signal,
  });
  return arr<TopGameRow>(data);
}

export async function avgBet(range: Range, signal?: AbortSignal) {
  const { data } = await api.get("/operator/metrics/games/avg-bet", {
    params: range,
    signal,
  });
  if (data && typeof data === "object" && "avgBetCents" in data) {
    return data as { avgBetCents?: string };
  }
  if (Array.isArray(data)) {
    const cents = data.reduce((s, it: any) => s + Number(it?.avgBetCents ?? 0), 0);
    const avg = data.length ? Math.round(cents / data.length) : 0;
    return { avgBetCents: String(avg) };
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
