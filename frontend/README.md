# Casino Platform Frontend 🎰

Frontend application for the **Casino Platform**, built with **React + TypeScript + Vite**.  
It provides both **Player** and **Operator** dashboards with real-time updates over WebSockets.

## Features

### Player
- Register & login
- Wallet management (deposit, withdraw)
- Betting simulator (Slots, Roulette, Blackjack)
- Real-time transaction updates
- Transaction history

### Operator
- Dashboard with GGR, bets count, active players
- Revenue charts (by day, by game)
- Most profitable and most popular games
- Real-time metrics updates

## Tech Stack

- **React 19 + TypeScript**
- **Vite** for fast development
- **Redux Toolkit** for global state
- **Recharts** for charts and visualizations
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Socket.io-client** for real-time updates
- **Day.js** for date utilities
- **Formik + Yup** for form handling and validation

## Development

```bash
# install dependencies
npm install

# start in development mode
npm run dev

# build for production
npm run build

# preview production build
npm run preview

# lint check
npm run lint

# create your .env file by copying the example
cp .env.example .env