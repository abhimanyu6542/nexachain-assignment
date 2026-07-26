# Investment & Referral Platform (MERN Stack)

## Setup

1. Install backend dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Install frontend dependencies:
```bash
npm install --prefix client
```

4. Run both (dev mode):
```bash
# Terminal 1 – Backend
npm run dev

# Terminal 2 – Frontend
npm start --prefix client
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiry (default: 7d) |

## Project Structure

```
├── config/          # DB connection
├── controllers/     # Route handlers
├── cron/            # Scheduled jobs
├── middleware/      # JWT auth middleware
├── models/          # Mongoose schemas
├── routes/          # Express routers
├── services/        # Business logic (ROI, Referral)
├── utils/           # Helper functions
├── client/          # React frontend
└── server.js        # Entry point
```

## Key Features

- JWT Authentication
- 5-level referral commission distribution
- Daily ROI via idempotent cron job
- Referral tree traversal
- React dashboard with charts
