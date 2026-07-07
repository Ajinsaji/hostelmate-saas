# HostelMate Super Admin 3.0 – Phase 4.1 Live Executive Dashboard (Core APIs)

## Checklist (no UI changes)

### Backend
- [ ] Create service layer under `Backend/services/dashboard/`
  - [ ] `overviewService.js`
  - [ ] `revenueService.js`
  - [ ] `monitoringService.js`
- [ ] Add controllers (thin) in `Backend/controllers/adminController.js`
  - [ ] `getDashboardOverview`
  - [ ] `getDashboardRevenue`
  - [ ] `getMonitoring`
- [ ] Add authenticated routes in `Backend/routes/adminRoutes.js`
  - [ ] `GET /api/admin/dashboard/overview`
  - [ ] `GET /api/admin/dashboard/revenue`
  - [ ] `GET /api/admin/dashboard/monitoring`
- [ ] Implement MongoDB aggregation pipelines inside services
- [ ] Monitoring service returns `{ simulated: true, ... }` for missing infra metrics

### Frontend
- [ ] Update only these hooks to call APIs (keep interface/return shape)
  - [ ] `useDashboardStats.js`
  - [ ] `useRevenueMetrics.js`
  - [ ] `usePlatformMonitoring.js`
- [ ] Remove mock JSON imports from the migrated hooks

### Validation
- [ ] Run backend endpoint smoke test (node/axios or curl)
- [ ] Run `npm run build` in `hostelmate-saas/Frontend`
- [ ] Verify DashboardOverview.jsx renders with live data (no UI changes)

### Report
- [ ] Generate final audit report listing changed files + endpoints + services + hooks migrated + remaining mock-driven hooks + build result

