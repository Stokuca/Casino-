import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Player } from '../players/player.entity';
import { QueryPlayersDto } from './dto/query-players.dto';
import { LeaderboardDto } from './dto/leaderboard.dto';
import { ActivePlayersDto } from './dto/active-players.dto';


/** Dosledan vremenski opseg: >= from AND <= to nad t."createdAt" */
function applyRange<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  from?: Date,
  to?: Date
) {
  if (from) qb.andWhere(`t."createdAt" >= :from`, { from });
  if (to)   qb.andWhere(`t."createdAt" <= :to`,   { to });
}


@Injectable()
export class OperatorsPlayersService {
  constructor(
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(Player) private readonly playerRepo: Repository<Player>,
  ) {}

  // -------------------------------------------------------------------------
  // TOP (leaderboard) — rang po GGR u izabranom opsegu, uz #bets
  // -------------------------------------------------------------------------
  async leaderboard(dto: LeaderboardDto) {
    const limit = Math.min(dto.limit ?? 10, 100);

    // opcioni vremenski opseg (default: poslednjih 30 dana ka 'to', ako postoji)
    const toDate   = dto.to   ? new Date(dto.to)   : undefined;
    const fromDate = dto.from ? new Date(dto.from)
      : (toDate ? new Date(toDate.getTime() - 30 * 24 * 3600 * 1000) : undefined);

    const qb = this.txRepo
      .createQueryBuilder('t')
      .innerJoin('t.player', 'p')
      .select('t."playerId"', 'playerId')
      .addSelect('p.email', 'email')
      .addSelect(`COUNT(*) FILTER (WHERE t.type = 'BET')`, 'betsCount')
      .addSelect(`SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)`, 'betCents')
      .addSelect(`SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)`, 'payoutCents')
      .addSelect(
        `
        SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)
        -
        SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)
        `,
        'ggrCents',
      )
      .groupBy('t."playerId"')
      .addGroupBy('p.email')
      .orderBy('"ggrCents"', 'DESC')
      .addOrderBy('"betsCount"', 'DESC')
      .limit(limit);

    applyRange(qb, fromDate, toDate);

    const rows = await qb.getRawMany<{
      playerId: string;
      email: string | null;
      betsCount: string | null;
      betCents: string | null;
      payoutCents: string | null;
      ggrCents: string | null;
    }>();

    return rows.map((r) => ({
      playerId: r.playerId,
      email: r.email ?? '-',
      // dosledno: centi kao string
      totalGgrCents: String(Number(r.ggrCents ?? 0)),
      betsCount: Number(r.betsCount ?? 0),
    }));
  }

  // -------------------------------------------------------------------------
  // LIST (search/date/sort/pagination) — tabela igrača
  // -------------------------------------------------------------------------
  async listPlayers(dto: QueryPlayersDto) {
    // pagination
    const page = Math.max(1, Number(dto.page ?? 1));
    const limit = Math.min(Math.max(1, Number(dto.limit ?? 10)), 100);
    const offset = (page - 1) * limit;

    // date range (default: poslednjih 30 dana ka 'to')
    const toDate = dto.to ? new Date(dto.to) : new Date();
    const fromDate = dto.from ? new Date(dto.from) : new Date(toDate.getTime() - 30 * 24 * 3600 * 1000);

    const search = (dto.search ?? '').trim().toLowerCase() || null;

    // 1) Agregacija po playerId iz transactions za dati opseg
    const aggQb = this.txRepo
      .createQueryBuilder('t')
      .select('t."playerId"', 'playerId')
      .addSelect(`COUNT(*) FILTER (WHERE t.type = 'BET')`, 'betsCount')
      .addSelect(`SUM(CASE WHEN t.type = 'BET' THEN t."amountCents"::bigint ELSE 0 END)`, 'betCents')
      .addSelect(`SUM(CASE WHEN t.type = 'PAYOUT' THEN t."amountCents"::bigint ELSE 0 END)`, 'payoutCents')
      // lastActive: poslednja aktivnost BET (zadrži ovako da tabla meri "aktivnost igranja")
      .addSelect(`MAX(t."createdAt") FILTER (WHERE t.type = 'BET')`, 'lastActive');

    applyRange(aggQb, fromDate, toDate);
    aggQb.groupBy('t."playerId"');

    // 2) Wrap kao subquery i JOIN na players da dobijemo email/balance
    const dataQb = this.txRepo
      .createQueryBuilder()
      .select([
        'agg."playerId" AS "playerId"',
        'p.email AS "email"',
        'p."balanceCents" AS "balanceCents"',
        'agg."betsCount" AS "betsCount"',
        'agg."betCents" AS "betCents"',
        'agg."payoutCents" AS "payoutCents"',
        'agg."lastActive" AS "lastActive"',
      ])
      .from('(' + aggQb.getQuery() + ')', 'agg')
      .leftJoin(Player, 'p', 'p.id = agg."playerId"')
      .setParameters(aggQb.getParameters());

    if (search) {
      dataQb.andWhere('LOWER(p.email) LIKE :q', { q: `%${search}%` });
    }

    // sort mapping
    const sortKey = String(dto.sort ?? 'revenue').toLowerCase();
    const orderDir = (String(dto.order ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';

    const sortExpr =
      sortKey === 'revenue'
        ? `"betCents" - "payoutCents"`
        : sortKey === 'bets'
        ? `"betsCount"`
        : `"lastActive"`; // default

    dataQb.orderBy(sortExpr, orderDir).offset(offset).limit(limit);

    const rows = await dataQb.getRawMany<{
      playerId: string;
      email: string | null;
      balanceCents: string | null;
      betsCount: string | null;
      betCents: string | null;
      payoutCents: string | null;
      lastActive: Date | null;
    }>();

    // 3) total (uz iste filtere i search)
    const countQb = this.txRepo
      .createQueryBuilder()
      .select('COUNT(*)', 'cnt')
      .from('(' + aggQb.getQuery() + ')', 'agg')
      .leftJoin(Player, 'p', 'p.id = agg."playerId"')
      .setParameters(aggQb.getParameters());

    if (search) {
      countQb.andWhere('LOWER(p.email) LIKE :q', { q: `%${search}%` });
    }

    const totalRow = await countQb.getRawOne<{ cnt: string }>();
    const total = Number(totalRow?.cnt || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasNext = page < totalPages;

    const items = rows.map((r) => ({
      playerId: r.playerId,
      email: r.email ?? '-',
      // centi kao string — dosledno sa ostatkom API-ja
      balanceCents: String(Number(r.balanceCents ?? 0)),
      totalGgrCents: String(Number(r.betCents ?? 0) - Number(r.payoutCents ?? 0)),
      betsCount: Number(r.betsCount ?? 0),
      lastActive: r.lastActive ? new Date(r.lastActive) : null,
    }));

    return { page, limit, total, totalPages, hasNext, items };
  }

  // -------------------------------------------------------------------------
  // KPI: Active players u poslednjih N dana (BET/PAYOUT)
  // -------------------------------------------------------------------------
  async activePlayers(dto: ActivePlayersDto) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - dto.windowDays);

    const row = await this.txRepo
      .createQueryBuilder('t')
      .select('COUNT(DISTINCT t.playerId)', 'active')
      .where(`t.type IN ('BET','PAYOUT')`)
      .andWhere(`t."createdAt" >= :since`, { since })
      .getRawOne<{ active: string }>();

    return { windowDays: dto.windowDays, activePlayers: Number(row?.active || 0), since };
  }
}
