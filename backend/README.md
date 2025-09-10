# Casino Platform Backend 🎲

NestJS + TypeORM + PostgreSQL backend za **Casino Platform**.  
Obezbeđuje autentikaciju (player & operator), transakcije, metrike i real-time događaje preko WebSocket-a.

---

## Features

- **Auth**
  - Player register/login, Operator login
  - JWT **access** + **refresh** (HTTP-only cookies)
  - `/auth/me`, `/auth/refresh`, `/auth/logout`
- **Wallet / Transactions**
  - Deposit / Withdraw
  - Betting (BET / PAYOUT) sa pravilima po igri
  - Istorija transakcija
- **Operator metrics**
  - GGR (by day/week/month)
  - Revenue by game, most profitable / most popular
  - RTP per game (actual vs theoretical)
- **Realtime**
  - Balance & transaction eventi za igrača
  - Revenue/metrics tick eventi za operatora (Socket.IO)

---

## Requirements

- Node.js 18+  
- PostgreSQL 13+  

---

## Quick start

```bash
# 1) Install
npm install

# 2) Napravi .env iz šablona
cp .env.example .env

# 3) Pokreni migracije (kreira tabele)
npm run m:run

# 4) (Opcionalno) Ubaci demo podatke
npm run seed:demo

# 5) Start (watch mode)
npm run start:dev


# create your .env file by copying the example
cp .env.example .env