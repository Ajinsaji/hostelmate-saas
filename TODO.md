# HostelMate Cloudinary Safe Migration TODO

## Phase 1 — Identify + confirm flows (done)
- Verify Cloudinary config + cloudinaryUpload middleware.
- Identify upload routes currently using local multer.diskStorage.
- Inspect controllers for how file URLs are persisted.

## Phase 2 — Implement production-safe migration
1. Switch routes to use `Backend/middleware/cloudinaryUpload.js`:
   - `Backend/routes/residentRoutes.js`
   - `Backend/routes/paymentRoutes.js`
   - `Backend/routes/publicRoutes.js`
   - `Backend/routes/requestRoutes.js`
   - `Backend/routes/adminRoutes.js`
2. Update controllers to persist Cloudinary `secure_url` (via `getUploadedFileUrl()`):
   - `Backend/controllers/publicController.js`
   - any controller paths touched by route changes
3. QR Cloudinary migration:
   - Rewrite `Backend/utils/qrCodeService.js` to upload generated QR to Cloudinary
   - Ensure DB field gets Cloudinary full `secure_url`
4. Create migration report:
   - `CLOUDINARY_MIGRATION_REPORT.md`

## Phase 3 — Validate
- Old local uploads still render.
- New uploads render from Cloudinary.
- QR images persist after redeploy.
- Payment proof + public admission uploads + resident signatures/photos display correctly.

