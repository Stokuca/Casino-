import { IsEnum, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GameCode, Outcome } from '../../common/enums';

const centsRegex = /^[1-9]\d*$/;

export class PlayDto {
  @ApiProperty({ enum: Object.values(GameCode), example: 'slots' })
  @IsEnum(GameCode)
  gameCode!: GameCode;

  @ApiProperty({ example: '500', description: 'Amount in cents as string (positive integer)' })
  @IsString()
  @Matches(centsRegex)
  amountCents!: string;

  @ApiProperty({ enum: Object.values(Outcome), example: 'WIN' })
  @IsEnum(Outcome)
  outcome!: Outcome;
}
