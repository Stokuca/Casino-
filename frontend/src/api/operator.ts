import { api } from "./http";

export type Granularity = "day" | "week" | "month";
export type GameKey = "slots" | "roulette" | "blackjack";

export type RevenuePoint = { ts: string; ggrCents: string }; // ts = period start ISO
export type RevenueByGame = { game: GameKey; ggrCents: string };

export type TopGame = {
  game: GameKey;
  ggrCents: string;
  bets: number;
  rtpActual?: number;   // (0..1), ako backend šalje
  rtpTheoretical?: number; // (0..1)
};

export type Kpi = {
  ggrCents: string;   // total GGR za opseg
  bets: number;       // broj betova u opsegu
  activePlayers: number;
  avgBetCents: string;
};

export async function getKpi(params: { from?: string; to?: string }) {
  const { data } = await api.get<Kpi>("/operator/metrics/revenue/kpi", { params });
  return data;
}

// npr. /operator/metrics/revenue?granularity=day&from=...&to=...
export async function getRevenueSeries(params: { granularity: Granularity; from?: string; to?: string }) {
  const { data } = await api.get<RevenuePoint[]>("/operator/metrics/revenue", { params });
  return data;
}

export async function getRevenueByGame(params: { from?: string; to?: string }) {
  const { data } = await api.get<RevenueByGame[]>("/operator/metrics/revenue-by-game", { params });
  return data;
}

export async function getTopProfitable(params: { from?: string; to?: string }) {
  const { data } = await api.get<TopGame[]>("/operator/metrics/games/top-profitable", { params });
  return data;
}

export async function getMostPopular(params: { from?: string; to?: string }) {
  const { data } = await api.get<TopGame[]>("/operator/metrics/games/most-popular", { params });
  return data;
}
