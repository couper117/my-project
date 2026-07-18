# Personal Expense Tracker API

A RESTful API built with **Express**, **MongoDB (Mongoose)**, **JWT authentication**, and **Joi validation**.

---

## Tech Stack

| Layer | Library |
|---|---|
| Web framework | Express 4 |
| Database ODM | Mongoose 8 |
| Authentication | jsonwebtoken + bcrypt (10 rounds) |
| Validation | Joi 17 |
| Environment | dotenv |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A running MongoDB instance (local or Atlas)

### Installation

```bash
git clone <repo-url>
cd expense-tracker-api

npm install

# Create your .env from the template
cp .env.example .env
# Then edit .env — set MONGO_URI and JWT_SECRET at minimum
```

### Environment Variables (`.env`)

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

### Run

```bash
npm start          # production
npm run dev        # nodemon (watch mode)
```

The server starts on `http://localhost:5000` by default.

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

All authenticated routes require the header:

```
Authorization: Bearer <token>
```

---

### Auth

#### `POST /api/auth/register`

| Field | Type | Rules |
|---|---|---|
| name | string | required, max 100 |
| email | string | required, valid email |
| password | string | required, min 6 chars |

#### `POST /api/auth/login`

| Field | Type | Rules |
|---|---|---|
| email | string | required |
| password | string | required |

---

### Expenses (all require Bearer token)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/expenses` | List own expenses (optional filters) |
| `POST` | `/api/expenses` | Create an expense |
| `GET` | `/api/expenses/:id` | Get single expense |
| `PUT` | `/api/expenses/:id` | Update an expense |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `GET` | `/api/expenses/summary` | Aggregated total + breakdown by category |

**Expense body fields:**

| Field | Type | Rules |
|---|---|---|
| amount | number | required, positive |
| category | string | required, one of: `food` `transport` `utilities` `other` |
| note | string | optional, max 200 chars |
| date | ISO date | optional, defaults to now |

**Optional query params for `GET /api/expenses`:**

```
?category=food
?startDate=2024-01-01&endDate=2024-12-31
```

---

## Sample curl Commands

> Replace `TOKEN` with the JWT returned by login/register.

### 1 — Register a new user

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "secret123"
  }' | jq .
```

Expected response (`201 Created`):

```json
{
  "success": true,
  "message": "Registration successful.",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Alice Smith", "email": "alice@example.com" }
}
```

---

### 2 — Login

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "secret123"
  }' | jq .
```

Save the token:

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}' \
  | jq -r '.token')
```

---

### 3 — Create an expense

```bash
curl -s -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 12.50,
    "category": "food",
    "note": "Lunch at the café",
    "date": "2024-06-01"
  }' | jq .
```

Expected response (`201 Created`):

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "amount": 12.5,
    "category": "food",
    "note": "Lunch at the café",
    "date": "2024-06-01T00:00:00.000Z"
  }
}
```

---

### 4 — Get summary (aggregation)

```bash
curl -s http://localhost:5000/api/expenses/summary \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected response (`200 OK`):

```json
{
  "success": true,
  "data": {
    "total": 87.30,
    "byCategory": [
      { "category": "food",      "total": 45.00 },
      { "category": "transport", "total": 32.80 },
      { "category": "utilities", "total": 9.50 }
    ]
  }
}
```

---

### 5 — List all expenses

```bash
curl -s http://localhost:5000/api/expenses \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### 6 — Update an expense

```bash
curl -s -X PUT http://localhost:5000/api/expenses/<EXPENSE_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "amount": 15.00, "note": "Updated note" }' | jq .
```

---

### 7 — Delete an expense

```bash
curl -s -X DELETE http://localhost:5000/api/expenses/<EXPENSE_ID> \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

### 8 — Validation error example

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email": "not-an-email", "password": "123" }' | jq .
```

Expected (`400 Bad Request`):

```json
{
  "success": false,
  "message": "name is required; email must be a valid email address; password must be at least 6 characters"
}
```

---

## Project Structure

```
expense-tracker-api/
├── src/
│   ├── server.js               # Entry point — Express app + DB connection
│   ├── models/
│   │   ├── User.js             # User schema (bcrypt pre-save hook)
│   │   └── Expense.js          # Expense schema (enum, positive validator)
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/register|login
│   │   └── expenses.js         # CRUD + /summary aggregation
│   ├── middleware/
│   │   ├── auth.js             # JWT protect middleware
│   │   └── errorHandler.js     # Global error handler
│   └── validators/
│       └── index.js            # Joi schemas + validate() factory
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Security Notes

- Passwords are hashed with **bcrypt** at 10 rounds — plaintext is never stored.
- `password` field uses `select: false` — it is never returned in queries by default.
- Every expense query is scoped to `req.user._id`, preventing cross-user data access.
- JWT secret is read from `process.env.JWT_SECRET` — the server exits immediately if it is missing.
