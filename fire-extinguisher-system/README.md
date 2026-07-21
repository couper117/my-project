# 🔥 TZW LTD — Fire Extinguisher Management System

A full-stack **Microservices-ready** web application for managing, inspecting, and maintaining fire extinguishers across commercial and industrial facilities.

---

## 📁 Project Structure

```
fire-extinguisher-system/
├── backend/         ← Node.js + Express REST API
└── frontend/        ← React + Vite + TailwindCSS UI
```

---

## 🛠️ Tech Stack

| Layer     | Technology                                |
|-----------|-------------------------------------------|
| Backend   | Node.js, Express.js                       |
| Database  | MySQL (via mysql2)                        |
| Auth      | JWT (jsonwebtoken) + bcryptjs             |
| Docs      | Swagger / OpenAPI 3.0                     |
| Frontend  | React 18, React Router v6, Vite           |
| Styling   | Tailwind CSS                              |
| Charts    | Recharts                                  |
| HTTP      | Axios                                     |
| Toasts    | react-hot-toast                           |

---

## 🚀 Backend Setup

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### Steps

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# 3. Create database in MySQL
mysql -u root -p
CREATE DATABASE fire_extinguisher_db;
EXIT;

# 4. Start the server (tables auto-created on first run)
npm run dev        # development (nodemon)
npm start          # production
```

### Server runs at: `http://localhost:5000`
### API Docs (Swagger): `http://localhost:5000/api/docs`

---

## 💻 Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

### Frontend runs at: `http://localhost:3000`

---

## 🔐 Authentication & Roles

| Role       | Permissions                                                     |
|------------|-----------------------------------------------------------------|
| **Admin**  | Full access: CRUD extinguishers, users, all reports, CSV export |
| **Inspector** | Add/edit extinguishers, log inspections & maintenance       |
| **User**   | View extinguishers, schedule inspections, view reports          |

### JWT Flow
1. `POST /api/auth/register` → create account
2. `POST /api/auth/login` → receive JWT token
3. Include token in all requests: `Authorization: Bearer <token>`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| POST   | /api/auth/register        | No   | Register new user        |
| POST   | /api/auth/login           | No   | Login, receive token     |
| GET    | /api/auth/profile         | Yes  | Get own profile          |
| PUT    | /api/auth/profile         | Yes  | Update profile           |
| PUT    | /api/auth/change-password | Yes  | Change password          |
| POST   | /api/auth/forgot-password | No   | Recover password         |

### Extinguishers
| Method | Endpoint                   | Role         | Description              |
|--------|----------------------------|--------------|--------------------------|
| GET    | /api/extinguishers         | All          | List all (paginated)     |
| GET    | /api/extinguishers/:id     | All          | Get by ID                |
| POST   | /api/extinguishers         | Admin/Insp.  | Create new               |
| PUT    | /api/extinguishers/:id     | Admin/Insp.  | Update                   |
| DELETE | /api/extinguishers/:id     | Admin        | Delete                   |

### Inspections
| Method | Endpoint                      | Role         | Description              |
|--------|-------------------------------|--------------|--------------------------|
| GET    | /api/inspections              | All          | List all                 |
| GET    | /api/inspections/:id          | All          | Get by ID                |
| POST   | /api/inspections              | Admin/Insp.  | Log inspection result    |
| POST   | /api/inspections/schedule     | All          | Schedule inspection      |

### Maintenance
| Method | Endpoint              | Role        | Description              |
|--------|-----------------------|-------------|--------------------------|
| GET    | /api/maintenance      | All         | List all                 |
| GET    | /api/maintenance/:id  | All         | Get by ID                |
| POST   | /api/maintenance      | Admin/Insp. | Log maintenance activity |

### Reports
| Method | Endpoint                  | Role  | Description              |
|--------|---------------------------|-------|--------------------------|
| GET    | /api/reports/summary      | All   | Dashboard stats          |
| GET    | /api/reports/stock        | All   | Stock by type/status     |
| GET    | /api/reports/daily        | All   | Daily report             |
| GET    | /api/reports/monthly      | All   | Monthly report           |
| GET    | /api/reports/yearly       | All   | Yearly report + chart    |
| GET    | /api/reports/export       | Admin | Download CSV             |
| GET    | /api/reports/export/pdf   | Admin | PDF-ready JSON           |

### Users (Admin)
| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| GET    | /api/users          | List all users     |
| GET    | /api/users/:id      | Get user           |
| PUT    | /api/users/:id/role | Update role        |
| DELETE | /api/users/:id      | Delete user        |

---

## 🗄️ Database Schema

```sql
-- Users
users (id, first_name, last_name, email, password, role, created_at, updated_at)

-- Extinguishers
extinguishers (id, serial_number, type, size, location, installation_date, expiry_date, status, created_at, updated_at)

-- Inspections
inspections (id, extinguisher_id, inspector_id, inspection_date, status, notes, created_at)

-- Maintenance
maintenance (id, extinguisher_id, inspector_id, maintenance_date, action_taken, notes, next_maintenance_date, created_at)
```

### Extinguisher Types: `Water | CO2 | Foam | Dry Chemical`
### Extinguisher Sizes: `2.5 lbs | 5 lbs | 9 lbs | 12 lbs`
### Statuses: `Active | Expired | Under Maintenance | Decommissioned`

---

## 🎨 Frontend Pages

| Route            | Description                              |
|------------------|------------------------------------------|
| `/login`         | Login form                               |
| `/register`      | Registration form                        |
| `/dashboard`     | Stats overview + pie/bar charts          |
| `/extinguishers` | Full CRUD table with filters             |
| `/inspections`   | Log results & schedule inspections       |
| `/maintenance`   | Log maintenance activities               |
| `/reports`       | Daily / Monthly / Yearly reports + CSV   |
| `/profile`       | Edit profile + change password           |
| `/users`         | Admin: manage users and roles            |

---

## 🔒 Security Features

- JWT authentication on all protected endpoints
- Password hashing with bcryptjs (12 salt rounds)
- Role-based access control (RBAC)
- Input validation with express-validator
- CORS configured for allowed origins
- Centralized error handling
- Request logging middleware

---

## 📦 Running Both Together

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit `http://localhost:3000` to use the app.
