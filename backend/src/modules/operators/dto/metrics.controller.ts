// backend/src/modules/operators/dto/metrics.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

// ✅ Swagger
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';

import { OperatorJwtGuard } from '../../common/operator-jwt.guard';
import { MetricsService } from './metrics.service';
import { Granularity, RevenueQueryDto } from './revenue.dto';
import { RangeDto, LimitRangeDto } from './metrics-queries.dto';

function parseDates(from?: string, to?: string) {
  const now = new Date();
  const toDate = to ? new Date(to) : now;
  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - 30 * 24 * 3600 * 1000); // default 30 dana
  return { fromDate, toDate };
}

function ymd(d: Date) {
  // ISO YYYY-MM-DD (bez vremena) da lepše izgleda u grafovima
  return new Date(d).toISOString().slice(0, 10);
}

// ✅ Swagger: tag + named bearer (u main.ts: 'access-token')
@ApiTags('Metrics')
@ApiBearerAuth('access-token')
@UseGuards(OperatorJwtGuard)
@Controller('operator/metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  // ---------------------------------------------------------
  // Revenue (po periodu)
  // ---------------------------------------------------------
  @Get('revenue')
  @ApiOperation({ summary: 'Revenue (GGR) by period' })
  @ApiOkResponse({
    schema: {
      example: {
        totalGgrCents: '123450',
        series: [
          { bucketStart: '2025-09-01', ggrCents: '15000' },
          { bucketStart: '2025-09-02', ggrCents: '22000' },
        ],
      },
    },
  })
  async revenue(@Query() q: RevenueQueryDto) {
    const dto = plainToInstance(RevenueQueryDto, q);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);

    const rows = await this.metrics.revenueByPeriod({
      granularity: dto.granularity ?? Granularity.DAILY,
      from: fromDate,
      to: toDate,
    });

    const series = rows.map((r) => ({
      bucketStart: ymd(r.period),
      ggrCents: String(r.ggrCents ?? 0),
    }));

    const totalGgrCents = String(
      rows.reduce((acc, r) => acc + Number(r.ggrCents ?? 0), 0),
    );

    return { totalGgrCents, series };
  }

  // ---------------------------------------------------------
  // Revenue by game (pie)
  // ---------------------------------------------------------
  @Get('revenue-by-game')
  @ApiOperation({ summary: 'Revenue by game (pie)' })
  @ApiOkResponse({
    schema: {
      example: [
        { gameCode: 'slots', gameName: 'Slots', ggrCents: '65000' },
        { gameCode: 'roulette', gameName: 'Roulette', ggrCents: '42000' },
        { gameCode: 'blackjack', gameName: 'Blackjack', ggrCents: '16450' },
      ],
    },
  })
  async revenueByGame(@Query() q: RangeDto) {
    const dto = plainToInstance(RangeDto, q);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const rows = await this.metrics.revenueByGame({ from: fromDate, to: toDate });

    return rows.map((r) => ({
      gameCode: r.gameCode,
      gameName: r.gameName,
      ggrCents: String(r.ggrCents ?? 0),
      // opcionalno za detaljnije pie tooltipe:
      totalBetCents: String(r.totalBetCents ?? 0),
      totalPayoutCents: String(r.totalPayoutCents ?? 0),
    }));
  }

  // ---------------------------------------------------------
  // Games metrics
  // ---------------------------------------------------------
  @Get('games/top-profitable')
  @ApiOperation({ summary: 'Top profitable games' })
  @ApiOkResponse({
    schema: {
      example: [
        { gameCode: 'slots', gameName: 'Slots', ggrCents: '65000' },
        { gameCode: 'roulette', gameName: 'Roulette', ggrCents: '42000' },
      ],
    },
  })
  async topProfitable(@Query() q: LimitRangeDto) {
    const dto = plainToInstance(LimitRangeDto, q);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const limit = dto.limit ?? 5;

    const rows = await this.metrics.topProfitableGames(limit, fromDate, toDate);
    return rows.map((r) => ({
      gameCode: r.gameCode,
      gameName: r.gameName,
      ggrCents: String(r.ggrCents ?? 0),
      totalBetCents: String(r.totalBetCents ?? 0),
      totalPayoutCents: String(r.totalPayoutCents ?? 0),
    }));
  }

  @Get('games/most-popular')
  @ApiOperation({ summary: 'Most popular games' })
  @ApiOkResponse({
    schema: {
      example: [
        { gameCode: 'slots', gameName: 'Slots', betsCount: 310 },
        { gameCode: 'roulette', gameName: 'Roulette', betsCount: 190 },
      ],
    },
  })
  async mostPopular(@Query() q: LimitRangeDto) {
    const dto = plainToInstance(LimitRangeDto, q);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const limit = dto.limit ?? 5;

    const rows = await this.metrics.mostPopularGames(limit, fromDate, toDate);
    return rows.map((r) => ({
      gameCode: r.gameCode,
      gameName: r.gameName,
      betsCount: Number(r.rounds ?? 0),
    }));
  }

  @Get('games/avg-bet')
  @ApiOperation({ summary: 'Average bet per game' })
  @ApiOkResponse({
    schema: {
      example: [
        { gameCode: 'slots', gameName: 'Slots', avgBetCents: '420' },
        { gameCode: 'roulette', gameName: 'Roulette', avgBetCents: '930' },
      ],
    },
  })
  async avgBet(@Query() q: RangeDto) {
    const dto = plainToInstance(RangeDto, q);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const rows = await this.metrics.avgBetPerGame(fromDate, toDate);

    return rows.map((r) => ({
      gameCode: r.gameCode,
      gameName: r.gameName,
      avgBetCents: String(r.avgBetCents ?? 0),
    }));
  }

    // ---------------------------------------------------------
  // Active players (DISTINCT igrači sa BET u opsegu)
  // ---------------------------------------------------------
  @Get('active-players')
  @ApiOperation({ summary: 'Active players in range (distinct players with BET)' })
  @ApiOkResponse({ schema: { example: { count: 13 } } })
  async activePlayersRange(@Query() q: RangeDto) {
    const dto = plainToInstance(RangeDto, q);
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const { count } = await this.metrics.activePlayers(fromDate, toDate);
    return { count };
  }

  // ---------------------------------------------------------
  // #Bets KPI (broj BET transakcija u opsegu)
  // ---------------------------------------------------------
  @Get('bets-count')
  @ApiOperation({ summary: 'Total BET transactions count in range' })
  @ApiOkResponse({ schema: { example: { bets: 217 } } })
  async betsCount(@Query() q: RangeDto) {
    const dto = plainToInstance(RangeDto, q);
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const { bets } = await this.metrics.betsCount(fromDate, toDate);
    return { bets };
  }

  @Get('games/rtp')
  @ApiOperation({ summary: 'Actual vs theoretical RTP' })
  @ApiOkResponse({
    schema: {
      example: [
        { gameCode: 'slots', gameName: 'Slots', theoreticalRtpPct: 96, actualRtpPct: 94.3 },
        { gameCode: 'roulette', gameName: 'Roulette', theoreticalRtpPct: 97.3, actualRtpPct: 96.2 },
      ],
    },
  })
  async rtp(@Query() q: RangeDto) {
    const dto = plainToInstance(RangeDto, q);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) throw new BadRequestException(errors);

    const { fromDate, toDate } = parseDates(dto.from, dto.to);
    const rows = await this.metrics.rtpPerGame(fromDate, toDate);

    return rows.map((r) => ({
      gameCode: r.gameCode,
      gameName: r.gameName,
      theoreticalRtpPct: Number(r.theoreticalRtpPct ?? 0),
      actualRtpPct: Number(r.actualRtpPct ?? 0),
      // opcionalno za tooltip/QA:
      totalBetCents: String(r.totalBetCents ?? 0),
      totalPayoutCents: String(r.totalPayoutCents ?? 0),
    }));
  }
}
