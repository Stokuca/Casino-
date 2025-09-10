import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column({ type: 'citext', unique: true }) email: string; 
  @Column() passwordHash: string;

  @Column({ type: 'bigint', default: 0 }) balanceCents: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
