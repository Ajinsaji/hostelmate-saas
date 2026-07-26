# HostelMate SaaS Subscription & Billing Module API Documentation

## Overview
HostelMate Subscription & Billing Module manages multi-tenant SaaS subscriptions, dynamic billing based on platform fees + active resident charges, permission-based feature gating, frozen billing snapshots, reminder logs, and grace period lifecycles.

---

## Owner Subscription APIs (`/api/owner/subscription`)

### 1. Get Owner Subscription Dashboard
- **Method**: `GET`
- **Endpoint**: `/api/owner/subscription/dashboard`
- **Headers**: `Authorization: Bearer <JWT>`
- **Response**:
```json
{
  "success": true,
  "subscriptionId": "66a3d1...",
  "currentPlan": {
    "_id": "66a3d0...",
    "name": "Trial",
    "description": "30 days full feature trial",
    "monthlyPrice": 0,
    "trialPrice": 500,
    "residentChargePerResident": 10,
    "features": [ ... ],
    "addons": ["whatsapp_premium", "ai_module"]
  },
  "status": "Trial",
  "daysRemaining": 24,
  "inGracePeriod": false,
  "isExpired": false,
  "trialStartDate": "2026-07-25T00:00:00.000Z",
  "trialEndDate": "2026-08-24T00:00:00.000Z",
  "activeResidents": 125,
  "platformFee": 0,
  "residentChargeRate": 10,
  "residentCharge": 1250,
  "totalAmount": 1250,
  "renewalCount": 0,
  "permissions": ["canUseStaff", "canUseFood", "canUseExpenses", "canSendWhatsApp", "canUseAI"],
  "invoices": [ ... ]
}
```

### 2. Get Available Subscription Plans
- **Method**: `GET`
- **Endpoint**: `/api/owner/subscription/plans`
- **Headers**: `Authorization: Bearer <JWT>`
- **Response**: Returns array of all active `SubscriptionPlan` objects with feature populations.

### 3. Calculate Upgrade Balance
- **Method**: `POST`
- **Endpoint**: `/api/owner/subscription/calculate-upgrade`
- **Headers**: `Authorization: Bearer <JWT>`
- **Body**:
```json
{
  "planId": "66a3d0..."
}
```
- **Response**:
```json
{
  "success": true,
  "calculation": {
    "currentPlanName": "Trial",
    "paidAmount": 500,
    "newPlatformAmount": 2000,
    "priceDifference": 1500,
    "residentChargeRate": 10,
    "activeResidents": 125,
    "residentCharge": 1250,
    "totalDue": 2750
  }
}
```

### 4. Process Subscription Payment / Renewal
- **Method**: `POST`
- **Endpoint**: `/api/owner/subscription/pay`
- **Headers**: `Authorization: Bearer <JWT>`
- **Body**:
```json
{
  "planId": "66a3d0...",
  "paymentMethod": "Razorpay",
  "transactionId": "pay_O1X991823"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Subscription payment successful!",
  "invoice": {
    "invoiceNumber": "INV-202607-01001",
    "planName": "Pro",
    "planPrice": 1500,
    "residentChargeRate": 10,
    "activeResidents": 125,
    "residentCharge": 1250,
    "totalAmount": 2750,
    "paymentStatus": "Paid"
  },
  "subscription": { ... }
}
```

### 5. Get Owner Invoices & Billing History
- **Method**: `GET`
- **Endpoint**: `/api/owner/subscription/invoices`
- **Headers**: `Authorization: Bearer <JWT>`

---

## Super Admin Subscription APIs (`/api/admin/subscriptions`)

### 1. Super Admin Dashboard & Dynamic Revenue Analytics
- **Method**: `GET`
- **Endpoint**: `/api/admin/subscriptions/dashboard`
- **Headers**: `Authorization: Bearer <JWT>` (Admin role)
- **Response**:
```json
{
  "success": true,
  "analytics": {
    "trialHostels": 12,
    "baseSubscribers": 45,
    "proSubscribers": 88,
    "gracePeriodHostels": 3,
    "expiredHostels": 5,
    "renewalsToday": 4,
    "totalActiveResidents": 4250,
    "monthlyRevenue": 245000,
    "expectedRevenue": 298000,
    "platformRevenue": 180000,
    "residentRevenue": 65000,
    "pendingCollections": 18500
  }
}
```

### 2. Manage Subscription Features
- **Method**: `GET`, `POST`
- **Endpoint**: `/api/admin/subscriptions/features`

### 3. Manage Subscription Plans
- **Method**: `GET`, `POST`, `PUT`
- **Endpoint**: `/api/admin/subscriptions/plans` / `/api/admin/subscriptions/plans/:id`

### 4. Global Billing Settings
- **Method**: `GET`, `PUT`
- **Endpoint**: `/api/admin/subscriptions/settings`
- **Body**:
```json
{
  "trialDays": 30,
  "gracePeriodDays": 3,
  "reminderDays": [7, 2, 1],
  "dueReminderIntervalHours": 5,
  "residentChargeMode": "Per Active Resident"
}
```

### 5. Hostel Subscription Management & Override
- **Method**: `GET` `/api/admin/subscriptions/hostels`
- **Method**: `POST` `/api/admin/subscriptions/override`
- **Body**:
```json
{
  "hostelId": "66a123...",
  "status": "Active",
  "extendDays": 30
}
```

### 6. View Reminder Audit Logs
- **Method**: `GET`
- **Endpoint**: `/api/admin/subscriptions/reminder-logs`
