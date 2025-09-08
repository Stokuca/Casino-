export type TxType = 'BET' | 'PAYOUT' | 'DEPOSIT' | 'WITHDRAWAL';
export type GameCode = 'slots' | 'roulette' | 'blackjack';

export interface Transaction {
  id: string;
  type: TxType;
  amountCents: string;        // broj u centima iz back-a
  balanceAfterCents: string;  // broj u centima
  game: GameCode | null;      // null za depozit/withdraw
  createdAt: string;          // ISO
}

export interface Paginated<T> {
  page: number;
  limit: number;
  total: number;
  items: T[];
}
