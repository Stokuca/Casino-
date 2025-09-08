// src/modules/operators/dto/revenue.dto.ts  (zameni postojeći sadržaj)
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Granularity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

function toStartIso(v?: string): string | undefined {
  if (!v) return undefined;
  // YYYY-MM-DD -> start of day UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`;
  return v; // assume ISO already
}
function toEndIso(v?: string): string | undefined {
  if (!v) return undefined;
  // YYYY-MM-DD -> end of day UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T23:59:59.999Z`;
  return v; // assume ISO already
}

export class RevenueQueryDto {
  /**
   * Granularity; prihvata i sinonime:
   * 'day' | 'daily' | 'date' -> DAILY
   * 'week' | 'weekly'         -> WEEKLY
   * 'month' | 'monthly'       -> MONTHLY
   */
  @ApiPropertyOptional({
    enum: Granularity,
    example: Granularity.DAILY,
    description:
      "Also accepts: 'day'|'date' -> 'daily', 'week' -> 'weekly', 'month' -> 'monthly'.",
  })
  @Transform(({ obj, value }) => {
    const raw = String(value ?? obj?.groupBy ?? obj?.granularity ?? 'daily').toLowerCase();
    if (raw === 'day' || raw === 'date' || raw === 'daily') return Granularity.DAILY;
    if (raw === 'week' || raw === 'weekly') return Granularity.WEEKLY;
    if (raw === 'month' || raw === 'monthly') return Granularity.MONTHLY;
    return Granularity.DAILY;
  })
  @IsEnum(Granularity)
  granularity: Granularity = Granularity.DAILY;

  /** Početak opsega: prihvata 'from' ili 'start', ISO ili YYYY-MM-DD */
  @ApiPropertyOptional({ example: '2025-09-01T00:00:00Z' })
  @IsOptional()
  @Transform(({ obj, value }) => toStartIso(value ?? obj?.start ?? obj?.from))
  @IsISO8601({ strict: false })
  from?: string;

  /** Kraj opsega: prihvata 'to' ili 'end', ISO ili YYYY-MM-DD */
  @ApiPropertyOptional({ example: '2025-09-07T23:59:59.999Z' })
  @IsOptional()
  @Transform(({ obj, value }) => toEndIso(value ?? obj?.end ?? obj?.to))
  @IsISO8601({ strict: false })
  to?: string;
}
