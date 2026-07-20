-- REG SmartPower — development seed data
-- Tariff blocks reflect EWSA/REG residential structure (illustrative — confirm current rates with REG)
INSERT INTO tariffs (id, name, rwf_per_kwh, block_json, effective_from) VALUES
 ('11111111-1111-1111-1111-111111111111','Residential', 249.00,
  '[{"upto_kwh":15,"rwf":89},{"upto_kwh":50,"rwf":310},{"above":50,"rwf":369}]','2025-01-01'),
 ('22222222-2222-2222-2222-222222222222','Non-Residential', 369.00, NULL, '2025-01-01');

INSERT INTO users (id, phone, email, full_name, pin_hash, language) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','+250788123456','kelvin@example.rw','Kelvin N.', '\x00', 'en'),
 ('aaaaaaaa-0000-0000-0000-000000000002','+250722987654', NULL,'Amina U.', '\x00', 'rw');

INSERT INTO meters (id, meter_number, meter_type, customer_name, district, sector, cell, installed_at, tariff_id) VALUES
 ('bbbbbbbb-0000-0000-0000-000000000001','04123456789','sts_keypad','Kelvin N.','Gasabo','Remera','Nyabisindu','2019-03-12','11111111-1111-1111-1111-111111111111'),
 ('bbbbbbbb-0000-0000-0000-000000000002','04987654321','ami','Kelvin N.','Kicukiro','Niboye','Gatare','2024-11-02','11111111-1111-1111-1111-111111111111');

INSERT INTO user_meters (user_id, meter_id, role, label) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001','owner','Home'),
 ('aaaaaaaa-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','owner','Business'),
 ('aaaaaaaa-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000001','viewer','Home');

-- 30 days of estimated consumption for the Home meter (~4.5 kWh/day avg)
INSERT INTO consumption_daily (meter_id, date, kwh, cost_rwf, source)
SELECT 'bbbbbbbb-0000-0000-0000-000000000001',
       d::date,
       round((4.5 + sin(extract(doy from d))*0.8 + random()*0.6)::numeric, 3),
       round(((4.5 + sin(extract(doy from d))*0.8) * 249)::numeric, 2),
       'estimated'
FROM generate_series(now() - interval '30 days', now() - interval '1 day', interval '1 day') d;

INSERT INTO predictions (meter_id, avg_daily_kwh, est_days_remaining, depletion_date, confidence, model_version) VALUES
 ('bbbbbbbb-0000-0000-0000-000000000001', 4.5, 5.3, current_date + 5, 0.82, 'ewma-v1');

INSERT INTO outages (type, districts, description, starts_at, est_restore_at, status, geo) VALUES
 ('maintenance', '{Gasabo}', 'Scheduled substation maintenance — Remera feeder',
  now() + interval '2 days', now() + interval '2 days 6 hours', 'scheduled',
  ST_Multi(ST_GeomFromText('POLYGON((30.09 -1.95,30.13 -1.95,30.13 -1.92,30.09 -1.92,30.09 -1.95))',4326)));

INSERT INTO admin_users (email, name, role) VALUES
 ('support1@reg.rw','Support Agent','support'),
 ('admin@reg.rw','Portal Admin','super_admin');
