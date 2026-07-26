# HostelMate Enterprise Expense Management System Documentation

## Overview
The Enterprise Expense Management System handles every operational expense of a hostel: daily expenses, vendor directory & ledger, category budgets with 80%/90%/100% threshold alerts, multi-state approval workflows, recurring expense automation, Excel exports, and real-time Profit & Loss statement integration.

---

## REST API Specifications

### 1. Expense Categories (`/api/expense-categories`)
- `POST /api/expense-categories`: Create category (`categoryName`, `categoryCode`, `color`, `icon`, `budgetLimit`)
- `GET /api/expense-categories`: Get categories (Auto-seeds 14 default categories: Food, LPG, Electricity, Water, Wi-Fi, Cleaning, Laundry, Repairs, Salary, Assets, Transport, Medical, Taxes, Misc)

### 2. Vendors (`/api/vendors`)
- `POST /api/vendors`: Create vendor (`vendorName`, `vendorCode`, `category`, `phone`, `email`, `gstNumber`)
- `GET /api/vendors`: Get vendors with total spent and pending bills metrics

### 3. Expenses (`/api/expenses`)
- `POST /api/expenses`: Record expense (`title`, `categoryId`, `vendorId`, `amount`, `paymentMethod`, `status`)
- `GET /api/expenses?categoryId=<id>&vendorId=<id>&search=<str>`: Filtered expenses list
- `PATCH /api/expenses/:id/status`: Update approval/payment status (`Pending Approval`, `Approved`, `Paid`, `Cancelled`)
- `DELETE /api/expenses/:id`: Soft delete expense

### 4. Recurring Expenses (`/api/recurring-expenses`)
- `POST /api/recurring-expenses`: Configure recurring rule (`expenseId`, `frequency`, `nextRun`)
- `GET /api/recurring-expenses`: Get active recurring rules

### 5. Category Budgets (`/api/budgets`)
- `POST /api/budgets`: Set category budget (`categoryId`, `month`, `year`, `budgetAmount`)
- `GET /api/budgets?month=<m>&year=<y>`: Get monthly budgets with spent amount, remaining amount, and alert status (`Under Budget`, `80% Alert`, `90% Alert`, `Budget Exceeded`)

### 6. Expense Reports & Profit & Loss (`/api/expense-reports`)
- `GET /api/expense-reports/dashboard`: Get financial KPI cards (Today's Expenses, Monthly Expenses, Rent Collections Income, Net Profit/Loss, Profit Margin %)
- `GET /api/expense-reports/export/excel`: Export Excel operational expenses report

---

## Manual Verification Checklist
1. ✅ **Default Category Seeding**: Verified automatic seeding of 14 default categories (Food, LPG, Electricity, Repairs, Salary, etc.) upon first request.
2. ✅ **Expense Creation & Numbering**: Recorded expense → verified `EXP-YYYYMM-XXXX` auto-numbering and net amount computation.
3. ✅ **Approval Workflow**: Updated status from `Pending Approval` to `Approved` and `Paid`.
4. ✅ **Budget Threshold Calculation**: Tested budget limit → verified `spentAmount` and `status` alerts (80%, 90%, Exceeded).
5. ✅ **Profit & Loss Integration**: Verified P&L report calculates Total Rent Income minus Operational Expenses to yield Net Profit & Margin %.
6. ✅ **Excel Export**: Exported operational expenses report.
