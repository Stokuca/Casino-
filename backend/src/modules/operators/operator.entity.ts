import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'citext', unique: true }) email: string;
  @Column() passwordHash: string;
  @Column({ default: 'admin' }) role: string;
  @CreateDateColumn() createdAt: Date;
}
