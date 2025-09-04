import 'reflect-metadata';
import ds from './data-source';
import * as bcrypt from 'bcrypt';

import { Player } from './modules/players/player.entity';
import { Transaction } from './modules/transactions/transaction.entity';
import { Game } from './modules/games/game.entity';
import { TxType } from './modules/common/enums'; // ✅ umesto TransactionType

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  await ds.initialize();

  const playerRepo = ds.getRepository(Player);
  const txRepo = ds.getRepository(Transaction);
  const gameRepo = ds.getRepository(Game);

  const games = await gameRepo.find();
  if (games.length === 0) throw new Error('Games must be seeded first (run npm run seed)');

  // 👤 8 demo igrača
  const players: Player[] = [];
  for (let i = 1; i <= 8; i++) {
    const email = `demo${i}@test.com`;
    let p = await playerRepo.findOne({ where: { email } });
    if (!p) {
      const hash = await bcrypt.hash('demo123', 10);
      p = playerRepo.create({
        email,
        passwordHash: hash,
        balanceCents: '100000', // $1000 (string jer je bigint u PG)
      } as Partial<Player>);
      p = await playerRepo.save(p);
      console.log(`Seed: player ${email} created`);
    }
    players.push(p);
  }

  // 🎲 transakcije po igraču
  for (const player of players) {
    let current = BigInt(player.balanceCents ?? '0');

    for (let j = 0; j < 10; j++) {
      const game = games[rnd(0, games.length - 1)]; // ✅ ceo Game entitet, ne enum
      const amount = BigInt(rnd(1, 10) * 100);     // 1–10$

      // BET
      current -= amount;
      const bet = txRepo.create({
        type: TxType.BET,                    // ✅ enum iz enums.ts
        amountCents: amount.toString(),
        balanceAfterCents: current.toString(),
        game,                                // ✅ relacija (Game entitet), ne game.code
        playerId: player.id,
      } as unknown as Partial<Transaction>);
      await txRepo.save(bet);

      // 50% šansa za payout (30% tih dobitaka x2)
      if (Math.random() > 0.5) {
        const multiplier = Math.random() > 0.7 ? 2n : 1n;
        const payoutAmount = amount * multiplier;

        current += payoutAmount;
        const payout = txRepo.create({
          type: TxType.PAYOUT,               // ✅ enum
          amountCents: payoutAmount.toString(),
          balanceAfterCents: current.toString(),
          game,                              // ✅ relacija (Game)
          playerId: player.id,
        } as unknown as Partial<Transaction>);
        await txRepo.save(payout);
      }
    }

    // upiši finalni balans
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
