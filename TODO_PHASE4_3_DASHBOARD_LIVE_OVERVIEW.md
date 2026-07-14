# TODO_PHASE4_3_DASHBOARD_LIVE_OVERVIEW

## Step 1 — Backend aggregation services (MongoDB pipelines only)
- Create modular analytics service structure under `Backend/services/dashboard/`:
  - analyticsService.js (orchestrator)
  - occupancyService.js (occupiedRooms, totalRooms, occupancyRate)
  - revenueService.js (monthlyRevenue)
  - residentService.js (totalResidents)
  - roomService.js (totalRooms)
  - ownerService.js (totalOwners)
  - subscriptionService.js (expiredSubscriptions, trialHostels, paidHostels, totalHostels by subscriptionStatus)
  - hostelService.js (totalHostels, activeHostels)
- Each sub-service must use MongoDB aggregation pipelines (no JS loops for metrics).
- Use `$facet` where practical to minimize collection scans.

## Step 2 — `/api/admin/dashboard/overview` response exact shape
- Update existing `Backend/services/dashboard/overviewService.js` to delegate to `analyticsService`.
- Ensure the endpoint returns EXACTLY the required keys:
  - totalHostels, activeHostels, trialHostels, paidHostels, totalOwners, totalResidents, totalRooms, occupiedRooms, occupancyRate, monthlyRevenue, pendingPayments, expiredSubscriptions, newSignupsThisMonth
- Keep backward compatibility by also returning legacy keys only if needed by existing UI.

## Step 3 — Thin controller wiring
- Update `Backend/controllers/adminController.js` handler for `getDashboardOverview` to call the service.

## Step 4 — Frontend hook updates only
- Update `Frontend/src/superadmin/hooks/useDashboardStats.js` to:
  - handle loading/error/empty
  - support refetch
  - map backend response into the structure expected by `DashboardOverview.jsx` cards (without changing UI files).

## Step 5 — Recommended indexes (if required)
- Identify required indexes based on aggregation `$match` fields:
  - Subscription: subscriptionStatus, subscriptionEndDate, subscriptionStartDate
  - Payment: status, createdAt
  - Room: hostelId (if matching), occupiedBeds/totalBeds if used
  - Resident: status, joinDate
  - Hostel: subscriptionStatus, pendingActivation / subscriptionStartDate
- Document exact indexes to add (no automatic schema changes unless explicitly needed).

## Step 6 — Verification
- Start backend and manually hit `/api/admin/dashboard/overview`.
- Confirm JSON keys match required response.
- Confirm frontend DashboardOverview renders without crashes for loading/error/empty.

