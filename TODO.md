# TODO - Hostelmate UI/UX Improvements

## Step 1: Implement quick actions + tel/WhatsApp links
- [x] Update `Frontend/src/Superadmin/HostelManagement.jsx` to wrap owner phone with `tel:${phone}`
- [x] Add WhatsApp quick action using `https://wa.me/91${phone}`
- [x] Add quick action row (Call / WhatsApp / Public Link / View QR) in hostel cards

## Step 2: Remove Edit Hostel CRUD controls
- [ ] Verify whether “Edit Hostel” exists in `HostelManagement.jsx` and remove it if present

## Step 3: Convert entire project theme to white SaaS
- [ ] Update `Frontend/src/index.css` variables and global styles to white theme:
  - BG: #F7F8FA
  - Cards: #FFFFFF
  - Primary green: #0F5D46
  - Accent gold: #D4AF37
  - Text: #1A1A1A
- [ ] Remove/soften excessive dark backgrounds/overlays (body gradient-header, card/glass colors)

## Step 4: Validate
- [ ] Run frontend build/dev and confirm tel/WhatsApp links work + no broken styles

