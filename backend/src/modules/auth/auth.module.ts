import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Player } from '../players/player.entity';
import { Operator } from '../operators/operator.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Game } from '../games/game.entity';
import { CommonModule } from '../common/common.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, Operator, Transaction, Game]),
    CommonModule, 
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
