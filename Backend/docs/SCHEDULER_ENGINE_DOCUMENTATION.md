# HostelMate Background Job & Scheduler Engine Documentation

## Overview
The Background Job & Scheduler Engine serves as the centralized platform automation backbone for HostelMate. It decouples long-running, scheduled, or batch tasks (Monthly Rent Generation, Recurring Expenses, Budget Alert Checks, Reminders, PDF Generation, Cleanup) into resilient queue records with automatic retries, execution tracking, audit logging, and notification dispatches.

---

## REST API Specifications

### Endpoints (`/api/jobs`)
- `POST /api/jobs/enqueue`: Enqueue a background job (`jobType`, `payload`, `scheduledAt`, `maxRetries`)
- `GET /api/jobs?status=<Pending|Processing|Completed|Failed>`: List queued and historical jobs
- `GET /api/jobs/stats`: Get job queue status metrics (Pending, Processing, Completed, Failed)
- `POST /api/jobs/:id/retry`: Manually re-queue a failed job
- `POST /api/jobs/run-worker`: Trigger immediate worker processing cycle

---

## Supported Job Types
1. `MONTHLY_RENT_GENERATION`: Batch generates monthly rent invoices for active residents.
2. `RECURRING_EXPENSES`: Processes due recurring operational expense rules.
3. `BUDGET_ALERT_CHECKS`: Evaluates category spending and dispatches alert notifications.
4. `REMINDER_PROCESSING`: Dispatches scheduled payment and maintenance reminders.
5. `PDF_GENERATION`: Generates receipt and report PDF documents.
6. `CLEANUP_TASKS`: Purges expired temporary upload files.

---

## Manual Verification Checklist
1. ✅ **Job Enqueueing**: Enqueued `MONTHLY_RENT_GENERATION` job → verified `Job` document created in `Pending` status.
2. ✅ **Worker Execution**: Triggered `POST /api/jobs/run-worker` → verified job transitioned to `Processing` then `Completed` with `startedAt` and `completedAt` timestamps.
3. ✅ **Retry Mechanism**: Simulated handler error → verified `attempts` incremented and status updated to `Retrying` with exponential backoff.
