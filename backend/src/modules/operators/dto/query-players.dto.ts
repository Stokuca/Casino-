import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min, IsISO8601, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const toUndef = (v: any) =>
  v === undefined || v === null || v === '' || v === 'undefined' ? undefined : v;

export class QueryPlayersDto {
  @ApiPropertyOptional({ example: 'john@demo.com', description: 'Filter: email contains' })
  @IsOptional()
  @Transform(({ value }) => toUndef(value))
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '2025-09-03T00:00:00.000Z',
    description: 'Filter: from (ISO 8601). Ako nije prosleđeno, koristi se (to - 30d).',
  })
  @IsOptional()
  @Transform(({ value }) => {
    const v = toUndef(value);
    return typeof v === 'string' ? v : undefined;
  })
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: '2025-09-09T23:59:59.999Z',
    description: 'Filter: to (ISO 8601). Ako nije prosleđeno, koristi se now().',
  })
  @IsOptional()
  @Transform(({ value }) => {
    const v = toUndef(value);
    return typeof v === 'string' ? v : undefined;
  })
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ enum: ['revenue', 'bets', 'lastactive'], example: 'revenue' })
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['revenue', 'bets', 'lastactive'])
  sort: 'revenue' | 'bets' | 'lastactive' = 'revenue';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
