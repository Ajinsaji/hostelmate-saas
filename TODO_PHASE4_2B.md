# TODO_PHASE4_2B (Financials & Subscription Live Migration)

## Backend
- [ ] Create `Backend/services/hostels/hostelFinancialService.js`
- [ ] Create `Backend/services/hostels/hostelSubscriptionService.js`
- [ ] Update `Backend/controllers/hostelAdminController.js`:
  - [ ] Add `getHostelFinancials()` controller
  - [ ] Add `getHostelSubscription()` controller
  - [ ] Ensure controllers contain only validation + service call + JSON response
- [ ] Update `Backend/routes/adminRoutes.js`:
  - [ ] Add `GET /api/admin/hostels/:id/financials`
  - [ ] Add `GET /api/admin/hostels/:id/subscription`

## Frontend
- [ ] Update `Frontend/src/superadmin/hooks/useFinancials.js` to call existing api (no mock imports, no setTimeout mock)
- [ ] Update `Frontend/src/superadmin/hooks/useSubscription.js` to call existing api (no mock imports, no mock payload)

## Verification
- [ ] Run backend and ensure endpoints return JSON:
  - [ ] `GET /api/admin/hostels/:id/financials`
  - [ ] `GET /api/admin/hostels/:id/subscription`
- [ ] Run frontend build:
  - [ ] `cd Frontend`
  - [ ] `npm run build` (PowerShell-safe command)
- [ ] Fix all compile errors until build passes

