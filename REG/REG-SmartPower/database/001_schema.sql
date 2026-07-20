-- =============================================================
-- REG SmartPower — PostgreSQL 16 schema
-- Run order: 001_schema.sql -> 002_seed.sql
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;          -- outage polygons
-- CREATE EXTENSION IF NOT EXISTS timescaledb;   -- enable on Tier B telemetry DB

-- ---------- enums ----------
CREATE TYPE user_status       AS ENUM ('active','suspended','deleted');
CREATE TYPE meter_kind        AS ENUM ('sts_keypad','sts_smart','ami');
CREATE TYPE connection_status AS ENUM ('connected','disconnected','pending');
CREATE TYPE meter_role        AS ENUM ('owner','admin','purchaser','viewer');
CREATE TYPE pay_method        AS ENUM ('mtn_momo','airtel_money','visa','mastercard','bank','qr');
CREATE TYPE purchase_status   AS ENUM ('pending','paid','vending','completed','failed','refunded');
CREATE TYPE consumption_src   AS ENUM ('estimated','metered');
CREATE TYPE notif_category    AS ENUM ('outage','maintenance','tariff','payment','balance','tip','government');
CREATE TYPE ticket_type       AS ENUM ('problem','outage','damaged_meter','callback','complaint');
CREATE TYPE ticket_status     AS ENUM ('open','in_progress','resolved','closed');
CREATE TYPE request_type      AS ENUM ('inspection','replacement','new_connection','disconnection','reconnection');
CREATE TYPE request_status    AS ENUM ('submitted','in_review','scheduled','in_progress','resolved','rejected');
CREATE TYPE outage_type       AS ENUM ('unplanned','maintenance');
CREATE TYPE outage_status     AS ENUM ('active','scheduled','resolved');
CREATE TYPE admin_role        AS ENUM ('support','analyst','outage_manager','admin','super_admin');

-- ---------- core ----------
CREATE TABLE users (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone            varchar(15) UNIQUE NOT NULL,          -- E.164 e.g. +2507...
  email            citext UNIQUE,
  national_id_hash bytea,                                -- Argon2id digest for lookup
  national_id_enc  bytea,                                -- AES-256-GCM (app-layer)
  full_name        varchar(120) NOT NULL,
  pin_hash         bytea NOT NULL,
  language         char(2) NOT NULL DEFAULT 'en' CHECK (language IN ('en','rw','fr','sw')),
  status           user_status NOT NULL DEFAULT 'active',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_devices (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint varchar(128) NOT NULL,
  platform           varchar(10) NOT NULL CHECK (platform IN ('android','ios')),
  push_token         text,
  biometric_enabled  boolean NOT NULL DEFAULT false,
  attested           boolean NOT NULL DEFAULT false,
  last_seen_at       timestamptz,
  UNIQUE (user_id, device_fingerprint)
);

CREATE TABLE tariffs (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           varchar(60) NOT NULL,
  rwf_per_kwh    numeric(10,2) NOT NULL,
  block_json     jsonb,                 -- tiered residential blocks
  effective_from date NOT NULL,
  effective_to   date
);

CREATE TABLE meters (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meter_number      varchar(20) UNIQUE NOT NULL,
  meter_type        meter_kind NOT NULL DEFAULT 'sts_keypad',
  customer_name     varchar(120) NOT NULL,
  district          varchar(40),
  sector            varchar(40),
  cell              varchar(40),
  installed_at      date,
  tariff_id         uuid REFERENCES tariffs(id),
  connection_status connection_status NOT NULL DEFAULT 'connected',
  qr_payload        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_meters (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meter_id    uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  role        meter_role NOT NULL DEFAULT 'owner',
  label       varchar(40) NOT NULL DEFAULT 'Home',
  invited_by  uuid REFERENCES users(id),
  accepted_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, meter_id)
);
CREATE INDEX idx_user_meters_meter ON user_meters(meter_id);

-- ---------- payments & vending ----------
CREATE TABLE payment_methods (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          pay_method NOT NULL,
  masked_detail varchar(40) NOT NULL,     -- "MTN ···7890"
  psp_token     varchar(128),             -- tokenized ref; never store PANs
  is_default    boolean NOT NULL DEFAULT false
);

CREATE TABLE purchases (
  id              uuid NOT NULL DEFAULT uuid_generate_v4(),
  idempotency_key uuid NOT NULL,
  user_id         uuid NOT NULL REFERENCES users(id),
  meter_id        uuid NOT NULL REFERENCES meters(id),
  amount_rwf      numeric(12,2) NOT NULL CHECK (amount_rwf > 0),
  kwh             numeric(10,3),
  method          pay_method NOT NULL,
  psp_ref         varchar(64),
  status          purchase_status NOT NULL DEFAULT 'pending',
  receipt_url     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE TABLE purchases_2026_07 PARTITION OF purchases
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE purchases_2026_08 PARTITION OF purchases
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
-- add monthly partitions via pg_partman in production
CREATE UNIQUE INDEX idx_purchases_idem ON purchases(idempotency_key, created_at);
CREATE INDEX idx_purchases_user  ON purchases(user_id,  created_at DESC);
CREATE INDEX idx_purchases_meter ON purchases(meter_id, created_at DESC);

CREATE TABLE tokens (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id   uuid NOT NULL,             -- logical FK to purchases(id)
  token_enc     bytea NOT NULL,            -- AES-256-GCM 20-digit STS token
  units_kwh     numeric(10,3) NOT NULL,
  issued_at     timestamptz NOT NULL DEFAULT now(),
  delivered_via jsonb NOT NULL DEFAULT '[]'
);
CREATE UNIQUE INDEX idx_tokens_purchase ON tokens(purchase_id);

CREATE TABLE auto_topup_rules (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meter_id              uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  threshold_kwh         numeric(8,2) NOT NULL,
  amount_rwf            numeric(12,2) NOT NULL,
  monthly_cap_rwf       numeric(12,2) NOT NULL DEFAULT 100000,
  payment_method_id     uuid REFERENCES payment_methods(id),
  enabled               boolean NOT NULL DEFAULT false,
  requires_confirmation boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, meter_id)
);

-- ---------- consumption & prediction ----------
CREATE TABLE consumption_daily (
  meter_id uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  date     date NOT NULL,
  kwh      numeric(8,3) NOT NULL,
  cost_rwf numeric(12,2),
  source   consumption_src NOT NULL DEFAULT 'estimated',
  PRIMARY KEY (meter_id, date)
);

-- Tier B (AMI) telemetry — convert to hypertable when timescaledb enabled:
CREATE TABLE meter_readings (
  meter_id     uuid NOT NULL,
  ts           timestamptz NOT NULL,
  kw           numeric(8,3),
  voltage      numeric(6,2),
  amps         numeric(7,3),
  power_factor numeric(4,3),
  balance_kwh  numeric(10,3),
  status       varchar(10) CHECK (status IN ('online','offline','tamper')),
  PRIMARY KEY (meter_id, ts)
);
-- SELECT create_hypertable('meter_readings','ts');

CREATE TABLE predictions (
  meter_id           uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  computed_at        timestamptz NOT NULL DEFAULT now(),
  avg_daily_kwh      numeric(8,3) NOT NULL,
  est_days_remaining numeric(6,2),
  depletion_date     date,
  confidence         numeric(3,2),
  model_version      varchar(20) NOT NULL,
  PRIMARY KEY (meter_id, computed_at)
);

-- ---------- notifications & alerts ----------
CREATE TABLE notifications (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category notif_category NOT NULL,
  title    varchar(140) NOT NULL,
  body     text NOT NULL,
  data     jsonb,
  read_at  timestamptz,
  sent_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_unread ON notifications(user_id, sent_at DESC) WHERE read_at IS NULL;

CREATE TABLE alert_preferences (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meter_id       uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  thresholds_kwh int[] NOT NULL DEFAULT '{20,10,5,2}',
  critical_hours int NOT NULL DEFAULT 6,
  quiet_start    time,
  quiet_end      time,
  categories_muted text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, meter_id)
);

-- ---------- support & service ----------
CREATE TABLE support_tickets (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES users(id),
  meter_id       uuid REFERENCES meters(id),
  type           ticket_type NOT NULL,
  description    text NOT NULL,
  photos         text[] NOT NULL DEFAULT '{}',
  status         ticket_status NOT NULL DEFAULT 'open',
  assigned_admin uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz
);

CREATE TABLE service_requests (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id),
  meter_id     uuid REFERENCES meters(id),
  type         request_type NOT NULL,
  status       request_status NOT NULL DEFAULT 'submitted',
  scheduled_at timestamptz,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- outages ----------
CREATE TABLE outages (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           outage_type NOT NULL,
  geo            geometry(MultiPolygon, 4326),
  districts      text[] NOT NULL DEFAULT '{}',
  description    text,
  starts_at      timestamptz NOT NULL,
  est_restore_at timestamptz,
  restored_at    timestamptz,
  status         outage_status NOT NULL DEFAULT 'active',
  created_by     uuid
);
CREATE INDEX idx_outages_geo ON outages USING gist(geo) WHERE status <> 'resolved';

-- ---------- admin & audit ----------
CREATE TABLE admin_users (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       citext UNIQUE NOT NULL,
  name        varchar(120) NOT NULL,
  role        admin_role NOT NULL DEFAULT 'support',
  sso_subject varchar(128),
  mfa_enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE audit_logs (
  id         bigserial PRIMARY KEY,
  actor_type varchar(10) NOT NULL CHECK (actor_type IN ('user','admin','system')),
  actor_id   uuid,
  action     varchar(80) NOT NULL,
  entity     varchar(60) NOT NULL,
  entity_id  varchar(60),
  diff       jsonb,
  ip         inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- append-only: REVOKE UPDATE, DELETE ON audit_logs FROM app_role;

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
