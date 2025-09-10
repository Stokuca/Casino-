import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Player } from '../players/player.entity';
  import { Game } from '../games/game.entity';
  import { TxType } from '../common/enums';
  
  @Entity('transactions')
  export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index()
    @Column()
    playerId: string;
  
    @ManyToOne(() => Player, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'playerId' })
    player: Player;
  
    @Index()
    @Column({ nullable: true })
    gameId?: string | null;
  
    @ManyToOne(() => Game, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'gameId' })
    game?: Game | null;
  
    @Column({ type: 'enum', enum: TxType, enumName: 'tx_type' })
    type: TxType;
  
    @Column({ type: 'bigint' })
    amountCents: string;
  
    @Column({ type: 'bigint' })
    balanceAfterCents: string;
  
    @Column({ type: 'jsonb', nullable: true })
    meta?: Record<string, any> | null;
  
    @Index()
    @CreateDateColumn()
    createdAt: Date;
  }
  