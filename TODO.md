# TODO - Fix Admin Hostel Management 500 + Validation/UI

## Step 1: Backend - safe getAllHostels
- Update `Backend/controllers/adminController.js` `getAllHostels` to avoid crashes when hostel docs miss fields.
- Use `Hostel.find().lean()` + `safeHostels` mapping.
- Add proper `console.error("Error fetching hostels:", error);` logging.

## Step 2: Frontend - defensive field access
- Update `Frontend/src/Superadmin/HostelManagement.jsx`:
  - Replace any `hostel.subscriptionStatus.toLowerCase()`-style calls with `(hostel.subscriptionStatus || "").toLowerCase()`.
  - Replace `hostel.uniqueCode.includes(...)` with `(hostel.uniqueCode || "").includes(...)`.
  - Ensure other potentially undefined fields are accessed safely.

## Step 3: Backend - schema defaults
- Update `Backend/models/Hostel.js` to add defaults for:
  - `subscriptionStatus` => "trial"
  - `planType` => "Basic"
  - `isPublic` => true
- Ensure schema includes/keeps `uniqueCode`, `publicUrl`, `qrCodeUrl` (string fields).

## Step 4: Validation - manually adding hostel
- Update `Backend/controllers/adminController.js` `addHostel` + related front-end add-hostel form to:
  - Require phone number exactly 10 digits.
  - Add country code selector.
  - Prevent submission if invalid.

## Step 5: UI - login page enhancements
- Update login page(s) to:
  - Add password show/hide toggle.
  - Keep existing premium mobile UI.

## Step 6: Test & run
- Run backend/frontend lint/build or start app.
- Confirm `/api/admin/hostels` returns 200 with safe defaults.

## Step 7: Git commit/push
- Commit: `fixed admin hostel 500 issue and added validation improvements`
- Push to `origin main`

