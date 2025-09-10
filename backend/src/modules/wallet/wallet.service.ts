import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Player } from '../players/player.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TxType } from '../common/enums';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class WalletService {
  constructor(
    private readonly ds: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  async deposit(playerId: string, amountCentsStr: string) {
    const amount = BigInt(amountCentsStr);

    const result = await this.ds.transaction(async (q) => {
      const prepo = q.getRepository(Player);
      const trepo = q.getRepository(Transaction);

      const p = await prepo.findOneByOrFail({ id: playerId });
      const newBal = BigInt(p.balanceCents) + amount;

      await prepo.update(p.id, { balanceCents: newBal.toString() });

      const tx = await trepo.save({
        playerId,
        type: TxType.DEPOSIT,
        amountCents: amount.toString(),
        balanceAfterCents: newBal.toString(),
        meta: { reason: 'manual_deposit' },
      });

      return {
        playerId,
        balanceCents: newBal.toString(),
        tx, 
      };
    });

    this.realtime.emitPlayerBalance(result.playerId, result.balanceCents);
    this.realtime.emitPlayerTx(result.playerId, {
      id: result.tx.id,
      type: result.tx.type,
      amountCents: result.tx.amountCents,
      balanceAfterCents: result.tx.balanceAfterCents,
      gameId: result.tx.gameId ?? null,
      createdAt: result.tx.createdAt,
    });
    this.realtime.emitMetricsChanged('player');

    return {
      balanceCents: result.balanceCents,
      balance: Number(result.balanceCents) / 100,
    };
  }

  async withdraw(playerId: string, amountCentsStr: string) {
    const amount = BigInt(amountCentsStr);

    const result = await this.ds.transaction(async (q) => {
      const prepo = q.getRepository(Player);
      const trepo = q.getRepository(Transaction);

      const p = await prepo.findOneByOrFail({ id: playerId });
      const current = BigInt(p.balanceCents);
      if (current < amount) throw new BadRequestException('Insufficient funds');

      const newBal = current - amount;

      await prepo.update(p.id, { balanceCents: newBal.toString() });

      const tx = await trepo.save({
        playerId,
        type: TxType.WITHDRAWAL,
        amountCents: amount.toString(),
        balanceAfterCents: newBal.toString(),
        meta: { reason: 'manual_withdraw' },
      });

      return {
        playerId,
        balanceCents: newBal.toString(),
        tx,
      };
    });

    this.realtime.emitPlayerBalance(result.playerId, result.balanceCents);
    this.realtime.emitPlayerTx(result.playerId, {
      id: result.tx.id,
      type: result.tx.type,
      amountCents: result.tx.amountCents,
      balanceAfterCents: result.tx.balanceAfterCents,
      gameId: result.tx.gameId ?? null,
      createdAt: result.tx.createdAt,
    });
    this.realtime.emitMetricsChanged('player');

    return {
      balanceCents: result.balanceCents,
      balance: Number(result.balanceCents) / 100,
    };
  }
}
