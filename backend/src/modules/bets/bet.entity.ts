import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from '../players/player.entity';
import { Game } from '../games/game.entity';
import { Outcome } from '../common/enums';

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column() playerId: string;
  @ManyToOne(() => Player) @JoinColumn({ name: 'playerId' }) player: Player;

  @Index()
  @Column() gameId: string;
  @ManyToOne(() => Game) @JoinColumn({ name: 'gameId' }) game: Game;

  @Column({ type: 'bigint' }) stakeCents: string;
  @Column({ type: 'varchar' }) outcome: Outcome;
  @Column({ type: 'bigint', default: 0 }) payoutCents: string;

  @Index()
  @CreateDateColumn() createdAt: Date;
}
