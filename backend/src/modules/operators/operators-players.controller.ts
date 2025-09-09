import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { OperatorJwtGuard } from '../common/operator-jwt.guard';
import { OperatorsPlayersService } from './operators-players.service';

import { QueryPlayersDto } from './dto/query-players.dto';
import { LeaderboardDto } from './dto/leaderboard.dto';

@ApiTags('OperatorPlayers')
@ApiBearerAuth('access-token')
@UseGuards(OperatorJwtGuard)
@Controller('operator')
export class OperatorsPlayersController {
  constructor(private readonly svc: OperatorsPlayersService) {}

  // ---------------- Top players (GGR) ----------------
  @Get('players/leaderboard')
  @ApiOperation({ summary: 'Top players by GGR' })
  @ApiOkResponse({
    schema: {
      example: [
        { playerId: 'uuid-1', email: 'p1@example.com', totalGgrCents: 24500, betsCount: 42 },
        { playerId: 'uuid-2', email: 'p2@example.com', totalGgrCents: 18700, betsCount: 31 },
      ],
    },
  })
  async leaderboard(@Query() q: LeaderboardDto) {
    const dto = plainToInstance(LeaderboardDto, q);
    await validateOrReject(dto);
    // servis sada već vraća tačno ono što front očekuje
    return this.svc.leaderboard(dto);
  }
  
  
  
  

  // ---------------- Players list (sort/page/search/range) ----------------
  @Get('players')
  @ApiOperation({ summary: 'Players table (sort, page, filters)' })
  @ApiOkResponse({
    schema: {
      example: {
        page: 1,
        limit: 10,
        total: 23,
        totalPages: 3,
        hasNext: true,
        items: [
          {
            playerId: 'uuid-player-2',
            email: 'p2@example.com',
            balanceCents: 120450,
            totalGgrCents: 12000,
            betsCount: 34,
            lastActive: '2025-09-04T09:22:00.000Z',
          },
        ],
      },
    },
  })
  async players(@Query() q: QueryPlayersDto) {
    const dto = plainToInstance(QueryPlayersDto, q);
    await validateOrReject(dto);
    // servis već vraća UI-friendly polja i paginaciju
    return this.svc.listPlayers(dto);
  }
}
