import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';
import { PlayerJwtGuard } from '../common/player-jwt.guard';

@ApiTags('Players')
@ApiBearerAuth('access-token')
@Controller('me')
export class PlayersController {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
  ) {}

  @UseGuards(PlayerJwtGuard)
  @Get('balance')
  @ApiOperation({ summary: 'Get current balance' })
  @ApiOkResponse({
    schema: { example: { balanceCents: '101500', balance: 1015 } },
  })
  async balance(@Req() req: any) {
    const playerId = String(req.user?.sub);
    const player = await this.playersRepo.findOneByOrFail({ id: playerId });

    const cents = BigInt(player.balanceCents); // čuvamo preciznost
    return {
      balanceCents: cents.toString(),
      balance: Number(cents) / 100, // u $ za prikaz
    };
  }
}
