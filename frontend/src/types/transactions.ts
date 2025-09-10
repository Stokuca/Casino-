export type TxType = 'BET' | 'PAYOUT' | 'DEPOSIT' | 'WITHDRAWAL';
export type GameCode = 'slots' | 'roulette' | 'blackjack';

export interface Transaction {
  id: string;
  type: TxType;
  amountCents: string;        
  balanceAfterCents: string;  
  game: GameCode | null;      
  createdAt: string;          
}

export interface Paginated<T> {
  page: number;
  limit: number;
  total: number;
  items: T[];
}
