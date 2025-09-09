import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PlayerJwtGuard } from '../common/player-jwt.guard';
import { TransactionsService } from './transactions.service';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@UseGuards(PlayerJwtGuard)
@Controller('me/transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'My transactions (filters + pagination)' })
  @ApiOkResponse({
    schema: {
      example: {
        page: 1, limit: 10, total: 5,
        items: [
          {
            id: 'tx-1',
            type: 'BET',
            game: 'slots',
            amountCents: '1000',
            balanceAfterCents: '101000',
            createdAt: '2025-09-04T06:09:12.545Z'
          }
        ]
      }
    }
  })
  async list(@Req() req: any, @Query() query: QueryTransactionsDto) {
    const dto = plainToInstance(QueryTransactionsDto, query);
    await validateOrReject(dto, { whitelist: true, forbidNonWhitelisted: true });
    return this.svc.listForPlayer(req.user.sub, dto);
  }
}
