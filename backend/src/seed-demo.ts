import 'reflect-metadata';
import ds from './data-source';
import * as bcrypt from 'bcrypt';

import { Player } from './modules/players/player.entity';
import { Transaction } from './modules/transactions/transaction.entity';
import { Game } from './modules/games/game.entity';
import { TxType } from './modules/common/enums';
const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  await ds.initialize();

  const playerRepo = ds.getRepository(Player);
  const txRepo = ds.getRepository(Transaction);
  const gameRepo = ds.getRepository(Game);

  const games = await gameRepo.find();
  if (games.length === 0) throw new Error('Games must be seeded first (run npm run seed)');

  const players: Player[] = [];
  for (let i = 1; i <= 8; i++) {
    const email = `demo${i}@test.com`;
    let p = await playerRepo.findOne({ where: { email } });
    if (!p) {
      const hash = await bcrypt.hash('demo123', 10);
      p = playerRepo.create({
        email,
        passwordHash: hash,
        balanceCents: '100000',
      } as Partial<Player>);
      p = await playerRepo.save(p);
      console.log(`Seed: player ${email} created`);
    }
    players.push(p);
  }

  for (const player of players) {
    let current = BigInt(player.balanceCents ?? '0');

    for (let j = 0; j < 10; j++) {
      const game = games[rnd(0, games.length - 1)];
      const amount = BigInt(rnd(1, 10) * 100);     

      current -= amount;
      const bet = txRepo.create({
        type: TxType.BET,                
        amountCents: amount.toString(),
        balanceAfterCents: current.toString(),
        game,                                
        playerId: player.id,
      } as unknown as Partial<Transaction>);
      await txRepo.save(bet);

      if (Math.random() > 0.5) {
        const multiplier = Math.random() > 0.7 ? 2n : 1n;
        const payoutAmount = amount * multiplier;

        current += payoutAmount;
        const payout = txRepo.create({
          type: TxType.PAYOUT,           
          amountCents: payoutAmount.toString(),
          balanceAfterCents: current.toString(),
          game,                         
          playerId: player.id,
        } as unknown as Partial<Transaction>);
        await txRepo.save(payout);
      }
    }

    player.balanceCents = current.toString();
    await playerRepo.save(player);
  }

  await ds.destroy();
  console.log('Demo seed done ✅');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
