# REG SmartPower Backend — NestJS

Modular monolith (microservice-ready). Node 20 + NestJS 10 + TypeORM + PostgreSQL + Redis/BullMQ.

```
backend/
├── src/
│   ├── main.ts                    # bootstrap, helmet, versioning, Swagger
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/                  # OTP, JWT (RS256), refresh rotation, step-up
│   │   ├── users/
│   │   ├── meters/                # meter linking, sharing roles, CIS adapter
│   │   ├── purchases/             # vending state machine (included below)
│   │   ├── payments/              # MoMo/Airtel/card PSP adapters + webhooks
│   │   ├── analytics/             # consumption, predictions
│   │   ├── notifications/         # FCM/APNs + SMS fallback
│   │   ├── outages/               # GeoJSON, admin CRUD
│   │   ├── support/               # tickets, service requests
│   │   └── admin/                 # RBAC-guarded admin API
│   ├── integration/               # anti-corruption adapters to REG systems
│   │   ├── reg-vending.adapter.ts # STS token vending (included below)
│   │   ├── reg-cis.adapter.ts     # customer/meter lookup
│   │   └── reg-mdm.adapter.ts     # AMI telemetry (Tier B)
│   └── common/ (guards, filters, idempotency interceptor, audit)
├── test/
├── deploy/helm/
└── docker-compose.yml
```

Quick start: see `docs/06-Deployment-Release.md` §6.
Sample code: `src/modules/purchases/purchases.service.ts`, `src/integration/reg-vending.adapter.ts`, `src/modules/auth/otp.service.ts`.
