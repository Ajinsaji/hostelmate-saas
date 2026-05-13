# HostelMate - Execution TODO

- [x] 1) SETTINGS hover color global fix in `Frontend/src/index.css`

- [x] 2) Partial payment system
  - [x] 2a) Backend: extend `Backend/controllers/paymentController.js` to persist `cashAmount/onlineAmount/paymentSplit/paidAmount` when `paymentMethod === "partial"`
  - [x] 2b) Frontend: update `Frontend/src/owner/Payments.jsx` UI to show cash/online split fields only for partial

- [ ] 3) Resident details page
  - [ ] 3a) Create `Frontend/src/owner/ResidentDetails.jsx`
  - [ ] 3b) Add route `/resident/:id` in `Frontend/src/App.jsx`
  - [ ] 3c) Update `Frontend/src/owner/Residents.jsx` to include “View More” navigation
- [ ] 4) Shared QR helper + apply to QR download links + QR images where applicable
  - [ ] 4a) Create helper `Frontend/src/utils/buildQrUrl.js`
  - [ ] 4b) Update owner QR usage in `Frontend/src/owner/Profile.jsx`
  - [ ] 4c) Search and update other QR usage across `Frontend/src`
- [ ] 5) Resident admission form dark theme autofill fix (global inputs)
  - [ ] 5a) Update `Frontend/src/index.css` for dark autofill + consistent text color
- [ ] 6) Owner profile navigation

  - [ ] 6a) Add missing routes in `Frontend/src/App.jsx`
  - [ ] 6b) Create minimal pages with dark glass UI:
    - [ ] `/owner/settings`
    - [ ] `/owner/profile`
    - [ ] `/owner/update-password`
    - [ ] `/owner/bank-details`
    - [ ] `/owner/support`
- [ ] 7) Micro-UX only for dashboard badge (smoother pulse/spacing/refresh handling)
  - [ ] 7a) Verify `Frontend/src/owner/Dashboard.jsx` badge animation/polling; improve without changing logic


