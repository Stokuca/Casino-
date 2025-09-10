export type Role = "player" | "operator";

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  role: Role;
  user: User;
}
