// backend/src/modules/realtime/realtime.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [ConfigModule],        // ⬅️ dodaj
  providers: [RealtimeGateway, JwtService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
