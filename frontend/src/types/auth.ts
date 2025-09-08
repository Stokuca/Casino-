export type Role = "player" | "operator";

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

/** Jedinstveni oblik sesije koji backend vraća */
export interface Session {
  role: Role;
  user: User;
}
