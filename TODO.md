# HostelMate OS - Fixes TODO

## Step 1: Quick Access card clickability
- [x] Update ActionButton card to support hover + touch feedback
- [x] Add keyboard accessibility (Enter/Space) and role/tabIndex
- [ ] Verify no overlay blocks pointer events


## Step 2: Owner Create Room form typing bug
- [ ] Audit owner/Rooms create-room form wrappers for pointer-events/z-index/overlays
- [ ] Ensure inputs remain clickable/editable when add form is shown

## Step 3: Hostel registration/public contact section
- [ ] Update PublicHostelPage (and any public flow pages) to show:
  - [ ] Hostel Name
  - [ ] Owner Name
  - [ ] Phone number with tel link
  - [ ] WhatsApp button using https://wa.me/91${phone}

## Step 4: Superadmin manual add hostel end-to-end
- [ ] Verify AddHostel entry point (route + button)
- [ ] Verify POST /api/admin/hostels/add works with FormData
- [ ] Confirm response includes QR + credentials and frontend renders them

## Step 5: QR images preview/download/public onboarding
- [ ] Verify QR URL construction (buildQrUrl) matches backend /uploads serving
- [ ] Confirm QR preview renders
- [ ] Confirm QR download uses correct URL
- [ ] Confirm public onboarding page can be reached via /h/:uniqueCode

## Step 6: Global dark premium theme + contrast
- [ ] Update index.css variables for dark theme
- [ ] Ensure cards, inputs, text, modals, tables are readable


