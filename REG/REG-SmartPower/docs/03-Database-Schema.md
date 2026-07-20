# REG SmartPower — Database Schema

**Engine:** PostgreSQL 16 (+ TimescaleDB for telemetry) · **Version:** 1.0

Executable scripts: `database/001_schema.sql`, `database/002_seed.sql`.

---

## Entity Relationship Overview

```
users ─┬─< user_devices
       ├─< user_meters >─ meters ─┬─< purchases ─── tokens
       │      (role)              ├─< consumption_daily
       ├─< notifications          ├─< meter_readings (Tier B, hypertable)
       ├─< payment_methods        ├─< predictions
       ├─< support_tickets        └── tariffs (FK)
       ├─< service_requests
       └─< auto_topup_rules
outages (standalone, geo)          admin_users ─< audit_logs
```

## Tables (summary)

### users
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| phone | varchar(15) unique | E.164, primary identifier |
| email | citext unique null | |
| national_id_hash | bytea | Argon2id, lookup |
| national_id_enc | bytea | AES-256-GCM |
| full_name | varchar(120) | |
| pin_hash | bytea | Argon2id |
| language | char(2) default 'en' | en/rw/fr/sw |
| status | enum: active, suspended, deleted | |
| created_at / updated_at | timestamptz | |

### user_devices
id, user_id FK, device_fingerprint, platform (android/ios), push_token, biometric_enabled bool, attested bool, last_seen_at.

### meters
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| meter_number | varchar(20) unique | STS meter serial |
| meter_type | enum: sts_keypad, sts_smart, ami | drives feature tier |
| customer_name | varchar(120) | from REG CIS |
| district / sector / cell | varchar | Rwanda admin divisions |
| installed_at | date | |
| tariff_id | FK tariffs | |
| connection_status | enum: connected, disconnected, pending | |
| qr_payload | text | signed QR content |

### user_meters (membership + family sharing)
user_id FK, meter_id FK, role enum(**owner, admin, purchaser, viewer**), label varchar(40) ("Home", "Rental"), invited_by FK users null, accepted_at, PK(user_id, meter_id).

### tariffs
id, name, rwf_per_kwh numeric(10,2), block_json jsonb (tiered blocks: 0–15 kWh residential lifeline, 15–50, >50), effective_from, effective_to.

### purchases
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| idempotency_key | uuid unique | client-supplied |
| user_id / meter_id | FK | |
| amount_rwf | numeric(12,2) | |
| kwh | numeric(10,3) | computed at tariff |
| method | enum: mtn_momo, airtel_money, visa, mastercard, bank, qr | |
| psp_ref | varchar(64) | provider transaction id |
| status | enum: pending, paid, vending, completed, failed, refunded | |
| receipt_url | text | blob storage |
| created_at / completed_at | timestamptz | |
Partitioned by month on created_at.

### tokens
id, purchase_id FK unique, token_enc bytea (AES-256-GCM, 20-digit STS token), units_kwh, issued_at, delivered_via jsonb (push/sms/app).

### consumption_daily (Tier A estimates + Tier B actuals)
meter_id FK, date, kwh numeric(8,3), source enum(estimated, metered), cost_rwf, PK(meter_id, date). Partitioned by month.

### meter_readings (Tier B only — TimescaleDB hypertable)
meter_id, ts timestamptz, kw, voltage, amps, power_factor, balance_kwh, status enum(online, offline, tamper). Compression after 7 days, retention 24 months.

### predictions
meter_id FK, computed_at, avg_daily_kwh, est_days_remaining numeric(6,2), depletion_date, confidence numeric(3,2), model_version.

### auto_topup_rules
id, user_id, meter_id, threshold_kwh, amount_rwf, monthly_cap_rwf, payment_method_id FK, enabled bool, requires_confirmation bool.

### payment_methods
id, user_id, type enum, masked_detail varchar ("MTN ···7890", "VISA ···4242"), psp_token varchar (tokenized, no PAN), is_default bool.

### notifications
id, user_id, category enum(outage, maintenance, tariff, payment, balance, tip, government), title, body, data jsonb, read_at, sent_at.

### alert_preferences
user_id, meter_id, thresholds_kwh int[] default '{20,10,5,2}', critical_hours int default 6, quiet_start / quiet_end time, categories_muted text[].

### support_tickets
id, user_id, meter_id null, type enum(problem, outage, damaged_meter, callback, complaint), description, photos text[], status enum(open, in_progress, resolved, closed), assigned_admin FK, created_at, resolved_at.

### service_requests
id, user_id, meter_id null, type enum(inspection, replacement, new_connection, disconnection, reconnection), status enum(submitted, in_review, scheduled, in_progress, resolved, rejected), scheduled_at, notes.

### outages
id, type enum(unplanned, maintenance), geo geometry(MultiPolygon, 4326), districts text[], description, starts_at, est_restore_at, restored_at, status enum(active, scheduled, resolved), created_by FK admin_users.

### admin_users / roles
admin_users: id, email, name, role enum(support, analyst, outage_manager, admin, super_admin), sso_subject, mfa_enabled.
audit_logs: id, actor_type enum(user, admin, system), actor_id, action, entity, entity_id, diff jsonb, ip, created_at — append-only (no UPDATE/DELETE grants).

## Indexes (key)
- `purchases(user_id, created_at desc)`, `purchases(meter_id, created_at desc)`, `purchases(idempotency_key)`
- `consumption_daily(meter_id, date desc)`
- `notifications(user_id, sent_at desc) where read_at is null`
- `outages using gist(geo) where status != 'resolved'`
- `user_meters(meter_id)` for member lists

## Data Retention & Privacy
Tokens purge-encrypted after 24 months; OTPs only in Redis (TTL 5 min); deleted users anonymized (Law No. 058/2021 right to erasure) while retaining financial records 10 years per RRA rules.
