// backend/src/modules/operators/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { Transaction } from '../../transactions/transaction.entity';
import { Granularity } from './revenue.dto';

// gore u fajlu:
type PeriodRow = { period: Date; totalBet: string; totalPayout: string };


type GameAggRow = {
  gameId: string;
  gameCode: string;
  gameName: string;
  totalBet?: string;
  totalPayout?: string;
  ggr?: string;
  rounds?: string;
  avgBet?: string;
  rtpPercent?: string;
  rtpTheoretical?: string;
};

function dateTrunc(granularity: Granularity) {
  switch (granularity) {
    case Granularity.DAILY:
      return 'day';
    case Granularity.WEEKLY:
      return 'week';
    case Granularity.MONTHLY:
      return 'month';
  }
}

function applyRange<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  from?: Date,
  to?: Date,
  alias = 't',
) {
  if (from) qb.andWhere(`${alias}."createdAt" >= :from`, { from });
  if (to) qb.andWhere(`${alias}."createdAt" <= :to`, { to });
  return qb;
}

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  // ---------------- Revenue by period ----------------
  async revenueByPeriod(opts: { granularity: Granularity; from?: Date; to?: Date }) {
    const { granularity, from, to } = opts;
    const trunc = dateTrunc(granularity);

    const qb = this.txRepo
      .createQueryBuilder('t')
      .select(`DATE_TRUNC('${trunc}', t."createdAt")`, 'period')
      .addSelect(
        `SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalBet',
      )
      .addSelect(
        `SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalPayout',
      )
      .groupBy('period')
      .orderBy('period', 'ASC');

    applyRange(qb, from, to);

    // u revenueByPeriod():
const rows = await qb.getRawMany<PeriodRow>();

return rows.map((r) => {
  const totalBet = Number(r.totalBet ?? 0);
  const totalPayout = Number(r.totalPayout ?? 0);
  return {
    period: r.period,
    totalBetCents: totalBet,
    totalPayoutCents: totalPayout,
    ggrCents: totalBet - totalPayout,
  };
});

  }

  // ---------------- Revenue by game (pie) ----------------
  async revenueByGame(opts: { from?: Date; to?: Date }) {
    const { from, to } = opts;

    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.game', 'g')
      .select('g.id', 'gameId')
      .addSelect('g.code', 'gameCode')
      .addSelect('g.name', 'gameName')
      .addSelect(
        `SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalBet',
      )
      .addSelect(
        `SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalPayout',
      )
      .groupBy('g.id')
      .addGroupBy('g.code')
      .addGroupBy('g.name')
      .orderBy('g.name', 'ASC');

    applyRange(qb, from, to);

    const rows = await qb.getRawMany<GameAggRow>();
return rows.map((r) => {
  const totalBet = Number(r.totalBet ?? 0);
  const totalPayout = Number(r.totalPayout ?? 0);
  return {
    gameId: r.gameId,
    gameCode: r.gameCode,
    gameName: r.gameName,
    totalBetCents: totalBet,
    totalPayoutCents: totalPayout,
    ggrCents: totalBet - totalPayout,
  };
});

  }

    // ---------------- Active players (DISTINCT playerId with BET) ----------------
    async activePlayers(from?: Date, to?: Date) {
      const qb = this.txRepo.createQueryBuilder('t')
        .select('COUNT(DISTINCT t."playerId")', 'count')
        .where(`t.type = 'BET'`);
      applyRange(qb, from, to);
  
      const row = await qb.getRawOne<{ count: string }>();
      return { count: Number(row?.count ?? 0) };
    }
  
    // ---------------- #Bets KPI ----------------
    async betsCount(from?: Date, to?: Date) {
      const qb = this.txRepo.createQueryBuilder('t')
        .select(`COUNT(*) FILTER (WHERE t.type = 'BET')`, 'bets');
      applyRange(qb, from, to);
  
      const row = await qb.getRawOne<{ bets: string }>();
      return { bets: Number(row?.bets ?? 0) };
    }
  

  // ---------------- Top profitable games (po GGR) ----------------
  async topProfitableGames(limit: number, from?: Date, to?: Date) {
    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.game', 'g')
      .select('g.id', 'gameId')
      .addSelect('g.code', 'gameCode')
      .addSelect('g.name', 'gameName')
      .addSelect(
        `SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalBet',
      )
      .addSelect(
        `SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalPayout',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE t.type = 'BET')`,
        'rounds',                                // 👈 NOVO
      )
      .groupBy('g.id')
      .addGroupBy('g.code')
      .addGroupBy('g.name')
      .orderBy(
        `
        SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)
        -
        SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)
        `,
        'DESC',
      )
      .limit(limit);
  
    applyRange(qb, from, to);
  
    const rows = await qb.getRawMany<GameAggRow>();
    return rows.map((r) => {
      const totalBet = Number(r.totalBet ?? 0);
      const totalPayout = Number(r.totalPayout ?? 0);
      return {
        gameId: r.gameId,
        gameCode: r.gameCode,
        gameName: r.gameName,
        totalBetCents: totalBet,
        totalPayoutCents: totalPayout,
        ggrCents: totalBet - totalPayout,
        betsCount: Number((r as any).rounds ?? 0),  // 👈 NOVO
      };
    });
  }
  

  // ---------------- Most popular games (#BET) ----------------
  async mostPopularGames(limit: number, from?: Date, to?: Date) {
    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.game', 'g')
      .select('g.id', 'gameId')
      .addSelect('g.code', 'gameCode')
      .addSelect('g.name', 'gameName')
      .addSelect(`COUNT(*) FILTER (WHERE t.type = 'BET')`, 'rounds')
      .groupBy('g.id')
      .addGroupBy('g.code')
      .addGroupBy('g.name')
      .orderBy(`COUNT(*) FILTER (WHERE t.type = 'BET')`, 'DESC')
      .limit(limit);

    applyRange(qb, from, to);

    const rows = await qb.getRawMany<GameAggRow>();
    return rows.map((r) => ({
      gameId: r.gameId,
      gameCode: r.gameCode,
      gameName: r.gameName,
      rounds: Number(r.rounds ?? 0),
    }));
    
  }

  // ---------------- Average bet per game ----------------
  async avgBetPerGame(from?: Date, to?: Date) {
    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.game', 'g')
      .select('g.id', 'gameId')
      .addSelect('g.code', 'gameCode')
      .addSelect('g.name', 'gameName')
      .addSelect(
        `AVG(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint END)`,
        'avgBet',
      )
      .groupBy('g.id')
      .addGroupBy('g.code')
      .addGroupBy('g.name')
      .orderBy('g.name', 'ASC');

    applyRange(qb, from, to);

    const rows = await qb.getRawMany<GameAggRow>();
    return rows.map((r) => ({
      gameId: r.gameId,
      gameCode: r.gameCode,
      gameName: r.gameName,
      avgBetCents: Math.round(Number(r.avgBet ?? 0)),
    }));
    
  }

  // ---------------- Actual vs Theoretical RTP per game ----------------
  async rtpPerGame(from?: Date, to?: Date) {
    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.game', 'g')
      .select('g.id', 'gameId')
      .addSelect('g.code', 'gameCode')
      .addSelect('g.name', 'gameName')
      .addSelect('g.rtpTheoretical', 'rtpTheoretical')
      .addSelect(
        `SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalBet',
      )
      .addSelect(
        `SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)`,
        'totalPayout',
      )
      .addSelect(
        `CASE
           WHEN SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END) = 0
           THEN 0
           ELSE ROUND(
             SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)
             * 100.0
             / NULLIF(SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END), 0),
             2
           )
         END`,
        'rtpPercent',
      )
      .groupBy('g.id')
      .addGroupBy('g.code')
      .addGroupBy('g.name')
      .addGroupBy('g.rtpTheoretical')
      .orderBy('g.name', 'ASC');

    applyRange(qb, from, to);

    const rows = await qb.getRawMany<GameAggRow>();
    return rows.map((r) => ({
      gameId: r.gameId,
      gameCode: r.gameCode,
      gameName: r.gameName,
      theoreticalRtpPct: Number(r.rtpTheoretical ?? 0),
      actualRtpPct: Number(r.rtpPercent ?? 0),
      totalBetCents: Number(r.totalBet ?? 0),
      totalPayoutCents: Number(r.totalPayout ?? 0),
    }));
    
  }
}
