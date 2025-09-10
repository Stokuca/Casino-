import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [ConfigModule], 
  providers: [RealtimeGateway, JwtService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
