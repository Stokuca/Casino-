import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

function applyRange<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  from?: Date,
  to?: Date
) {
  if (from) qb.andWhere(`t."createdAt" >= :from`, { from });
  if (to)   qb.andWhere(`t."createdAt" <= :to`,   { to });
}

@Injectable()
export class TransactionsService {
  constructor(@InjectRepository(Transaction) private readonly trepo: Repository<Transaction>) {}

  async listForPlayer(playerId: string, q: QueryTransactionsDto) {
    const page  = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(Math.max(1, Number(q.limit ?? 20)), 100);
    const offset = (page - 1) * limit;

    const fromDate = q.from ? new Date(q.from) : undefined;
    const toDate   = q.to   ? new Date(q.to)   : undefined;

    const baseQb = this.trepo
      .createQueryBuilder('t')
      .leftJoin('t.game', 'g')
      .where(`t."playerId" = :playerId`, { playerId });

    if (q.type) baseQb.andWhere(`t."type" = :type`, { type: q.type });
    if (q.game) baseQb.andWhere(`g."code" = :game`, { game: q.game });

    applyRange(baseQb, fromDate, toDate);

    const countQb = baseQb.clone().select('COUNT(*)', 'cnt');

    const dataQb = baseQb
      .clone()
      .select([
        `t.id AS "id"`,
        `t.type AS "type"`,
        `t."amountCents" AS "amountCents"`,
        `t."balanceAfterCents" AS "balanceAfterCents"`,
        `to_char((t."createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"`,
        `g.code AS "gameCode"`,
      ])
      .orderBy('t."createdAt"', 'DESC')
      .addOrderBy('t."id"', 'DESC')
      .offset(offset)
      .limit(limit);

    const [rows, totalRow] = await Promise.all([
      dataQb.getRawMany<{
        id: string;
        type: 'BET' | 'PAYOUT' | 'DEPOSIT' | 'WITHDRAWAL';
        amountCents: string | null;
        balanceAfterCents: string | null;
        createdAt: string;    
        gameCode: string | null;
      }>(),
      countQb.getRawOne<{ cnt: string }>(),
    ]);

    const total = Number(totalRow?.cnt ?? 0);

    return {
      page,
      limit,
      total,
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        amountCents: String(r.amountCents ?? 0),
        balanceAfterCents: String(r.balanceAfterCents ?? 0),
        game: r.gameCode ?? null,
        createdAt: r.createdAt, 
      })),
    };
  }
}
