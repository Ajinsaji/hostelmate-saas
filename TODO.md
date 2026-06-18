# TODO (HostelMate Bug Fixes)

## Step 1 - Backend: ensure activation updates request status correctly
- Verify approveHostel updates HostelRequest.status to activation_pending.
- Verify finalizeHostelActivation updates HostelRequest.status to activated (and/or approved if required by UI specs).
- Ensure GET /api/hostel-request/status/:phone returns { status: "activated" } after activation.

## Step 2 - Backend: fix activation_pending → activated mapping
- Update finalizeHostelActivation: change related request status assignment.
- Ensure schema enum allows activated.

## Step 3 - Frontend: status page UI rendering
- Update RequestStatus.jsx to render centered cards for:
  - activated: 🎉 Hostel Activated + centered card + Login Now button
  - approved: 🟢 Documents Approved + waiting message
  - activation_pending: 🟢 Waiting For Activation + pending message
- Remove/avoid “Request already exists” UI/toast behavior; when alreadyExists=true render the centered status card.

## Step 4 - Verification
- Run manual flow verification:
  - Submit request → admin approve → owner activation
  - Confirm HostelRequest.status becomes "activated" in DB/log.
  - Confirm status API returns activated.
  - Confirm RequestStatus UI shows activated card.

