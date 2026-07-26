# Testing Guide

## Prerequisites

1. Install MongoDB and ensure it's running:
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

2. Install dependencies:
```bash
# Backend
npm install

# Frontend
cd client && npm install
```

## Configuration

1. Create `.env` file in root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/investment-platform
JWT_SECRET=your_super_secret_key_change_this_in_production_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

2. Create `client/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

### Option 1: Run Backend & Frontend Separately

Terminal 1 (Backend):
```bash
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

### Option 2: Test Backend Only

```bash
npm run dev
```

Access API at: `http://localhost:5000/api`

## Test Flow

### 1. Register Users

**User A (Root):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Root",
    "email": "alice@example.com",
    "mobile": "1111111111",
    "password": "password123"
  }'
```
Response: Save `token` and `referralCode`

**User B (Referred by A):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Bob Level1",
    "email": "bob@example.com",
    "mobile": "2222222222",
    "password": "password123",
    "referredByCode": "ALICE_REFERRAL_CODE_HERE"
  }'
```

**User C (Referred by B):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Charlie Level2",
    "email": "charlie@example.com",
    "mobile": "3333333333",
    "password": "password123",
    "referredByCode": "BOB_REFERRAL_CODE_HERE"
  }'
```

### 2. Create Investment (User C)

```bash
curl -X POST http://localhost:5000/api/investments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CHARLIE_TOKEN_HERE" \
  -d '{
    "amount": 10000,
    "planName": "Gold Plan",
    "durationDays": 30,
    "dailyROIPercentage": 2
  }'
```

**Expected Level Income Distribution:**
- Bob (Level 1): 10000 × 5% = 500
- Alice (Level 2): 10000 × 3% = 300

### 3. Check Dashboard

```bash
curl -X GET http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test ROI Processing

Run manually to test cron job:

```bash
node -e "require('./services/roiService').processDailyROI().then(r => console.log(r))"
```

Expected for Charlie's 10,000 investment at 2%:
- Daily ROI: 200

Run again to test idempotency — should skip duplicate processing.

### 5. Check Referral Tree

```bash
curl -X GET http://localhost:5000/api/referrals/tree \
  -H "Authorization: Bearer ALICE_TOKEN_HERE"
```

## Frontend Testing

1. Open browser: `http://localhost:3000`
2. Register new user
3. Login
4. View dashboard with:
   - Stats cards
   - Investment history
   - ROI history
   - Level income
   - Referral tree

## Verify Idempotency

1. Create investment
2. Run ROI cron manually twice on same day
3. Check user wallet — should only credit once
4. Check ROI history — should have only one record per date

```bash
# Run twice
node -e "require('./services/roiService').processDailyROI().then(r => console.log(r))"
node -e "require('./services/roiService').processDailyROI().then(r => console.log(r))"

# Second run should show: processed: 0, skipped: N
```

## Database Inspection

```bash
mongosh
use investment-platform

# Check users
db.users.find().pretty()

# Check investments
db.investments.find().pretty()

# Check ROI history
db.roihistories.find().pretty()

# Check level income
db.levelincomes.find().pretty()
```

## Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check connection string in `.env`

### CORS Errors
- Backend must be running on port 5000
- Frontend on port 3000
- Both must match `.env` configurations

### JWT Token Issues
- Token expires after 7 days (configurable)
- Include `Authorization: Bearer <token>` header

## Success Criteria

✅ Users can register with referral code
✅ Referral tree builds correctly
✅ Investments create successfully
✅ Level income distributes to upline (5 levels)
✅ ROI processes daily at midnight
✅ Idempotency prevents duplicate ROI
✅ Dashboard shows all data
✅ Frontend displays charts and tables
