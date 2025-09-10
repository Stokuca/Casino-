import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlayerLoginDto {
  @ApiProperty({ example: 'john.player@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'player123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
