# HostelMate OS — Stabilization Work Log

## Phase 1 — Centralized API Migration (in progress)
- [ ] Replace raw `axios` usage with `api` client in all Frontend files (remove `import axios from "axios";`).
- [ ] Ensure every migrated file imports: `import { api } from "../services/api";` (correct relative path).

## Phase 2 — Auth Stabilization (not started)
- [ ] Audit `localStorage.getItem("token")` vs `localStorage.getItem("adminToken")` usage.
- [ ] Add `OwnerProtectedRoute` and `AdminProtectedRoute`.
- [ ] Fix `Frontend/src/services/api.js` interceptor to use correct token for admin vs owner.

## Phase 3 — QR Repair (not started)
- [ ] Verify `/uploads` static serving.
- [ ] Fix frontend QR image URL building.
- [ ] Verify onboarding flow end-to-end.

## Phase 4 — Upload System Repair (not started)
- [ ] Verify multer field names match `FormData` keys.
- [ ] Fix upload previews.

## Phase 5+ — Buttons/forms/CRUD refresh/polish (not started)
- [ ] Stabilize handlers, loading states, toast feedback.
- [ ] Ensure CRUD pages refetch after mutations.
- [ ] Mobile-first UX fixes.

