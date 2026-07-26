# HostelMate Enterprise Rent Collection & Financial Operations Module Documentation

## Overview
The Enterprise Rent Collection & Financial Operations Module manages the complete financial lifecycle of hostel residents: monthly rent billing, advance payments, security deposit tracking, partial payments, discounts, late fees, automated running ledger, PDF receipt generation, and financial analytics.

---

## REST API Specifications

### 1. Rent Plans (`/api/rent-plans`)
- `POST /api/rent-plans`: Create plan (`planName`, `billingCycle`, `amount`, `dueDay`, `lateFeeType`, `lateFeeValue`)
- `GET /api/rent-plans`: Get active rent plans
- `PUT /api/rent-plans/:id`: Update rent plan

### 2. Rent Invoices (`/api/rent-invoices`)
- `POST /api/rent-invoices/batch-generate`: Batch generate monthly invoices for all active residents
- `POST /api/rent-invoices`: Create custom rent invoice
- `GET /api/rent-invoices?residentId=<id>&status=<status>`: List filtered invoices

### 3. Rent Payments (`/api/rent-payments`)
- `POST /api/rent-payments`: Record rent payment (Full, Partial, Advance). *Automatically updates invoice balance, creates LEDGER credit entry, generates PDF receipt, and stops reminders if fully paid!*
- `GET /api/rent-payments`: List payment records
- `GET /api/rent-payments/:id/pdf`: Stream immutable PDF payment receipt

### 4. Resident Financial Ledger (`/api/ledger`)
- `GET /api/ledger/:residentId`: Get complete statement ledger & running balance timeline for a resident (`Rent` debits, `Payment` credits, `Deposit`, `Refund`).

### 5. Security Deposits & Refunds (`/api/deposits`)
- `POST /api/deposits`: Receive security deposit
- `POST /api/deposits/refund`: Process security deposit refund (Supports partial refund & deduction notes)
- `GET /api/deposits`: List security deposits

### 6. Financial Reports & Exports (`/api/rent-reports`)
- `GET /api/rent-reports/dashboard`: Get financial KPI cards (Today's Collection, Monthly Collection, Pending Rent, Overdue, Deposits, Refunds, Collection Rate %)
- `GET /api/rent-reports/export/excel`: Export Excel collection report

---

## Manual Verification Checklist
1. ✅ **Monthly Batch Generation**: Executed batch invoice generator → verified `RINV-YYYYMM-XXXX` created for all active residents.
2. ✅ **Partial Payment & Balance Calculation**: Recorded ₹3,000 payment on ₹8,000 invoice → verified balance updated to ₹5,000 and status changed to `Partially Paid`.
3. ✅ **Running Ledger Automation**: Verified ledger debit entry for invoice and credit entry for payment, computing accurate running balance.
4. ✅ **PDF Receipt Generation**: Downloaded PDF receipt → verified logo, payment details, remaining balance, and QR code verification.
5. ✅ **Security Deposit Refund**: Processed deposit refund → verified active balance reduction and ledger debit entry.
6. ✅ **Excel Export**: Exported collection report buffer.
