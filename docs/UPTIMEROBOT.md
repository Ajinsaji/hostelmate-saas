# HostelMate Production Uptime Monitoring Guide (UptimeRobot)

This document details the production configuration for monitoring the **HostelMate** application using **UptimeRobot** (or any RFC-compliant HTTP uptime monitoring service such as BetterStack, Cronitor, or Pingdom).

---

## 1. Monitoring Architecture

HostelMate decouples **Liveness** (Node.js runtime availability) from **Readiness** (MongoDB Atlas database connectivity), enabling precise incident triage when service disruptions occur.

Uptime monitoring does **not** require any npm packages or SDKs within the application codebase. UptimeRobot operates entirely out-of-band via secure HTTPS probes against HostelMate's unauthenticated, production-hardened health endpoints.

```
                    ┌────────────────────────┐
                    │      UptimeRobot       │
                    │   (External Monitor)   │
                    └───────────┬────────────┘
                                │
                 HTTPS Probes (Every 5 Minutes)
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│ Monitor 1: Backend Liveness   │               │ Monitor 2: Backend Readiness  │
│ GET /api/health/live          │               │ GET /api/health/ready         │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     Node.js Express Process   │               │   Mongoose Connection State   │
│   (Event loop responsive)     │               │     (readyState === 1)        │
└───────────────────────────────┘               └───────────────┬───────────────┘
                                                                │
                                                                ▼
                                                ┌───────────────────────────────┐
                                                │      MongoDB Atlas Cluster    │
                                                └───────────────────────────────┘

┌───────────────────────────────┐
│ Monitor 3: Frontend (Optional)│
│ GET /                         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│    Vercel Edge CDN Network    │
└───────────────────────────────┘
```

---

## 2. Health Endpoints Reference

HostelMate exposes dedicated endpoints for container orchestrators and uptime monitoring services in `Backend/controllers/healthController.js`:

| Endpoint | HTTP Method | Intended Monitor | Expected HTTP Code | Failure HTTP Code | Purpose |
|---|---|---|---|---|---|
| `/api/health/live` | `GET` / `HEAD` | **Monitor 1 (Liveness)** | `200 OK` | `5xx` / Timeout | Verifies Node.js process is alive and event loop is responsive. Zero database queries. |
| `/api/health/ready` | `GET` / `HEAD` | **Monitor 2 (Readiness)** | `200 OK` | `503 Service Unavailable` | Verifies MongoDB Atlas connectivity. Returns `503` if disconnected. |
| `/api/health` | `GET` | **Internal Telemetry** | `200 OK` | `5xx` / Timeout | Reports system memory, CPU count, and database state string. Used by internal frontend diagnostics. |

---

## 3. UptimeRobot Monitor Setup Instructions

Follow these exact steps in the [UptimeRobot Dashboard](https://uptimerobot.com/):

### Monitor 1: Backend Process Liveness (Keep-Alive & Runtime Check)
* **Monitor Type**: `HTTP(s)`
* **Friendly Name**: `HostelMate Backend - Liveness`
* **URL (or IP)**: `https://<YOUR-RENDER-BACKEND-DOMAIN>/api/health/live`
  *(e.g., `https://hostelmate-api.onrender.com/api/health/live`)*
* **Monitoring Interval**: `5 minutes` (or `1 minute` for PRO accounts)
* **Monitor Timeout**: `30 seconds` (to accommodate cold-start latency if instance is sleeping)
* **HTTP Method**: `GET` or `HEAD`
* **Expected HTTP Status**: `200`
* **Purpose**:
  - Detects if the Node.js application process has crashed or hung.
  - Sends regular traffic to wake or keep awake the Render service (subject to Render plan terms).

### Monitor 2: Backend & Database Readiness (Dependency Health)
* **Monitor Type**: `HTTP(s)`
* **Friendly Name**: `HostelMate Backend - Database Readiness`
* **URL (or IP)**: `https://<YOUR-RENDER-BACKEND-DOMAIN>/api/health/ready`
  *(e.g., `https://hostelmate-api.onrender.com/api/health/ready`)*
* **Monitoring Interval**: `5 minutes`
* **Monitor Timeout**: `30 seconds`
* **HTTP Method**: `GET`
* **Expected HTTP Status**: `200`
* **Alert Trigger**: Any status other than `200` (specifically `503 Service Unavailable`).
* **Purpose**:
  - Detects database disconnections (e.g., MongoDB Atlas IP whitelist lockouts, Atlas cluster maintenance, connection pool exhaustion, or credential rotation failures).

### Monitor 3: Frontend Web Application (Optional CDN/Vercel Check)
* **Monitor Type**: `HTTP(s)`
* **Friendly Name**: `HostelMate Frontend - Web App`
* **URL (or IP)**: `https://hostelmate.app/` *(or `https://hostelmate-saas.vercel.app/`)*
* **Monitoring Interval**: `5 minutes`
* **Expected HTTP Status**: `200`
* **Purpose**:
  - Verifies that Vercel Edge Network is serving the Single-Page Application (SPA) shell and SSL certificate is valid.

---

## 4. Alert & Notification Recommendations

Configure alert contacts in UptimeRobot under **My Settings $\rightarrow$ Alert Contacts**:

1. **Notification Channels**:
   - **Primary**: Email to `YOUR_ALERT_EMAIL`
   - **Secondary / Team**: Webhook to `YOUR_SLACK_WEBHOOK` or `YOUR_TELEGRAM_WEBHOOK`
2. **Consecutive Failure Threshold**:
   - Set **"Alert when down for"** to `1 cycle` (or after `2 consecutive failures` to avoid false alarms during transient network hiccups).
3. **Recovery Notifications**:
   - Enable **"Notify when up"** to automatically receive resolution notices when the service returns to `200 OK`.

---

## 5. Render Hosting & Cold-Start Considerations

When deploying on **Render**:

1. **No Application Package Required**:
   UptimeRobot probes public HTTP endpoints over standard HTTPS. No npm package (such as `uptimerobot` or `express-healthcheck`) is required or installed in HostelMate.

2. **Uptime Monitoring vs. Keep-Alive vs. Health Probes**:
   - **Uptime Monitoring**: External service that checks availability 24/7 and pages engineers when down.
   - **Keep-Alive**: Periodic requests that prevent an idle service from spinning down. On Render Free web services, sending an HTTP request every 5 minutes helps keep the instance warm, but Render policies may still restart or throttle instances based on usage quotas. Upgrading to Render Starter/Standard provides persistent instances without sleep behavior.
   - **Health Probes**: Internal endpoints (`/api/health/live` and `/api/health/ready`) that accurately reflect whether the process and its database are operational.

---

## 6. Incident Triage & Failure Scenarios

| Scenario | Symptom in UptimeRobot | Root Cause | Remediation Action |
|---|---|---|---|
| **Scenario A: Normal Operation** | Monitor 1: `UP (200)`<br>Monitor 2: `UP (200)`<br>Monitor 3: `UP (200)` | All systems operational. | None required. |
| **Scenario B: Database Outage** | Monitor 1: `UP (200)`<br>Monitor 2: **`DOWN (503)`**<br>Monitor 3: `UP (200)` | Node.js process is healthy, but MongoDB connection was lost (`readyState !== 1`). | 1. Check MongoDB Atlas status page.<br>2. Check Atlas IP Access List (0.0.0.0/0 or Render egress IPs).<br>3. Check Mongo connection string in Render environment variables. |
| **Scenario C: Backend Process Crash** | Monitor 1: **`DOWN (Timeout/502/Connection Refused)`**<br>Monitor 2: **`DOWN (Timeout/502/Connection Refused)`**<br>Monitor 3: `UP (200)` | Node process terminated, unhandled exception, OOM kill, or Render instance down. | 1. Inspect Render deployment logs.<br>2. Check memory usage metrics.<br>3. Trigger manual redeploy in Render console if crashed. |
| **Scenario D: Frontend CDN Outage** | Monitor 1: `UP (200)`<br>Monitor 2: `UP (200)`<br>Monitor 3: **`DOWN (5xx/DNS/SSL)`** | Vercel platform issue, domain DNS misconfiguration, or SSL certificate renewal failure. | 1. Check Vercel status page.<br>2. Verify domain DNS records for `hostelmate.app`. |

---

## 7. Security Audit & Zero-Secret Guarantee

The health endpoints (`/api/health/live`, `/api/health/ready`, `/api/health`) strictly observe the following security controls:
- **Zero Authentication Required**: Open to public monitoring probes without exposing authenticated headers.
- **Zero Secrets / Credentials Leaked**:
  - `MONGO_URI` connection strings and credentials are never serialized in responses.
  - `JWT_SECRET`, `CLOUDINARY_API_SECRET`, and `WHATSAPP_TOKEN` are not accessible via health handlers.
  - Error responses emit only generic status tokens (`{"status":"unhealthy","database":"disconnected"}`) rather than raw database stack traces.
- **Rate-Limiter Compatibility**: Render reverse-proxy headers (`trust proxy`) are configured in `Backend/server.js`, allowing UptimeRobot probe IPs to pass without triggering global rate limits.
- **CORS Exemption**: Server-to-server monitoring probes (which do not supply browser `Origin` headers) are explicitly permitted by the backend CORS policy.
