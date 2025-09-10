// backend/src/seed.ts
import 'reflect-metadata';
import ds from './data-source';
import * as bcrypt from 'bcrypt';

import { Game } from './modules/games/game.entity';
import { GameCode } from './modules/common/enums';
import { Operator } from './modules/operators/operator.entity';

async function main() {
  await ds.initialize();

  const opRepo = ds.getRepository(Operator);
  const gameRepo = ds.getRepository(Game);

  const adminEmail = 'admin@operator.com';
  const existingOp = await opRepo.findOne({ where: { email: adminEmail } });
  if (!existingOp) {
    const hash = await bcrypt.hash('admin123', 10);
    await opRepo.save(opRepo.create({ email: adminEmail, passwordHash: hash, role: 'admin' }));
    console.log('Seed: operator admin created');
  }

  const defaults: Array<Pick<Game, 'code' | 'name' | 'rtpTheoretical'>> = [
    { code: GameCode.SLOTS,     name: 'Slots',     rtpTheoretical: '96.00' },
    { code: GameCode.ROULETTE,  name: 'Roulette',  rtpTheoretical: '97.30' },
    { code: GameCode.BLACKJACK, name: 'Blackjack', rtpTheoretical: '99.50' },
  ];

  for (const g of defaults) {
    const exists = await gameRepo.findOne({ where: { code: g.code } });
    if (!exists) {
      await gameRepo.save(gameRepo.create(g));
      console.log(`Seed: game ${g.code} created`);
    }
  }

  await ds.destroy();
  console.log('Seed done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
