import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Player } from '../players/player.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Game } from '../games/game.entity';
import { Outcome, TxType } from '../common/enums';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class BetsService {
  constructor(
    private readonly ds: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  async play(playerId: string, gameCode: string, amountStr: string, outcome: Outcome) {
    const betAmount = BigInt(amountStr);
    const winMultiplier = 2n;

    const result = await this.ds.transaction(async (q) => {
      const prepo = q.getRepository(Player);
      const trepo = q.getRepository(Transaction);
      const grepo = q.getRepository(Game);

      const game = await grepo.findOne({ where: { code: gameCode as any } });
      if (!game) throw new BadRequestException('Game not found');

      const p = await prepo.findOneByOrFail({ id: playerId });
      const current = BigInt(p.balanceCents);
      if (current < betAmount) throw new BadRequestException('Insufficient funds');

      const afterBet = current - betAmount;
      await prepo.update(p.id, { balanceCents: afterBet.toString() });
      const betTx = await trepo.save({
        playerId,
        gameId: game.id,
        type: TxType.BET,
        amountCents: betAmount.toString(),
        balanceAfterCents: afterBet.toString(),
        meta: { game: game.code },
      });

      let finalBal = afterBet;
      let payoutTx: Transaction | null = null;

      if (outcome === Outcome.WIN) {
        const payout = betAmount * winMultiplier;
        finalBal = afterBet + payout;

        await prepo.update(p.id, { balanceCents: finalBal.toString() });
        payoutTx = await trepo.save({
          playerId,
          gameId: game.id,
          type: TxType.PAYOUT,
          amountCents: payout.toString(),
          balanceAfterCents: finalBal.toString(),
          meta: { game: game.code, outcome: 'WIN', winMultiplier: winMultiplier.toString() },
        });
      }

      return {
        playerId,
        gameId: game.id,
        balanceCents: finalBal.toString(),
        betTx,
        payoutTx,
      };
    });

    this.realtime.emitPlayerBalance(result.playerId, result.balanceCents);
    this.realtime.emitPlayerTx(result.playerId, {
      id: result.betTx.id,
      type: result.betTx.type,       
      amountCents: result.betTx.amountCents,
      balanceAfterCents: result.betTx.balanceAfterCents,
      gameId: result.betTx.gameId,
      createdAt: result.betTx.createdAt,
    });

    if (result.payoutTx) {
      this.realtime.emitPlayerBalance(result.playerId, result.balanceCents);
      this.realtime.emitPlayerTx(result.playerId, {
        id: result.payoutTx.id,
        type: result.payoutTx.type,       // 'PAYOUT'
        amountCents: result.payoutTx.amountCents,
        balanceAfterCents: result.payoutTx.balanceAfterCents,
        gameId: result.payoutTx.gameId,
        createdAt: result.payoutTx.createdAt,
      });
    }

    // Operator “tick” za GGR (BET - PAYOUT)
    const bet = BigInt(result.betTx.amountCents);
    const payout = BigInt(result.payoutTx?.amountCents ?? '0');
    const ggrDelta = (bet - payout).toString();

    this.realtime.emitRevenueTick(ggrDelta);
    this.realtime.emitMetricsChanged('revenue');
    this.realtime.emitMetricsChanged('game');

    return {
      balanceCents: result.balanceCents,
      balance: Number(result.balanceCents) / 100,
    };
  }
}
