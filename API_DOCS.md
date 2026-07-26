# Investment & Referral Platform API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication APIs

### Register
**POST** `/auth/register`

Request:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "9999999999",
  "password": "pass1234",
  "referredByCode": "ABC12345"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "referralCode": "XYZ98765"
    },
    "token": "eyJhbGciOi..."
  }
}
```

---

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "pass1234"
}
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "fullName": "John Doe", "referralCode": "XYZ98765" },
    "token": "eyJhbGciOi..."
  }
}
```

---

### Get Profile
**GET** `/auth/me` `[Protected]`

---

## Investment APIs

### Create Investment
**POST** `/investments` `[Protected]`

Request:
```json
{
  "amount": 5000,
  "planName": "Gold Plan",
  "durationDays": 30,
  "dailyROIPercentage": 1.5
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Investment created successfully",
  "data": {
    "_id": "...",
    "amount": 5000,
    "plan": { "name": "Gold Plan", "durationDays": 30, "dailyROIPercentage": 1.5 },
    "status": "Active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T00:00:00.000Z"
  }
}
```

### Get My Investments
**GET** `/investments?status=Active&page=1&limit=10` `[Protected]`

---

## Dashboard APIs

### Get Stats
**GET** `/dashboard/stats` `[Protected]`

Response:
```json
{
  "success": true,
  "data": {
    "totalInvestments": 15000,
    "activeInvestments": 2,
    "totalROIEarned": 450.50,
    "totalLevelIncome": 200.00,
    "walletBalance": 650.50
  }
}
```

### ROI History
**GET** `/dashboard/roi-history?page=1&limit=10` `[Protected]`

### Level Income History
**GET** `/dashboard/level-income?page=1&limit=10` `[Protected]`

---

## Referral APIs

### Get Direct Referrals
**GET** `/referrals/direct` `[Protected]`

### Get Referral Tree
**GET** `/referrals/tree` `[Protected]`

Response:
```json
{
  "success": true,
  "data": {
    "user": { "fullName": "John Doe", "referralCode": "XYZ98765" },
    "tree": [
      {
        "fullName": "Alice",
        "email": "alice@example.com",
        "level": 1,
        "children": [
          { "fullName": "Bob", "level": 2, "children": [] }
        ]
      }
    ]
  }
}
```

---

## Level Commission Structure

| Level | Commission |
|-------|-----------|
| 1 (Direct) | 5% |
| 2 | 3% |
| 3 | 2% |
| 4 | 1% |
| 5 | 0.5% |
