# TODO

- [ ] Step 1: Global dark premium UI (ensure no light surfaces remain)
  - [ ] Frontend/src/index.css verify palette + add missing dark surfaces
  - [ ] Frontend/src/Superadmin/HostelManagement.jsx remove light bg/card colors
  - [ ] Frontend/src/components/PublicHostelPage.jsx darkify premium rooms/cards/sections

- [ ] Step 2: Quick access arrow buttons / card navigation works (Owner + Superadmin)
  - [ ] Audit Owner dashboard quick access click handling and any z-index/click blockers
  - [ ] Audit Superadmin bottom nav / quick access navigation

- [ ] Step 3: Owner dashboard improvements (welcome owner + hostel name, quote, stats)
  - [ ] Frontend/src/owner/Dashboard.jsx replace placeholders with real values
  - [ ] Backend: confirm/extend /api/owner/dashboard response if needed

- [ ] Step 4: Owner Rooms add/edit input clickability + typing
  - [ ] Frontend/src/owner/Rooms.jsx click-block audit (z-index/pointer-events/overlays)

- [ ] Step 5: Owner Payments add inputs clickability + submit end-to-end
  - [ ] Frontend/src/owner/Payments.jsx click-block audit + file input + select

- [ ] Step 6: QR system stabilization
  - [ ] Frontend/src/owner/Profile.jsx confirm display/download URLs
  - [ ] Frontend/src/Superadmin/HostelManagement.jsx confirm buildQrUrl usage
  - [ ] Frontend/src/components/PublicHostelPage.jsx verify QR route rendering

- [ ] Step 7: Admin hostel delete option required
  - [ ] Backend: endpoint exists (verify)
  - [ ] Frontend/src/Superadmin/HostelManagement.jsx add delete button + confirmation modal
  - [ ] toast.success("Hostel deleted") + refresh UI

- [ ] Step 8: Resident registration public page improvements
  - [ ] Frontend/src/components/PublicHostelPage.jsx add clear contact card (tel + WhatsApp)

- [ ] Step 9: Public hostel page premium improvements
  - [ ] Enhance owner contact card, hostel banner, premium CTA buttons


