# HostelMate Super Admin 3.0 – Phase 3: Hostel CRM & Customer 360

## Checklist (implementation order)

### 1) Mock data + hook API shape
- [x] Ensure mock JSON files exist under `Frontend/src/superadmin/constants/mocks/` for:
  - hostels, hostelDetails, ownerProfile, financials, communications, audit, support, healthScore (and add missing ones)
- [x] Update `useHostels()` under `Frontend/src/superadmin/hooks/` to return consistent API-like shape:
  - `{ success: true, data: ..., pagination: ..., meta: ... }`
- [ ] Ensure `useHostels()` exposes all grid/filter fields (including occupancy/residents/revenue/subscription/health score/last login/created date)
- [ ] Ensure `useHostel(id)` and section hooks expose structured data for each CRM tab


### 2) Enterprise-grade Hostel Directory
- [ ] Upgrade `Frontend/src/superadmin/views/HostelsList.jsx` **incrementally**:
  - Sorting
  - Pagination
  - Global search
  - Advanced filters
  - Saved filters (localStorage)
  - Column visibility
  - Bulk selection + bulk actions drawer
  - CSV/PDF export (mock export)
  - Responsive layout
- [ ] Ensure clicking a hostel routes to `'/admin/hostels/:id/overview'`

### 3) Customer 360 becomes CRM (sidebar + nested routing)
- [ ] Upgrade `Frontend/src/superadmin/views/HostelDetailsLayout.jsx`:
  - Replace horizontal tabs with left sidebar navigation
  - Nested routing for Overview/Owner/Operations/Financials/Subscription/Communication/Support/Documents/Audit/Settings
  - Each section lazy-loaded with `React.lazy` + `Suspense`
- [ ] Ensure layout scalability (data fetching by section, lazy-loading)

### 4) Build CRM sections (read-only enforcement + performance)
- [ ] Overview: full business profile + Health Score + quick actions
- [ ] Owner: profile, documents, emergency contact, devices usage
- [ ] Operations: rooms/beds/vacancy/residents/admissions/staff/checkouts (read-only)
- [ ] Financials: collections/expenses/profit/payment history/trends
- [ ] Subscription: plan details, history, upgrade/downgrade/renew/extend/pause/expire actions
- [ ] Communication: timeline + delivery/read status + quick actions
- [ ] Support: tickets + conversation history + support timeline + start session
- [ ] Documents: list + preview/download/print (mock)
- [ ] Audit: timeline of every event with before/after, IP/browser
- [ ] Settings: read-only feature flags, integrations, branding, admissions/public settings/payment methods/notifications

### 5) Performance optimization
- [ ] Virtualize long timelines in `Timeline` usage (if needed)
- [ ] Memoize charts/derived values in each section
- [ ] Memoize table row renderers (where appropriate)
- [ ] Structure timeline events to be WebSocket-ready

### 6) Validation
- [ ] Run production build: `npm run build` in `Frontend`
- [ ] Verify routes:
  - `/admin/hostels` grid
  - `/admin/hostels/:id/overview` and each sidebar section
- [ ] Responsive checks: desktop/tablet/mobile
- [ ] Verify no duplicated components were introduced; reuse existing design system

