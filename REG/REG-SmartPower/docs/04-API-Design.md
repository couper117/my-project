# REG SmartPower — REST API Design

**Base URL:** `https://api.smartpower.reg.rw/v1` · **Auth:** OAuth2 Bearer JWT · **Format:** JSON
Full machine-readable spec: `api/openapi.yaml`.

---

## Conventions
- Versioned path (`/v1`). Cursor pagination (`?cursor=&limit=`). Idempotency via `Idempotency-Key` header on POST money operations. Errors: RFC 7807 problem+json. Rate limits per user + device; `429` with `Retry-After`.

## Auth
| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Start registration {identifier(phone/email/nid), full_name} → sends OTP |
| POST | /auth/otp/verify | {identifier, code} → registration_token or login tokens |
| POST | /auth/login | {identifier} → sends OTP (or PIN path) |
| POST | /auth/pin | {registration_token, pin} — set PIN |
| POST | /auth/token/refresh | Rotate refresh token |
| POST | /auth/logout | Revoke session |
| POST | /auth/2fa/step-up | Step-up for sensitive ops → short-lived elevated token |

## Users & Devices
| GET/PATCH | /me | Profile, language, preferences |
| POST | /me/devices | Register device + push token + attestation |
| GET/PUT | /me/alert-preferences | Thresholds, quiet hours |

## Meters
| GET | /meters | My meters (with role, label) |
| POST | /meters | Add by {meter_number} or {qr_payload} → verifies against REG CIS |
| GET | /meters/{id} | Meter info + tariff + connection status |
| GET | /meters/{id}/balance | `{kwh, rwf, days_remaining, source: "estimated"|"metered", as_of}` |
| GET | /meters/{id}/consumption?granularity=hour|day|week|month|year&from=&to= | Series `{ts, kwh, cost_rwf, source}` |
| GET | /meters/{id}/live | Tier B only: `{kw, voltage, amps, power_factor, status, last_sync}` (404 tier_not_supported otherwise) |
| GET | /meters/{id}/prediction | `{avg_daily_kwh, est_days, depletion_date, confidence, trend}` |
| GET | /meters/{id}/appliance-estimate | Estimated breakdown `[{appliance, watts, share}]` |
| DELETE | /meters/{id} | Remove from account |

## Family Sharing
| GET | /meters/{id}/members | List with roles |
| POST | /meters/{id}/members | Invite {phone, role: viewer|purchaser|admin} (step-up required) |
| PATCH | /meters/{id}/members/{userId} | Change role |
| DELETE | /meters/{id}/members/{userId} | Remove |

## Purchases & Payments
| GET | /tariffs/current?meter_id= | Rate blocks; kWh preview for amount |
| POST | /purchases | `{meter_id, amount_rwf | kwh, payment_method_id | method}` + Idempotency-Key → 202 {purchase_id, status: pending, payment_action: {momo_push|checkout_url|qr}} |
| GET | /purchases/{id} | Status machine: pending→paid→vending→completed/failed/refunded; includes token when completed |
| GET | /purchases?meter_id=&cursor= | History |
| GET | /purchases/{id}/receipt | PDF (signed URL) |
| GET/POST/DELETE | /payment-methods | Tokenized methods (PSP SDK handles card capture) |
| GET/PUT | /auto-topup?meter_id= | Rule CRUD (step-up required to enable) |
| POST | /webhooks/psp/{provider} | HMAC-signed PSP callbacks (server-to-server) |

## Simulator & Insights
| POST | /simulator/estimate | `{appliances: [{type, watts, hours_per_day, qty}], tariff_id?}` → daily/monthly kWh + RWF |
| GET | /insights?meter_id= | Energy-saving tips, efficiency score, peak-hour analysis |

## Notifications
| GET | /notifications?cursor= · POST /notifications/{id}/read · POST /notifications/read-all |

## Outages
| GET | /outages?bbox=&district= | Active + scheduled, GeoJSON |
| GET | /outages/{id} | Detail incl. est_restore_at |

## Support & Service Requests
| POST | /tickets | {type, meter_id?, description, photos[]} |
| GET | /tickets, /tickets/{id} | With status timeline |
| POST | /service-requests | {type, meter_id?, notes} |
| GET | /service-requests, /service-requests/{id} | Track status |
| GET | /faqs?lang= · POST /chat/messages (AI assistant) |

## WebSocket
`wss://api.smartpower.reg.rw/v1/ws` (JWT in subprotocol). Server events: `balance.updated`, `purchase.status`, `outage.alert`, `meter.status` (Tier B), `notification.new`.

## Admin API (separate audience `admin.smartpower.reg.rw`)
Customers CRUD/search, meters live view, revenue analytics, notification campaigns (topic/geo), tariff management (maker-checker approval), ticket queue ops, outage CRUD, admin user management, audit log query. All actions audit-logged.

## Error Codes (RFC 7807 `type` suffixes)
`otp_invalid`, `otp_expired`, `meter_not_found`, `meter_already_linked`, `tier_not_supported`, `payment_declined`, `vending_unavailable`, `idempotency_conflict`, `insufficient_role`, `step_up_required`, `rate_limited`.
