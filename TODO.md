# TODO - Hostelmate 2-phase approval + subscription setup + owner notifications

## Phase 1: Backend split approval into 2 steps
- [ ] Add `pendingActivation` field to `Backend/models/Hostel.js`
- [ ] Update `Backend/controllers/adminController.js`:
  - [ ] Rewrite `approveHostel` to create hostel draft + QR only
  - [ ] Store draft subscription data (minimal fields to support finalize)
  - [ ] Return `{ success: true, hostelId, requiresSubscriptionSetup: true }`
  - [ ] Do NOT create `Owner`
  - [ ] Do NOT mark request as approved
- [ ] Add finalize endpoint in `Backend/controllers/adminController.js`
  - [ ] POST `/api/admin/finalize-hostel-activation/:hostelId`
  - [ ] Validate subscription draft
  - [ ] Create `Subscription`
  - [ ] Create `Owner`
  - [ ] Update `Hostel.pendingActivation=false` and subscription display fields
  - [ ] Update `HostelRequest.status="approved"`
  - [ ] Send owner confirmation notification (helper call)
- [ ] Update `Backend/routes/adminRoutes.js`:
  - [ ] Wire finalize endpoint

## Phase 1 Notifications helper
- [ ] Create `Backend/utils/sendOwnerWhatsApp.js` (provider-ready placeholder)
- [ ] Create `Backend/utils/sendOwnerNotification.js` if needed for shared interface
- [ ] Integrate helper into finalize endpoint (ONLY after activation)

## Phase 2: Frontend subscription setup workflow
- [ ] Create `Frontend/src/Superadmin/SubscriptionSetup.jsx`
  - [ ] hostel details card
  - [ ] plan dropdown (Trial/Monthly/Yearly)
  - [ ] duration + start/end dates
  - [ ] free access toggle
  - [ ] save & activate button
  - [ ] call finalize endpoint
- [ ] Update `Frontend/src/Superadmin/PendingRequests.jsx`:
  - [ ] On approve click call approve endpoint
  - [ ] If response.requiresSubscriptionSetup navigate(`/admin/subscription-setup/${hostelId}`)
  - [ ] Prevent any “approved success” modal that assumes credentials/owner already exist

## Must-change-password (security)
- [ ] Add `mustChangePassword` to `Backend/models/Owner.js`
- [ ] Enforce `/change-password` redirect in owner app after login

## Verification
- [ ] Run `npm run build` for Backend + Frontend
- [ ] Manual test:
  - [ ] Approve pending request -> redirect to subscription setup -> save -> owner created -> login works
  - [ ] Ensure delete/reject functionality still works

