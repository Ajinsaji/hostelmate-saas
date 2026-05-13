# HOSTELMATE FINAL PRODUCTION FIX ROUND - TODO

## Step 1: QR uploads + logging (backend)
- [x] Update `Backend/utils/qrCodeService.js`
  - [x] Add requested logs: `QR FILE:` and `QR PATH:`
  - [x] Ensure uploads directory is created



## Step 2: Frontend QR URL builder
- [x] Add/confirm `buildQrUrl` helper in frontend (recommended in `Frontend/src/services/api.js` or a small util file)
- [ ] Update all QR `<img>` src + download links to use `buildQrUrl`


## Step 3: Owner profile navigation + clickable styling
- [ ] Fix `Frontend/src/owner/Profile.jsx` menu items to navigate to the correct routes instead of `toast("coming soon")`
- [ ] Ensure clickable cards have `cursor: pointer` (and consistent click handlers)

## Step 4: Quick access arrow cards (admin/owner)
- [ ] Locate the dashboard components that render quick access arrow cards
- [ ] Ensure each arrow/card calls `navigate("/route")`

## Step 5: Input cursor color issue
- [ ] Verify `Frontend/src/index.css` has the required `.input-field:focus` and `.input-field` rules

## Step 6: Resident avatar production URL
- [ ] Ensure resident avatar uses `${import.meta.env.VITE_API_URL}/uploads/...`
- [ ] Add fallback image handling

## Step 7: QR direct URL test procedure
- [ ] After deploying, test `https://hostelmate-saas-1.onrender.com/uploads/FILENAME.png`

## Step 8: Validate all production requirements
- [ ] Verify QR visible
- [ ] Verify resident avatar visible
- [ ] Verify cursor visible
- [ ] Verify navigation buttons work
- [ ] Verify quick access arrows work

