# HostelMate TODO

## Phase 1 — Activation + Auth + Subscription Foundation

### Task 1 — Password Security Standardization (bcrypt-only for new passwords)
- [x] resetOwnerTempPassword(): store bcrypt hash in `Owner.password` while keeping plaintext temp password in `Owner.tempPassword`.
- [x] addHostel(): hash `ownerPassword` with bcryptjs before storing in `Owner.password`; keep plaintext in `Owner.tempPassword`.
- [ ] finalizeHostelActivation(): verify it already hashes tempPassword into `Owner.password` (should remain).
- [ ] remove/add any additional owner creation flows if present.
- [ ] Add/verify TODO comments for legacy plaintext login fallback removal.

### Task 2 — Admin Host Activation Bug
- [ ] adminController.addHostel(): ensure `hostel.pendingActivation = false` during creation.

### Task 3 — Unified Activation Service Preparation
- [ ] create services/activationService.js
- [ ] refactor finalizeHostelActivation() and addHostel() to use service (without changing APIs)

### Task 4 — Subscription/Hostel Sync Fix
- [ ] adminController.updateSubscription(): sync matching Hostel fields

### Task 5 — Session/Lifecycle Consistency
- [ ] verifySession(): reuse getSubscriptionStatus() lifecycle calculation

### Task 6 — Onboarding Completion Integrity
- [ ] enforce required steps before setting `onboardingCompleted=true`

