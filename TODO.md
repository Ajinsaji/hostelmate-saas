# HostelMate OS - Execution TODO

## Milestone 0 — Repo audit (now)
- [x] Collected file structure overview (frontend + backend).
- [x] Identified mismatches: react-hot-toast vs required react-toastify, inconsistent axios usage, token handling issues.

## Milestone 1 — Central API + token handling
- [ ] Update all frontend pages to use `Frontend/src/services/api.js` (single axios instance).
- [ ] Standardize token storage keys:
  - [ ] owner token: `localStorage.getItem('token')`
  - [ ] admin token: `localStorage.getItem('adminToken')`
- [ ] Fix `ProtectedRoute.jsx` to support admin routes and owner routes.
- [ ] Standardize logout + 401 redirect logic.

## Milestone 2 — React Toastify everywhere
- [ ] Install/enable `react-toastify` in frontend root.
- [ ] Remove/replace `react-hot-toast` usage.
- [ ] Ensure every action shows toast success/error.

## Milestone 3 — Backend controller response correctness
- [ ] Audit and fix duplicated/invalid `res.status(...).json(...)` blocks.
- [ ] Ensure all controller functions:
  - [ ] have exactly one response path
  - [ ] return after errors
  - [ ] preserve existing response shape expected by frontend
- [ ] Focus first:
  - [ ] `Backend/controllers/adminController.js`
  - [ ] `Backend/controllers/paymentController.js`
  - [ ] `Backend/controllers/roomController.js`
  - [ ] `Backend/controllers/publicController.js`
  - [ ] `Backend/controllers/requestController.js`
  - [ ] `Backend/controllers/ownerController.js`

## Milestone 4 — QR onboarding end-to-end
- [ ] Verify QR/hostel creation flow returns required fields.
- [ ] Ensure public hostel page loads by unique code.
- [ ] Ensure admission submit with multer uploads creates `PublicAdmission`.
- [ ] Ensure owner approvals create `Resident` + update `Bed` occupancy.
- [ ] Add frontend loading + toasts for each step.

## Milestone 5 — CRUD refresh correctness
- [ ] Rooms CRUD refresh after create/edit/delete.
- [ ] Residents CRUD refresh after create/edit/delete/checkout.
- [ ] Payments create/verify/delete refresh lists + statuses.
- [ ] Superadmin request approve/reject refresh list.

## Milestone 6 — Loading states + button disable
- [ ] Add loading state per button action (spinners/disabled).
- [ ] Add skeletons or inline placeholders for lists/dashboards.

## Milestone 7 — Lightweight premium UI polish (after functional correctness)
- [ ] Mobile-first improvements on navigation + touch targets.
- [ ] Glassmorphism cards + gold accents (palette already partially done).

## Milestone 8 — Validation
- [ ] Run backend + frontend.
- [ ] Manually test all flows listed in mission.

